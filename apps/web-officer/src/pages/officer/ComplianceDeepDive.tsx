import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, FileText, Shield, Brain, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface ComplianceData {
  overall_score: number; eligibility_score: number; compliance_score: number;
  risk_score: number; completeness_score: number; quality_score: number;
  risk_level: string; ai_recommendation: string | null; reasoning_trace: string | null;
  pipeline_duration_ms: number | null; generated_at: string;
}

interface DocInfo { id: string; doc_type: string; original_filename: string; verification_status: string | null; ocr_confidence: number | null; uploaded_at: string }

function ScoreRing({ score, label, size = 64 }: { score: number; label: string; size?: number }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ
  const color = score >= 75 ? 'oklch(0.65 0.18 150)' : score >= 50 ? 'oklch(0.75 0.15 80)' : score >= 25 ? 'oklch(0.70 0.15 50)' : 'oklch(0.60 0.20 25)'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" className="stroke-secondary" strokeWidth={4} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono">{score.toFixed(0)}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

const riskBadge: Record<string, string> = { low: 'status-success', medium: 'status-warning', high: 'status-danger', critical: 'status-danger' }
const verColor: Record<string, string> = { verified: 'text-emerald-400', mismatch: 'text-amber-400', expired: 'text-red-400', not_found: 'text-muted-foreground', pending: 'text-muted-foreground' }

export default function ComplianceDeepDive() {
  const { bidId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ComplianceData | null>(null)
  const [docs, setDocs] = useState<DocInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showTrace, setShowTrace] = useState(false)

  useEffect(() => { if (bidId) load() }, [bidId])

  async function load() {
    setLoading(true)
    try {
      const [c, d] = await Promise.all([
        api.get(`/bids/${bidId}/compliance`).catch(() => null),
        api.get(`/bids/${bidId}/documents`).catch(() => ({ data: { items: [] } })),
      ])
      if (c) setData(c.data)
      setDocs(d?.data?.items || [])
    } catch {} finally { setLoading(false) }
  }

  if (loading) return <div className="space-y-4 py-8">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>

  if (!data) return (
    <div className="space-y-6 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={14} className="mr-1.5" /> Back</Button>
      <Card>
        <CardContent className="py-16 text-center">
          <Brain size={36} className="mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">No compliance data</h2>
          <p className="text-sm text-muted-foreground mb-6">The AI pipeline hasn't been run for this bid.</p>
          <Button onClick={() => api.post(`/bids/${bidId}/pipeline`).then(() => load())}>Trigger AI pipeline</Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={14} className="mr-1.5" /> Back</Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={riskBadge[data.risk_level]}>{data.risk_level.toUpperCase()} RISK</Badge>
          {data.pipeline_duration_ms && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {(data.pipeline_duration_ms / 1000).toFixed(1)}s</span>}
        </div>
      </div>

      {/* Scores */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Compliance scores</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-6 flex-wrap py-2">
            <ScoreRing score={data.overall_score} label="Overall" size={80} />
            <ScoreRing score={data.eligibility_score} label="Eligibility" />
            <ScoreRing score={data.compliance_score} label="Compliance" />
            <ScoreRing score={data.risk_score} label="Risk" />
            <ScoreRing score={data.completeness_score} label="Complete" />
            <ScoreRing score={data.quality_score} label="Quality" />
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      {data.ai_recommendation && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Brain size={16} className="text-[var(--gem-blue-light)]" /> AI recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.ai_recommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Documents ({docs.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/50">
                <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{d.original_filename}</p>
                  <p className="text-xs text-muted-foreground">{d.doc_type.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-medium ${verColor[d.verification_status || 'pending']}`}>{d.verification_status || 'pending'}</p>
                  {d.ocr_confidence != null && <p className="text-[10px] text-muted-foreground">{(d.ocr_confidence * 100).toFixed(0)}% OCR</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reasoning trace */}
      {data.reasoning_trace && (
        <Card>
          <CardHeader className="pb-0">
            <button onClick={() => setShowTrace(!showTrace)} className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Shield size={16} className="text-[var(--gem-blue-light)]" /> Reasoning trace</CardTitle>
              {showTrace ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
          </CardHeader>
          {showTrace && (
            <CardContent className="pt-3">
              <pre className="p-3 rounded-lg bg-secondary text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-80 overflow-y-auto">{data.reasoning_trace}</pre>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
