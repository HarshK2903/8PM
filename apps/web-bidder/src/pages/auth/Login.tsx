import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.user, data.access_token)
      navigate('/bidder')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-accent flex items-center justify-center mb-4 animate-pulse-glow">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GemVerify</h1>
          <p className="text-navy-400 mt-1">AI-Powered Bid Compliance Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold text-white text-center">Bidder Sign In</h2>
          {error && <div className="bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-3 text-danger-400 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
              placeholder="vendor@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all pr-10"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300 cursor-pointer">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg gradient-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
          <p className="text-center text-sm text-navy-500">
            New vendor? <a href="/register" className="text-accent-400 hover:text-accent-300">Register</a>
          </p>
        </form>
      </div>
    </div>
  )
}
