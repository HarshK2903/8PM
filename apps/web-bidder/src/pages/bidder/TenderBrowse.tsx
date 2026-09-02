import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Calendar, Building2, Upload, FileText, Loader2, X, Clock } from 'lucide-react'

export default function TenderBrowse() {
  const [tenders, setTenders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.get('/tenders').then(r => setTenders(r.data.items || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    if (!selected || files.length === 0) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('tender_id', selected.id)
      files.forEach(f => fd.append('documents', f))
      await api.post('/bids', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSuccess('Bid submitted successfully!')
      setFiles([])
      setTimeout(() => { setSelected(null); setSuccess('') }, 2000)
    } catch (err: any) {
      setSuccess(err.response?.data?.error || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const filtered = tenders.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.department?.toLowerCase().includes(search.toLowerCase())
  )

  function getTimeLeft(deadline: string) {
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d left`
    const hrs = Math.floor(diff / 3600000)
    return `${hrs}h left`
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse tenders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{tenders.length} published tenders</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by title or department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FileText size={32} className="mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No tenders found</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => {
            const expired = t.deadline && new Date(t.deadline) < new Date()
            return (
              <Card key={t.id} className="hover:border-border/80 transition-colors">
                <CardContent className="pt-5 pb-4">
                  <h3 className="text-sm font-semibold leading-snug mb-2">{t.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Building2 size={12} /> {t.department || 'General'}</span>
                    {t.deadline && (
                      <span className={`flex items-center gap-1 ${expired ? 'text-destructive' : 'text-amber-400'}`}>
                        <Clock size={12} /> {getTimeLeft(t.deadline)}
                      </span>
                    )}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>}
                  {t.required_documents?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.required_documents.slice(0, 3).map((d: string) => (
                        <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{d.replace(/_/g, ' ')}</span>
                      ))}
                      {t.required_documents.length > 3 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">+{t.required_documents.length - 3}</span>}
                    </div>
                  )}
                  <Button size="sm" variant="outline" disabled={expired} onClick={() => setSelected(t)} className="w-full">
                    {expired ? 'Deadline passed' : 'Submit bid'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bid submission dialog */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setFiles([]); setSuccess('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Submit bid</DialogTitle>
            <p className="text-sm text-muted-foreground">{selected?.title}</p>
          </DialogHeader>
          {success ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <FileText size={20} className="text-emerald-400" />
              </div>
              <p className="text-sm font-medium">{success}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Upload documents</Label>
                  <label className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 transition-colors cursor-pointer">
                    <Upload size={20} className="text-muted-foreground mb-1.5" />
                    <span className="text-xs text-muted-foreground">Click to upload or drag files</span>
                    <input type="file" multiple className="hidden" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="space-y-1.5">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary text-sm">
                        <span className="truncate flex-1">{f.name}</span>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground ml-2"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSubmit} disabled={submitting || files.length === 0}>
                  {submitting ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Submitting...</> : `Submit ${files.length} file${files.length !== 1 ? 's' : ''}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
