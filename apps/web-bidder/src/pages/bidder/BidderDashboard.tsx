import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Send, Clock, CheckCircle, ArrowRight, XCircle } from 'lucide-react'

const statusBadge: Record<string, { label: string; class: string }> = {
  submitted: { label: 'Submitted', class: 'status-info' },
  under_review: { label: 'Under review', class: 'status-warning' },
  approved: { label: 'Approved', class: 'status-success' },
  rejected: { label: 'Rejected', class: 'status-danger' },
  ai_processing: { label: 'AI Processing', class: 'status-info' },
  clarification_needed: { label: 'Clarification', class: 'status-warning' },
}

export default function BidderDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [bids, setBids] = useState<any[]>([])
  const [tenders, setTenders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/bids/my').then(r => setBids(r.data.items || [])).catch(() => {}),
      api.get('/tenders').then(r => setTenders((r.data.items || []).slice(0, 3))).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const stats = [
    { icon: Send, label: 'Submitted', value: bids.length, color: 'text-blue-400' },
    { icon: Clock, label: 'Pending', value: bids.filter(b => ['submitted', 'under_review', 'ai_processing'].includes(b.status)).length, color: 'text-amber-400' },
    { icon: CheckCircle, label: 'Approved', value: bids.filter(b => b.status === 'approved').length, color: 'text-emerald-400' },
    { icon: XCircle, label: 'Rejected', value: bids.filter(b => b.status === 'rejected').length, color: 'text-red-400' },
  ]

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user?.full_name?.split(' ')[0] || 'Vendor'}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/bidder/tenders')}>
          <FileText size={14} className="mr-1.5" /> Browse tenders
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              {loading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <s.icon size={18} className={`${s.color} mb-2`} />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My bids */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">My bids</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            : bids.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No bids submitted yet</p>
            : (
              <div className="space-y-1">
                {bids.slice(0, 5).map((bid, i) => {
                  const s = statusBadge[bid.status] || { label: bid.status, class: 'status-muted' }
                  return (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{bid.tender_title || 'Tender'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(bid.submitted_at || bid.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${s.class}`}>{s.label}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open tenders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Open tenders</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/bidder/tenders')}>
                View all <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
            : tenders.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No open tenders</p>
            : (
              <div className="space-y-1">
                {tenders.map((t, i) => (
                  <button key={i} onClick={() => navigate('/bidder/tenders')}
                    className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.department || 'General'}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
