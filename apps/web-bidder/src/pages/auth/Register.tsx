import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { Shield, Loader2 } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'bidder', organization: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.user, data.access_token)
      navigate('/bidder')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-accent flex items-center justify-center mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Register as Vendor</h1>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {error && <div className="bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-3 text-danger-400 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1.5">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required
              className="w-full px-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all"
              placeholder="Amit Sharma" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
              className="w-full px-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all"
              placeholder="vendor@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
              className="w-full px-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all"
              placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1.5">Organization</label>
            <input type="text" value={form.organization} onChange={e => setForm({...form, organization: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all"
              placeholder="TechCorp Solutions Pvt Ltd" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg gradient-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create Account'}
          </button>
          <p className="text-center text-sm text-navy-500">Already registered? <a href="/login" className="text-accent-400 hover:text-accent-300">Sign In</a></p>
        </form>
      </div>
    </div>
  )
}
