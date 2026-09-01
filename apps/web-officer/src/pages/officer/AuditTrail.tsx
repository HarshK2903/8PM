import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { History, User, Shield, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface AuditEntry {
  id: string; user_id?: string; action: string; entity_type: string;
  entity_id?: string; description?: string; created_at: string; user_name: string;
  tender_id?: string; bid_id?: string;
}

const actionColors: Record<string, string> = {
  'tender.created': 'border-accent-500/30 bg-accent-500/5',
  'tender.status_updated': 'border-info-500/30 bg-info-500/5',
  'bid.submitted': 'border-success-500/30 bg-success-500/5',
  'officer.approve': 'border-success-500/30 bg-success-500/5',
  'officer.reject': 'border-danger-500/30 bg-danger-500/5',
  'officer.clarify': 'border-warning-500/30 bg-warning-500/5',
  'pipeline.triggered': 'border-accent-500/30 bg-accent-500/5',
}

const actionLabels: Record<string, string> = {
  'tender.created': '📋 Tender Created',
  'tender.status_updated': '🔄 Tender Status Changed',
  'bid.submitted': '📨 Bid Submitted',
  'officer.approve': '✅ Bid Approved',
  'officer.reject': '❌ Bid Rejected',
  'officer.clarify': '❓ Clarification Requested',
  'pipeline.triggered': '🧠 AI Pipeline Triggered',
}

export default function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => { loadAudit() }, [page])

  async function loadAudit() {
    setLoading(true)
    try {
      const { data } = await api.get(`/audit?page=${page}&per_page=30`)
      setEntries(data.items || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
        <p className="text-navy-400 mt-1">Immutable, CVC-compliant record of all platform actions</p>
      </div>

      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <Shield size={18} className="text-accent-400" />
        <p className="text-xs text-navy-400">Every action is permanently recorded with cryptographic timestamp. Records cannot be modified or deleted.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-accent-400 animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <History size={48} className="text-navy-700 mx-auto mb-4" />
          <p className="text-navy-400">No audit entries yet</p>
          <p className="text-navy-600 text-xs mt-2">Actions will appear here as tenders are created and bids reviewed</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={entry.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.005]
              ${actionColors[entry.action] || 'border-navy-800/30 bg-navy-800/10'}`}
              style={{ animationDelay: `${i * 30}ms` }}>
              
              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-1">
                <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-navy-400" />
                </div>
                {i < entries.length - 1 && <div className="w-px h-full bg-navy-800/50 mt-2" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-white">
                    {actionLabels[entry.action] || entry.action}
                  </span>
                  <span className="text-[11px] text-navy-500 flex-shrink-0">
                    {new Date(entry.created_at).toLocaleString('en-IN', { 
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit', second: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-xs text-navy-400 mt-1">{entry.description || 'No description'}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-navy-600">
                  <span>by <span className="text-navy-400">{entry.user_name}</span></span>
                  {entry.entity_id && <span>• ID: <span className="font-mono">{entry.entity_id.slice(0, 8)}...</span></span>}
                  <span>• {entry.entity_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-navy-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-sm text-navy-500">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={entries.length < 30}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-navy-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
