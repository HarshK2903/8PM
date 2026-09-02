import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText, Users, ShieldCheck, Clock, ArrowRight,
  CheckCircle, XCircle, AlertTriangle, Plus
} from 'lucide-react'

interface Stats {
  total_tenders: number
  total_bids: number
  pending_review: number
  approved_bids: number
}

export default function OfficerDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBids, setRecentBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [tendersRes, bidsRes] = await Promise.all([
        api.get('/tenders').catch(() => ({ data: { items: [] } })),
        api.get('/tenders').then(async res => {
          if (!res.data.items?.length) return []
          const firstTender = res.data.items[0]
          const r = await api.get(`/tenders/${firstTender.id}/bids`).catch(() => ({ data: { items: [] } }))
          return r.data.items || []
        }).catch(() => []),
      ])

      const tenders = tendersRes.data.items || []
      setStats({
        total_tenders: tenders.length,
        total_bids: bidsRes.length,
        pending_review: bidsRes.filter((b: any) => b.status === 'under_review' || b.status === 'submitted').length,
        approved_bids: bidsRes.filter((b: any) => b.status === 'approved').length,
      })
      setRecentBids(bidsRes.slice(0, 5))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statCards = [
    { icon: FileText, label: 'Tenders', value: stats?.total_tenders ?? 0, color: 'text-blue-400' },
    { icon: Users, label: 'Total bids', value: stats?.total_bids ?? 0, color: 'text-emerald-400' },
    { icon: Clock, label: 'Pending review', value: stats?.pending_review ?? 0, color: 'text-amber-400' },
    { icon: CheckCircle, label: 'Approved', value: stats?.approved_bids ?? 0, color: 'text-emerald-400' },
  ]

  const statusBadge: Record<string, { label: string; class: string }> = {
    submitted: { label: 'Submitted', class: 'status-info' },
    under_review: { label: 'Under review', class: 'status-warning' },
    approved: { label: 'Approved', class: 'status-success' },
    rejected: { label: 'Rejected', class: 'status-danger' },
    ai_processing: { label: 'AI Processing', class: 'status-info' },
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Officer'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/officer/compliance')}>
            <ShieldCheck size={14} className="mr-1.5" /> Review bids
          </Button>
          <Button size="sm" onClick={() => navigate('/officer/tenders')}>
            <Plus size={14} className="mr-1.5" /> New tender
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              {loading ? (
                <div className="space-y-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-24" /></div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <s.icon size={18} className={s.color} />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions + Recent bids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { label: 'Create new tender', icon: FileText, to: '/officer/tenders' },
              { label: 'Review compliance', icon: ShieldCheck, to: '/officer/compliance' },
              { label: 'View audit trail', icon: Clock, to: '/officer/audit' },
            ].map((action, i) => (
              <button key={i} onClick={() => navigate(action.to)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent text-sm transition-colors group">
                <span className="flex items-center gap-2.5 text-foreground">
                  <action.icon size={15} className="text-muted-foreground" />
                  {action.label}
                </span>
                <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Recent bids */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent bids</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/officer/compliance')}>
                View all <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentBids.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No bids to show yet</p>
            ) : (
              <div className="space-y-1">
                {recentBids.map((bid: any, i: number) => {
                  const badge = statusBadge[bid.status] || { label: bid.status, class: 'status-muted' }
                  return (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bid.bidder_name || bid.bidder_id?.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{bid.organization || 'Vendor'}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${badge.class}`}>{badge.label}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
