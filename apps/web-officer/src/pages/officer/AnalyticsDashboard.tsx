import { useState } from 'react'
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  // Mock analytics data
  const summaryStats = [
    { label: 'Total Tenders', value: 5, change: '+2', trend: 'up', icon: <BarChart3 size={20} /> },
    { label: 'Total Bids', value: 12, change: '+5', trend: 'up', icon: <TrendingUp size={20} /> },
    { label: 'Avg. Compliance', value: '72.4%', change: '+8.2%', trend: 'up', icon: <PieChart size={20} /> },
    { label: 'Avg. Process Time', value: '8.2s', change: '-1.3s', trend: 'down', icon: <Activity size={20} /> },
  ]

  const departmentData = [
    { dept: 'Defence', tenders: 1, bids: 4, avgScore: 78.5 },
    { dept: 'Renewable Energy', tenders: 1, bids: 3, avgScore: 71.2 },
    { dept: 'General Admin', tenders: 1, bids: 2, avgScore: 65.8 },
    { dept: 'Electronics & IT', tenders: 1, bids: 2, avgScore: 82.1 },
    { dept: 'Health & Family Welfare', tenders: 1, bids: 1, avgScore: 55.3 },
  ]

  const riskDistribution = [
    { level: 'Low Risk', count: 5, pct: 42, color: 'bg-success-500' },
    { level: 'Medium Risk', count: 4, pct: 33, color: 'bg-warning-500' },
    { level: 'High Risk', count: 2, pct: 17, color: 'bg-danger-400' },
    { level: 'Critical', count: 1, pct: 8, color: 'bg-danger-600' },
  ]

  const complianceBreakdown = [
    { category: 'MSME/Udyam', met: 8, partial: 2, unmet: 2 },
    { category: 'GST Compliance', met: 10, partial: 1, unmet: 1 },
    { category: 'PAN Verification', met: 11, partial: 0, unmet: 1 },
    { category: 'Make in India', met: 5, partial: 3, unmet: 4 },
    { category: 'Financial Turnover', met: 6, partial: 2, unmet: 4 },
    { category: 'Blacklist Check', met: 11, partial: 0, unmet: 1 },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-navy-400 mt-1">Procurement compliance insights and trends</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-navy-800/50">
          {(['week', 'month', 'quarter'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer
                ${period === p ? 'gradient-accent text-white' : 'text-navy-500 hover:text-navy-300'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <div key={i} className="glass rounded-xl p-5 hover:glow-blue transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-accent-400">{s.icon}</span>
              <span className={`text-xs font-medium ${s.trend === 'up' ? 'text-success-400' : 'text-danger-400'}`}>{s.change}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-sm text-navy-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Department Performance</h2>
          <div className="space-y-3">
            {departmentData.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-navy-300 w-40 truncate">{d.dept}</span>
                <div className="flex-1 h-6 bg-navy-800/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{
                    width: `${d.avgScore}%`,
                    background: `linear-gradient(90deg, ${d.avgScore >= 70 ? '#22c55e' : d.avgScore >= 50 ? '#eab308' : '#ef4444'}, ${d.avgScore >= 70 ? '#16a34a' : d.avgScore >= 50 ? '#ca8a04' : '#dc2626'})`,
                    animationDelay: `${i * 100}ms`
                  }} />
                </div>
                <span className="text-sm font-medium text-white w-12 text-right">{d.avgScore.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Risk Distribution</h2>
          <div className="space-y-4">
            {riskDistribution.map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-navy-300">{r.level}</span>
                  <span className="text-sm font-medium text-white">{r.count} bids ({r.pct}%)</span>
                </div>
                <div className="h-2.5 bg-navy-800/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.color} transition-all duration-1000`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Breakdown Table */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Requirement Compliance Breakdown</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800/50">
              <th className="text-left px-4 py-2 text-xs font-medium text-navy-500 uppercase">Requirement</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-success-500 uppercase">Met</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-warning-500 uppercase">Partial</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-danger-500 uppercase">Unmet</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-navy-500 uppercase">Rate</th>
            </tr>
          </thead>
          <tbody>
            {complianceBreakdown.map((c, i) => {
              const total = c.met + c.partial + c.unmet
              const rate = (c.met / total) * 100
              return (
                <tr key={i} className="border-b border-navy-800/20">
                  <td className="px-4 py-3 text-sm text-navy-200">{c.category}</td>
                  <td className="px-4 py-3 text-center text-sm text-success-400 font-medium">{c.met}</td>
                  <td className="px-4 py-3 text-center text-sm text-warning-400 font-medium">{c.partial}</td>
                  <td className="px-4 py-3 text-center text-sm text-danger-400 font-medium">{c.unmet}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${rate >= 75 ? 'text-success-400' : rate >= 50 ? 'text-warning-400' : 'text-danger-400'}`}>
                      {rate.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
