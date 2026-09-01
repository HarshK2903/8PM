import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import { FileText, Calendar, IndianRupee, Search, Upload, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Tender {
  id: string; title: string; reference_number: string; tender_type: string;
  status: string; department: string; estimated_value: number | null;
  submission_deadline: string; officer_name: string; bid_count: number;
}

export default function TenderBrowse() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bidTender, setBidTender] = useState<Tender | null>(null)

  useEffect(() => { loadTenders() }, [])

  async function loadTenders() {
    try {
      const { data } = await api.get('/tenders?per_page=50')
      setTenders(data.items || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = tenders.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Browse Tenders</h1>
        <p className="text-navy-400 mt-1">Find and bid on government procurement opportunities</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, department..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-accent-400 animate-spin" /></div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(t => {
            const daysLeft = Math.ceil((new Date(t.submission_deadline).getTime() - Date.now()) / 86400000)
            return (
              <div key={t.id} className="glass rounded-xl p-6 hover:glow-blue transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-navy-500">{t.reference_number}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400">{t.tender_type}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{t.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-navy-400">
                      <span className="flex items-center gap-1.5"><FileText size={14} /> {t.department}</span>
                      {t.estimated_value && (
                        <span className="flex items-center gap-1.5"><IndianRupee size={14} /> ₹{(t.estimated_value / 10000000).toFixed(2)} Cr</span>
                      )}
                      <span className={`flex items-center gap-1.5 ${daysLeft <= 3 ? 'text-danger-400' : daysLeft <= 7 ? 'text-warning-400' : 'text-navy-400'}`}>
                        <Calendar size={14} /> {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => setBidTender(t)}
                      className="px-5 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                      Submit Bid
                    </button>
                    <span className="text-xs text-navy-500">{t.bid_count} bids submitted</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {bidTender && <BidSubmissionModal tender={bidTender} onClose={() => setBidTender(null)} onSubmitted={() => { setBidTender(null); loadTenders() }} />}
    </div>
  )
}

function BidSubmissionModal({ tender, onClose, onSubmitted }: { tender: Tender; onClose: () => void; onSubmitted: () => void }) {
  const [bidAmount, setBidAmount] = useState('')
  const [files, setFiles] = useState<Record<string, File>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [currentDocType, setCurrentDocType] = useState('')

  const docTypes = ['udyam', 'gst', 'pan', 'income_tax', 'epfo', 'esic', 'oem_authorization', 'startup_certificate', 'company_registration', 'make_in_india']

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0] && currentDocType) {
      setFiles(prev => ({ ...prev, [currentDocType]: e.target.files![0] }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('tender_id', tender.id)
      if (bidAmount) formData.append('bid_amount', bidAmount)
      Object.entries(files).forEach(([docType, file]) => {
        formData.append(docType, file)
      })
      await api.post('/bids', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSuccess(true)
      setTimeout(onSubmitted, 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass rounded-2xl p-12 text-center animate-fade-in-up">
          <CheckCircle2 size={64} className="text-success-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Bid Submitted!</h2>
          <p className="text-navy-400 mt-2">AI verification will begin shortly</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Submit Bid</h2>
          <button onClick={onClose} className="text-navy-400 hover:text-white cursor-pointer"><X size={20} /></button>
        </div>
        <p className="text-sm text-navy-400 mb-4">{tender.title}</p>

        {error && <div className="bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-3 text-danger-400 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-navy-300 mb-1">Bid Amount (₹)</label>
            <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white text-sm focus:border-accent-500 outline-none"
              placeholder="Enter your bid amount" />
          </div>

          <div>
            <label className="block text-sm text-navy-300 mb-2">Upload Documents</label>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
            <div className="grid grid-cols-2 gap-2">
              {docTypes.map(dt => (
                <button key={dt} type="button"
                  onClick={() => { setCurrentDocType(dt); fileRef.current?.click() }}
                  className={`text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer text-left flex items-center gap-2
                    ${files[dt] ? 'border-success-500/40 bg-success-500/10 text-success-400' : 'border-navy-700 text-navy-500 hover:border-navy-500 hover:text-navy-300'}`}>
                  {files[dt] ? <CheckCircle2 size={12} /> : <Upload size={12} />}
                  {dt.replace(/_/g, ' ').toUpperCase()}
                </button>
              ))}
            </div>
            {Object.keys(files).length > 0 && (
              <p className="text-xs text-success-400 mt-2">{Object.keys(files).length} document(s) attached</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg gradient-accent text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : 'Submit Bid'}
          </button>
        </form>
      </div>
    </div>
  )
}
