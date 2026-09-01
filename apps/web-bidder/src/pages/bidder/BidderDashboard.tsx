import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { FileText, Send, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react'

export default function BidderDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [myBids, setMyBids] = useState<any[]>([])
  const [tenders, setTenders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [bidsRes, tendersRes] = await Promise.all([
        api.get('/bids/my').catch(() => ({ data: { items: [] } })),
        api.get('/tenders?per_page=5').catch(() => ({ data: { items: [] } })),
      ])
      setMyBids(bidsRes.data.items || [])
      setTenders(tendersRes.data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    submitted: 'text-accent-400 bg-accent-500/10',
    ai_processing: 'text-warning-400 bg-warning-500/10',
    under_review: 'text-info-400 bg-info-500/10',
    approved: 'text-success-400 bg-success-500/10',
    rejected: 'text-danger-400 bg-danger-500/10',
    clarification: 'text-warning-400 bg-warning-500/10',
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-navy-400 mt-1">Track your bids and explore new tender opportunities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bids', value: myBids.length, icon: <Send size={22} />, color: 'text-accent-400' },
          { label: 'Approved', value: myBids.filter(b => b.status === 'approved').length, icon: <CheckCircle2 size={22} />, color: 'text-success-400' },
          { label: 'Pending', value: myBids.filter(b => ['submitted', 'ai_processing', 'under_review'].includes(b.status)).length, icon: <Clock size={22} />, color: 'text-warning-400' },
          { label: 'Action Needed', value: myBids.filter(b => b.status === 'clarification').length, icon: <AlertTriangle size={22} />, color: 'text-danger-400' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl p-5 hover:glow-blue transition-all duration-300">
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-sm text-navy-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Bids */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">My Bids</h2>
          {myBids.length === 0 ? (
            <div className="text-center py-8">
              <Send size={32} className="text-navy-600 mx-auto mb-3" />
              <p className="text-navy-400 text-sm">No bids submitted yet</p>
              <button onClick={() => navigate('/bidder/tenders')}
                className="mt-3 text-sm text-accent-400 hover:text-accent-300 cursor-pointer">Browse open tenders →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {myBids.slice(0, 5).map((bid: any) => (
                <div key={bid.id} className="flex items-center justify-between p-3 rounded-lg bg-navy-800/30 hover:bg-navy-800/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-200 truncate">{bid.tender_title}</p>
                    <p className="text-xs text-navy-500">{bid.tender_ref} • {bid.department}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[bid.status] || 'text-navy-400 bg-navy-800'}`}>
                    {bid.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Tenders */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Open Tenders</h2>
            <button onClick={() => navigate('/bidder/tenders')} className="text-xs text-accent-400 hover:text-accent-300 cursor-pointer">View all</button>
          </div>
          {tenders.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="text-navy-600 mx-auto mb-3" />
              <p className="text-navy-400 text-sm">No open tenders available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenders.map((t: any) => (
                <div key={t.id} className="p-3 rounded-lg bg-navy-800/30 hover:bg-navy-800/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-navy-200 truncate group-hover:text-white">{t.title}</p>
                    <ExternalLink size={14} className="text-navy-600 group-hover:text-accent-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-navy-500">{t.department}</span>
                    <span className="text-xs text-navy-600">•</span>
                    <span className="text-xs text-warning-400">Due: {new Date(t.submission_deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
