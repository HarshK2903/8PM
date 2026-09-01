import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { Shield, FileText, ClipboardCheck, Users, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  change?: string
}

export default function OfficerDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatCard[]>([])
  const [recentBids, setRecentBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [tendersRes] = await Promise.all([
        api.get('/tenders?per_page=100').catch(() => ({ data: { items: [] } })),
      ])
      const tenders = tendersRes.data.items || []

      setStats([
        { label: 'Active Tenders', value: tenders.filter((t: any) => t.status === 'published').length, icon: <FileText size={24} />, color: 'text-accent-400', change: '+2 this week' },
        { label: 'Pending Reviews', value: 0, icon: <ClipboardCheck size={24} />, color: 'text-warning-400', change: 'Needs attention' },
        { label: 'Approved Bids', value: 0, icon: <CheckCircle2 size={24} />, color: 'text-success-400', change: 'This month' },
        { label: 'Risk Alerts', value: 0, icon: <AlertTriangle size={24} />, color: 'text-danger-400', change: 'Active flags' },
      ])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-navy-400 mt-1">Here's your procurement compliance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {stats.map((stat, i) => (
          <div key={i} className="glass rounded-xl p-5 hover:glow-blue transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className={stat.color}>{stat.icon}</span>
              <span className="text-xs text-navy-500">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-navy-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => navigate('/officer/tenders')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-navy-800/50 hover:bg-accent-500/10 transition-all cursor-pointer group">
              <FileText size={20} className="text-accent-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-navy-200 group-hover:text-white">Create New Tender</p>
                <p className="text-xs text-navy-500">Post a new procurement tender</p>
              </div>
            </button>
            <button onClick={() => navigate('/officer/compliance')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-navy-800/50 hover:bg-warning-500/10 transition-all cursor-pointer group">
              <ClipboardCheck size={20} className="text-warning-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-navy-200 group-hover:text-white">Review Pending Bids</p>
                <p className="text-xs text-navy-500">AI-scored bids awaiting your review</p>
              </div>
            </button>
            <button onClick={() => navigate('/officer/audit')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-navy-800/50 hover:bg-navy-700/50 transition-all cursor-pointer group">
              <Clock size={20} className="text-navy-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-navy-200 group-hover:text-white">View Audit Trail</p>
                <p className="text-xs text-navy-500">Complete verification history</p>
              </div>
            </button>
          </div>
        </div>

        {/* AI Pipeline Status */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">AI Pipeline Status</h2>
          <div className="space-y-4">
            {['OCR Engine', 'Verification API', 'Scoring Engine', 'Recommendation AI'].map((service, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
                  <span className="text-sm text-navy-300">{service}</span>
                </div>
                <span className="text-xs text-success-400 font-medium">Operational</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-navy-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-navy-500">Avg. processing time</span>
              <span className="text-accent-400 font-medium">~8.2s per bid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
