import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  const summaryStats = [
    { label: 'Total tenders', value: '5', change: '+2', up: true, icon: BarChart3 },
    { label: 'Total bids', value: '12', change: '+5', up: true, icon: TrendingUp },
    { label: 'Avg. compliance', value: '72.4%', change: '+8.2%', up: true, icon: PieChart },
    { label: 'Avg. processing', value: '8.2s', change: '-1.3s', up: true, icon: Activity },
  ]

  const depts = [
    { name: 'Defence', tenders: 1, bids: 4, score: 78.5 },
    { name: 'Renewable Energy', tenders: 1, bids: 3, score: 71.2 },
    { name: 'Electronics & IT', tenders: 1, bids: 2, score: 82.1 },
    { name: 'General Admin', tenders: 1, bids: 2, score: 65.8 },
    { name: 'Health & Welfare', tenders: 1, bids: 1, score: 55.3 },
  ]

  const risks = [
    { level: 'Low', count: 5, pct: 42, color: 'bg-emerald-500' },
    { level: 'Medium', count: 4, pct: 33, color: 'bg-amber-500' },
    { level: 'High', count: 2, pct: 17, color: 'bg-red-400' },
    { level: 'Critical', count: 1, pct: 8, color: 'bg-red-600' },
  ]

  const requirements = [
    { name: 'MSME/Udyam', met: 8, partial: 2, unmet: 2 },
    { name: 'GST Compliance', met: 10, partial: 1, unmet: 1 },
    { name: 'PAN Verification', met: 11, partial: 0, unmet: 1 },
    { name: 'Make in India', met: 5, partial: 3, unmet: 4 },
    { name: 'Financial Turnover', met: 6, partial: 2, unmet: 4 },
    { name: 'Blacklist Check', met: 11, partial: 0, unmet: 1 },
  ]

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Compliance insights and trends</p>
        </div>
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-secondary">
          {(['week', 'month', 'quarter'] as const).map(p => (
            <Button key={p} size="sm" variant={period === p ? 'default' : 'ghost'}
              className="h-7 text-xs px-3" onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon size={18} className="text-muted-foreground" />
                <span className="text-xs text-emerald-400 font-medium">{s.change}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department performance */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Department performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {depts.map((d, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">{d.name}</span>
                  <span className="text-sm font-mono font-medium">{d.score.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${d.score}%`,
                      backgroundColor: d.score >= 70 ? 'oklch(0.65 0.18 150)' : d.score >= 50 ? 'oklch(0.75 0.15 80)' : 'oklch(0.60 0.20 25)'
                    }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk distribution */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Risk distribution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {risks.map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">{r.level} risk</span>
                  <span className="text-sm text-muted-foreground">{r.count} bids ({r.pct}%)</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.color} transition-all duration-700`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Requirements table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Requirement compliance</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requirements.map((r, i) => {
              const total = r.met + r.partial + r.unmet
              const metPct = (r.met / total) * 100
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm w-36 flex-shrink-0">{r.name}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${(r.met / total) * 100}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${(r.partial / total) * 100}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${(r.unmet / total) * 100}%` }} />
                  </div>
                  <span className={`text-sm font-mono font-medium w-10 text-right ${metPct >= 75 ? 'text-emerald-400' : metPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {metPct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Met</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-amber-500" /> Partial</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-red-500" /> Unmet</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
