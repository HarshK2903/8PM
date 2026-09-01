import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Plus, FileText, Users, Calendar, Search, Filter, ChevronDown, X, Loader2 } from 'lucide-react'

interface Tender {
  id: string; title: string; reference_number: string; tender_type: string;
  status: string; department: string; estimated_value: number | null;
  submission_deadline: string; created_at: string; officer_name: string; bid_count: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-navy-700 text-navy-300',
  published: 'bg-accent-500/15 text-accent-400',
  evaluation: 'bg-warning-500/15 text-warning-400',
  awarded: 'bg-success-500/15 text-success-400',
  cancelled: 'bg-danger-500/15 text-danger-400',
}

export default function TenderManagement() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { loadTenders() }, [])

  async function loadTenders() {
    try {
      const { data } = await api.get('/tenders?per_page=50')
      setTenders(data.items || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = tenders.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.reference_number.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tender Management</h1>
          <p className="text-navy-400 mt-1">{tenders.length} tenders total</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
          <Plus size={18} /> Create Tender
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenders..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all" />
      </div>

      {/* Tender Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-accent-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass rounded-xl">
          <FileText size={48} className="text-navy-600 mx-auto mb-4" />
          <p className="text-navy-400">No tenders found</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-accent-400 hover:text-accent-300 text-sm cursor-pointer">Create your first tender →</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(t => (
            <div key={t.id} className="glass rounded-xl p-5 hover:glow-blue transition-all duration-300 cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
                    <span className="text-xs text-navy-500 font-mono">{t.reference_number}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-accent-300 transition-colors truncate">{t.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-navy-400">
                    <span className="flex items-center gap-1.5"><FileText size={14} /> {t.department}</span>
                    <span className="flex items-center gap-1.5"><Users size={14} /> {t.bid_count} bids</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Due {new Date(t.submission_deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {t.estimated_value && (
                    <p className="text-lg font-bold text-white">₹{(t.estimated_value / 10000000).toFixed(1)}Cr</p>
                  )}
                  <p className="text-xs text-navy-500 mt-1">{t.tender_type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreateTenderModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadTenders() }} />}
    </div>
  )
}

function CreateTenderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', tender_type: 'open', department: '', category: '',
    estimated_value: '', emd_amount: '', submission_deadline: '',
    required_documents: ['gst', 'pan'],
    make_in_india_required: false, msme_required: false, startup_required: false,
    min_turnover: '', local_content_percentage: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const docTypes = ['udyam', 'gst', 'pan', 'income_tax', 'epfo', 'esic', 'oem_authorization', 'startup_certificate', 'nsic', 'company_registration', 'make_in_india', 'bis', 'financial_statement']

  function toggleDoc(d: string) {
    setForm(f => ({ ...f, required_documents: f.required_documents.includes(d) ? f.required_documents.filter(x => x !== d) : [...f.required_documents, d] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/tenders', {
        ...form,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : undefined,
        emd_amount: form.emd_amount ? parseFloat(form.emd_amount) : undefined,
        min_turnover: form.min_turnover ? parseFloat(form.min_turnover) : undefined,
        local_content_percentage: form.local_content_percentage ? parseFloat(form.local_content_percentage) : undefined,
      })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tender')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Tender</h2>
          <button onClick={onClose} className="text-navy-400 hover:text-white cursor-pointer"><X size={20} /></button>
        </div>

        {error && <div className="bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-3 text-danger-400 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-navy-300 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white text-sm focus:border-accent-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-navy-300 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                className="w-full px-3 py-2 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white text-sm focus:border-accent-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm text-navy-300 mb-1">Department *</label>
              <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white text-sm focus:border-accent-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-navy-300 mb-1">Tender Type</label>
              <select value={form.tender_type} onChange={e => setForm({...form, tender_type: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white text-sm focus:border-accent-500 outline-none">
                <option value="open">Open</option><option value="limited">Limited</option>
                <option value="single">Single Source</option><option value="two_part">Two-Part</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-navy-300 mb-1">Estimated Value (₹)</label>
              <input type="number" value={form.estimated_value} onChange={e => setForm({...form, estimated_value: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white text-sm focus:border-accent-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-navy-300 mb-1">Submission Deadline *</label>
              <input type="date" value={form.submission_deadline} onChange={e => setForm({...form, submission_deadline: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white text-sm focus:border-accent-500 outline-none" />
            </div>
          </div>

          {/* Required Documents */}
          <div>
            <label className="block text-sm text-navy-300 mb-2">Required Documents</label>
            <div className="flex flex-wrap gap-2">
              {docTypes.map(d => (
                <button key={d} type="button" onClick={() => toggleDoc(d)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${form.required_documents.includes(d) ? 'bg-accent-500/20 border-accent-500/40 text-accent-400' : 'border-navy-700 text-navy-500 hover:border-navy-500'}`}>
                  {d.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Policy flags */}
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'msme_required', label: 'MSME Required' },
              { key: 'make_in_india_required', label: 'Make in India' },
              { key: 'startup_required', label: 'Startup India' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-navy-300 cursor-pointer">
                <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.checked})}
                  className="rounded border-navy-600" />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg gradient-accent text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create & Publish Tender'}
          </button>
        </form>
      </div>
    </div>
  )
}
