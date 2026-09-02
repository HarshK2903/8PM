import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Search, ShieldCheck, ArrowRight, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react'

const statusBadge: Record<string, { label: string; class: string }> = {
  submitted: { label: 'Submitted', class: 'status-info' },
  under_review: { label: 'Review', class: 'status-warning' },
  approved: { label: 'Approved', class: 'status-success' },
  rejected: { label: 'Rejected', class: 'status-danger' },
  ai_processing: { label: 'Processing', class: 'status-info' },
  clarification_needed: { label: 'Clarification', class: 'status-warning' },
}

export default function ComplianceReview() {
  const navigate = useNavigate()
  const [tenders, setTenders] = useState<any[]>([])
  const [selectedTender, setSelectedTender] = useState<string>('')
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bidsLoading, setBidsLoading] = useState(false)
  const [deciding, setDeciding] = useState<string | null>(null)

  useEffect(() => {
    api.get('/tenders').then(r => {
      const items = r.data.items || []
      setTenders(items)
      if (items.length > 0) { setSelectedTender(items[0].id); loadBids(items[0].id) }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function loadBids(tenderId: string) {
    setBidsLoading(true)
    try {
      const { data } = await api.get(`/tenders/${tenderId}/bids`)
      setBids(data.items || [])
    } catch { setBids([]) }
    finally { setBidsLoading(false) }
  }

  async function handleDecision(bidId: string, decision: string) {
    setDeciding(bidId)
    try {
      await api.post(`/bids/${bidId}/decision`, { decision, justification: `Officer ${decision} — compliance review` })
      loadBids(selectedTender)
    } catch (err) { console.error(err) }
    finally { setDeciding(null) }
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance review</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review AI-scored bids and make decisions</p>
      </div>

      {/* Tender selector */}
      {loading ? <Skeleton className="h-10 w-64" /> : (
        <div className="flex gap-2 flex-wrap">
          {tenders.map(t => (
            <Button key={t.id} size="sm"
              variant={selectedTender === t.id ? 'default' : 'outline'}
              onClick={() => { setSelectedTender(t.id); loadBids(t.id) }}
              className="text-xs">
              {t.title?.slice(0, 30)}{t.title?.length > 30 ? '...' : ''}
            </Button>
          ))}
        </div>
      )}

      {/* Bids table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Bids {bids.length > 0 && `(${bids.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bidsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : bids.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No bids for this tender</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bidder</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map(bid => {
                  const s = statusBadge[bid.status] || { label: bid.status, class: 'status-muted' }
                  return (
                    <TableRow key={bid.id}>
                      <TableCell className="font-medium text-sm">{bid.bidder_name || bid.bidder_id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{bid.organization || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${s.class}`}>{s.label}</Badge></TableCell>
                      <TableCell>
                        {bid.compliance_score != null ? (
                          <span className={`text-sm font-mono font-medium ${bid.compliance_score >= 70 ? 'text-emerald-400' : bid.compliance_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {bid.compliance_score.toFixed(0)}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate(`/officer/compliance/${bid.id}`)}>
                            <ShieldCheck size={12} className="mr-1" /> Details
                          </Button>
                          {bid.status !== 'approved' && bid.status !== 'rejected' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-400 hover:text-emerald-300"
                                disabled={deciding === bid.id} onClick={() => handleDecision(bid.id, 'approve')}>
                                {deciding === bid.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300"
                                disabled={deciding === bid.id} onClick={() => handleDecision(bid.id, 'reject')}>
                                <XCircle size={12} />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-400 hover:text-amber-300"
                                disabled={deciding === bid.id} onClick={() => handleDecision(bid.id, 'clarify')}>
                                <MessageSquare size={12} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
