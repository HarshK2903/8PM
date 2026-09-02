import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { ArrowLeft, FileText, Shield, AlertTriangle, CheckCircle2, XCircle, Brain, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface ComplianceData {
  overall_score: number; eligibility_score: number; compliance_score: number;
  risk_score: number; completeness_score: number; quality_score: number;
  risk_level: string; ai_recommendation: string | null; reasoning_trace: string | null;
  pipeline_duration_ms: number | null; generated_at: string;
}

interface DocInfo {
  id: string; doc_type: string; original_filename: string; verification_status: string | null;
  ocr_confidence: number | null; uploaded_at: string;
}

function ScoreRing({ score, label, size = 64 }: { score: number; label: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={5} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{score.toFixed(0)}</span>
        </div>
      </div>
      <span className="text-[11px] text-navy-500 text-center">{label}</span>
    </div>
  )
}

const riskBadge: Record<string, string> = {
  low: 'bg-success-500/15 text-success-400',
  medium: 'bg-warning-500/15 text-warning-400',
  high: 'bg-danger-500/15 text-danger-400',
  critical: 'bg-danger-500/20 text-danger-500',
}

const verStatusColor: Record<string, string> = {
  verified: 'text-success-400', mismatch: 'text-warning-400', expired: 'text-danger-400',
  not_found: 'text-navy-500', pending: 'text-navy-400',
}

export default function ComplianceDeepDive() {
  const { bidId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ComplianceData | null>(null)
  const [docs, setDocs] = useState<DocInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showReasoning, setShowReasoning] = useState(false)

  useEffect(() => {
    if (bidId) loadData()
  }, [bidId])

  async function loadData() {
    setLoading(true)
    try {
      const [compRes, docsRes] = await Promise.all([
        api.get(`/bids/${bidId}/compliance`).catch(() => null),
        api.get(`/bids/${bidId}/documents`).catch(() => ({ data: { items: [] } })),
      ])
      if (compRes) setData(compRes.data)
      setDocs(docsRes?.data?.items || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={32} className="text-accent-400 animate-spin" /></div>
  }

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-navy-400 hover:text-white cursor-pointer"><ArrowLeft size={16} /> Back</button>
        <div className="glass rounded-xl p-16 text-center">
          <Brain size={48} className="text-navy-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Compliance Data Yet</h2>
          <p className="text-navy-400">The AI pipeline has not been run for this bid yet.</p>
          <button onClick={() => api.post(`/bids/${bidId}/pipeline`).then(() => loadData())}
            className="mt-6 px-6 py-2.5 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 cursor-pointer">
            Trigger AI Pipeline
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-navy-400 hover:text-white cursor-pointer"><ArrowLeft size={16} /> Back to Review</button>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${riskBadge[data.risk_level]}`}>
            {data.risk_level.toUpperCase()} RISK
          </span>
          {data.pipeline_duration_ms && (
            <span className="text-xs text-navy-500 flex items-center gap-1"><Clock size={12} /> {(data.pipeline_duration_ms / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Compliance Scores</h2>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <ScoreRing score={data.overall_score} label="Overall" size={90} />
          <ScoreRing score={data.eligibility_score} label="Eligibility" />
          <ScoreRing score={data.compliance_score} label="Compliance" />
          <ScoreRing score={data.risk_score} label="Risk" />
          <ScoreRing score={data.completeness_score} label="Completeness" />
          <ScoreRing score={data.quality_score} label="Quality" />
        </div>
      </div>

      {/* AI Recommendation */}
      {data.ai_recommendation && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={20} className="text-accent-400" />
            <h2 className="text-lg font-semibold text-white">AI Recommendation</h2>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-navy-300 whitespace-pre-wrap leading-relaxed">
            {data.ai_recommendation}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Submitted Documents ({docs.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/30">
              <FileText size={18} className="text-navy-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-200 truncate">{doc.original_filename}</p>
                <p className="text-xs text-navy-500">{doc.doc_type.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-medium ${verStatusColor[doc.verification_status || 'pending']}`}>
                  {doc.verification_status || 'pending'}
                </p>
                {doc.ocr_confidence != null && (
                  <p className="text-[10px] text-navy-600">{(doc.ocr_confidence * 100).toFixed(0)}% OCR</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning Trace */}
      {data.reasoning_trace && (
        <div className="glass rounded-2xl p-6">
          <button onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center justify-between w-full cursor-pointer">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-accent-400" />
              <h2 className="text-lg font-semibold text-white">Reasoning Trace (Audit)</h2>
            </div>
            {showReasoning ? <ChevronUp size={18} className="text-navy-400" /> : <ChevronDown size={18} className="text-navy-400" />}
          </button>
          {showReasoning && (
            <pre className="mt-4 p-4 rounded-lg bg-navy-900/80 text-xs text-navy-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
              {data.reasoning_trace}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
