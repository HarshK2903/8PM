import { useNavigate } from 'react-router-dom'
import { Shield, Zap, FileSearch, CheckCircle, BarChart3, Lock, ArrowRight, Brain, Globe, Users } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy-950 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '-6s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center animate-pulse-glow">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">GemVerify</h1>
            <p className="text-[9px] text-navy-500 uppercase tracking-[0.2em]">AI Compliance Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-sm text-navy-400 hover:text-white transition-colors px-4 py-2 cursor-pointer">Sign In</button>
          <button onClick={() => navigate('/register')} className="text-sm text-white gradient-accent px-5 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-accent-400 font-medium mb-8">
            <Brain size={14} /> Powered by Llama 3.3 70B + Custom AI Pipeline
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
            Government Bid
            <br />
            <span className="bg-gradient-to-r from-accent-400 via-blue-400 to-accent-300 bg-clip-text text-transparent">Compliance, Automated</span>
          </h1>
          <p className="text-lg text-navy-400 mt-6 max-w-2xl mx-auto leading-relaxed">
            AI-powered document verification, multi-dimensional compliance scoring, and intelligent recommendations for GeM procurement officers and bidders.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <button onClick={() => navigate('/register')} className="flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-accent text-white font-medium hover:opacity-90 transition-all hover:scale-105 cursor-pointer group">
              Start Verifying <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3.5 rounded-xl glass text-navy-300 font-medium hover:text-white transition-all cursor-pointer">
              Learn More
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {[
            { value: '12+', label: 'Document Types' },
            { value: '9', label: 'Gov Registries' },
            { value: '6', label: 'Score Dimensions' },
            { value: '<10s', label: 'Processing Time' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-navy-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">End-to-End Compliance Pipeline</h2>
          <p className="text-navy-400 mt-3 max-w-xl mx-auto">From document upload to AI recommendation — every step automated, auditable, and transparent.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
          {[
            { icon: <FileSearch size={28} />, title: 'Smart OCR Extraction', desc: '12 specialized parsers for Indian government documents — Udyam, GST, PAN, MCA21, EPFO, ESIC and more. Automatic field extraction with confidence scoring.' },
            { icon: <Globe size={28} />, title: 'Registry Verification', desc: 'Parallel verification against 9 government registries. Cross-reference extracted data with official records in real-time.' },
            { icon: <CheckCircle size={28} />, title: 'Requirement Matching', desc: 'Automated matching of tender eligibility requirements against verified bidder evidence. MSME, Make in India, Startup India compliance checks.' },
            { icon: <BarChart3 size={28} />, title: 'Multi-Dimensional Scoring', desc: '6 sub-scores: Eligibility, Compliance, Risk, Completeness, Quality, and Overall. Automatic risk classification: low / medium / high / critical.' },
            { icon: <Brain size={28} />, title: 'AI Recommendations', desc: 'Groq-powered Llama 3.3 70B analysis with structured reasoning traces. GFR 2017 and CVC guideline citations in every recommendation.' },
            { icon: <Lock size={28} />, title: 'Immutable Audit Trail', desc: 'CVC-compliant logging of every action. Officer override tracking with mandatory justification. Full transparency for RTI compliance.' },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 hover:glow-blue transition-all duration-300 group" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="text-accent-400 mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-navy-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">How It Works</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { step: '1', label: 'Upload Documents', color: 'from-blue-500 to-blue-600' },
            { step: '2', label: 'OCR Extraction', color: 'from-cyan-500 to-cyan-600' },
            { step: '3', label: 'Registry Check', color: 'from-teal-500 to-teal-600' },
            { step: '4', label: 'Requirement Match', color: 'from-green-500 to-green-600' },
            { step: '5', label: 'Compliance Score', color: 'from-amber-500 to-amber-600' },
            { step: '6', label: 'AI Recommendation', color: 'from-accent-500 to-accent-600' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                {s.step}
              </div>
              <span className="text-sm text-navy-300 font-medium">{s.label}</span>
              {i < 5 && <ArrowRight size={16} className="text-navy-700 hidden md:block" />}
            </div>
          ))}
        </div>
      </section>

      {/* Dual Portal CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass rounded-2xl p-8 hover:glow-blue transition-all duration-300 cursor-pointer group" onClick={() => navigate('/register')}>
            <Users size={32} className="text-accent-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">For Bidders</h3>
            <p className="text-navy-400 mb-6">Submit bids with confidence. Upload documents, get instant AI verification, and track your compliance status in real-time.</p>
            <span className="text-accent-400 text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
              Register as Bidder <ArrowRight size={16} />
            </span>
          </div>
          <div className="glass rounded-2xl p-8 hover:glow-blue transition-all duration-300 cursor-pointer group" onClick={() => navigate('/register')}>
            <Shield size={32} className="text-accent-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">For Officers</h3>
            <p className="text-navy-400 mb-6">Review AI-scored bids with full transparency. Approve, reject, or request clarification with auditable reasoning trails.</p>
            <span className="text-accent-400 text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
              Register as Officer <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-navy-800/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent-500" />
            <span className="text-sm text-navy-500">GemVerify © 2026</span>
          </div>
          <p className="text-xs text-navy-600">AI-Powered Government Procurement Compliance</p>
        </div>
      </footer>
    </div>
  )
}
