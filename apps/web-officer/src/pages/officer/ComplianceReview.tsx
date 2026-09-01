import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { ClipboardCheck, AlertTriangle, CheckCircle2, XCircle, Clock, ChevronRight, Shield, Loader2, Info, Eye } from 'lucide-react'

interface BidReview {
  id: string; bidder_id: string; status: string; bid_amount: number | null;
  submitted_at: string; bidder_name: string; organization: string | null;
  compliance_score: number | null; risk_level: string | null;
}

const riskColors: Record<string, string> = {
  low: 'text-success-400', medium: 'text-warning-400', high: 'text-danger-400', critical: 'text-danger-500',
}

const statusIcons: Record<string, React.ReactNode> = {
  submitted: <Clock size={16} className="text-accent-400" />,
  ai_processing: <Loader2 size={16} className="text-warning-400 animate-spin" />,
  under_review: <Eye size={16} className="text-info-400" />,
  approved: <CheckCircle2 size={16} className="text-success-400" />,
  rejected: <XCircle size={16} className="text-danger-400" />,
  clarification: <AlertTriangle size={16} className="text-warning-400" />,
}

export default function ComplianceReview() {
  const [tenders, setTenders] = useState<any[]>([])
  const [selectedTender, setSelectedTender] = useState<string | null>(null)
  const [bids, setBids] = useState<BidReview[]>([])
  const [loading, setLoading] = useState(true)
  const [bidsLoading, setBidsLoading] = useState(false)
  const [selectedBid, setSelectedBid] = useState<BidReview | null>(null)
  const [decisionLoading, setDecisionLoading] = useState(false)

  useEffect(() => { loadTenders() }, [])

  async function loadTenders() {
    try {
      const { data } = await api.get('/tenders?per_page=50')
      setTenders(data.items || [])
      if (data.items?.length > 0) {
        setSelectedTender(data.items[0].id)
        loadBids(data.items[0].id)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function loadBids(tenderId: string) {
    setBidsLoading(true)
    try {
      const { data } = await api.get(`/tenders/${tenderId}/bids`)
      setBids(data.items || [])
    } catch (err) { setBids([]) }
    finally { setBidsLoading(false) }
  }

  async function handleDecision(bidId: string, decision: string, reason: string = '') {
    setDecisionLoading(true)
    try {
      await api.post(`/bids/${bidId}/decision`, { decision, reason })
      if (selectedTender) loadBids(selectedTender)
      setSelectedBid(null)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Decision failed')
    } finally { setDecisionLoading(false) }
  }

  function ScoreGauge({ score, label, size = 'sm' }: { score: number; label: string; size?: 'sm' | 'lg' }) {
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444'
    const r = size === 'lg' ? 36 : 22
    const circumference = 2 * Math.PI * r
    const offset = circumference - (score / 100) * circumference

    return (
      <div className="flex flex-col items-center gap-1">
        <svg width={r * 2 + 8} height={r * 2 + 8} className="transform -rotate-90">
          <circle cx={r + 4} cy={r + 4} r={r} fill="none" stroke="#1e293b" strokeWidth={size === 'lg' ? 6 : 4} />
          <circle cx={r + 4} cy={r + 4} r={r} fill="none" stroke={color} strokeWidth={size === 'lg' ? 6 : 4}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <span className={`absolute ${size === 'lg' ? 'text-xl font-bold' : 'text-xs font-semibold'} text-white`}>
          {score.toFixed(0)}
        </span>
        <span className="text-[10px] text-navy-500 mt-1">{label}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Compliance Review</h1>
        <p className="text-navy-400 mt-1">AI-scored bids ranked by compliance. Approve, reject, or request clarification.</p>
      </div>

      {/* Tender selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tenders.map(t => (
          <button key={t.id} onClick={() => { setSelectedTender(t.id); loadBids(t.id) }}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
              ${selectedTender === t.id ? 'gradient-accent text-white' : 'glass text-navy-400 hover:text-white'}`}>
            {t.title.length > 30 ? t.title.slice(0, 30) + '...' : t.title}
            <span className="ml-2 text-xs opacity-70">({t.bid_count})</span>
          </button>
        ))}
      </div>

      {/* Bids Table */}
      {bidsLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-accent-400 animate-spin" /></div>
      ) : bids.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <ClipboardCheck size={48} className="text-navy-600 mx-auto mb-4" />
          <p className="text-navy-400">No bids submitted for this tender yet</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-navy-500 uppercase">Bidder</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-navy-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-navy-500 uppercase">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-navy-500 uppercase">Score</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-navy-500 uppercase">Risk</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-navy-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bids.map(bid => (
                <tr key={bid.id} className="border-b border-navy-800/30 hover:bg-navy-800/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{bid.bidder_name}</p>
                    <p className="text-xs text-navy-500">{bid.organization || 'Individual'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-sm">
                      {statusIcons[bid.status]}
                      <span className="text-navy-300 capitalize">{bid.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-medium text-white">
                      {bid.bid_amount ? `₹${(bid.bid_amount / 100000).toFixed(1)}L` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {bid.compliance_score != null ? (
                      <span className={`text-sm font-bold ${bid.compliance_score >= 75 ? 'text-success-400' : bid.compliance_score >= 50 ? 'text-warning-400' : 'text-danger-400'}`}>
                        {bid.compliance_score.toFixed(1)}
                      </span>
                    ) : <span className="text-xs text-navy-600">Pending</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {bid.risk_level ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${riskColors[bid.risk_level]} bg-navy-800/50`}>
                        {bid.risk_level}
                      </span>
                    ) : <span className="text-xs text-navy-600">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {bid.status === 'under_review' || bid.status === 'submitted' ? (
                        <>
                          <button onClick={() => handleDecision(bid.id, 'approve')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-success-500/15 text-success-400 hover:bg-success-500/25 transition-colors cursor-pointer">
                            Approve
                          </button>
                          <button onClick={() => handleDecision(bid.id, 'reject', 'Does not meet requirements')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-danger-500/15 text-danger-400 hover:bg-danger-500/25 transition-colors cursor-pointer">
                            Reject
                          </button>
                          <button onClick={() => handleDecision(bid.id, 'clarify', 'Additional documents needed')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-warning-500/15 text-warning-400 hover:bg-warning-500/25 transition-colors cursor-pointer">
                            Clarify
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-navy-500">Decided</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
