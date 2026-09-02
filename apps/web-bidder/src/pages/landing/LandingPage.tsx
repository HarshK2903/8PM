import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Shield, FileSearch, Globe, CheckCircle, BarChart3, Lock, ArrowRight,
  Brain, Users, Zap, FileText, Scale, ChevronRight
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background relative">
      <div className="ambient-glow" />

      {/* ─── Navbar ─── */}
      <nav className="relative z-10 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--gem-blue)] flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">GemVerify</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => navigate('/register')}>
              Get Started <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="animate-in">
          <Badge variant="secondary" className="mb-6 text-xs px-3 py-1">
            <Brain size={12} className="mr-1.5" /> Powered by Llama 3.3 70B
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
            Government bid compliance,
            <br />
            <span className="text-[var(--gem-blue-light)]">verified by AI</span>
          </h1>

          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Automated document verification, multi-registry checks, and intelligent compliance
            scoring for GeM procurement — so officers can decide with confidence.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <Button size="lg" onClick={() => navigate('/register')} className="h-11 px-6 text-sm">
              Start verifying <ArrowRight size={15} className="ml-1.5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="h-11 px-6 text-sm">
              How it works
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-8 mt-20 max-w-lg mx-auto animate-in" style={{ animationDelay: '0.15s' }}>
          {[
            { val: '12+', label: 'Doc types' },
            { val: '9', label: 'Registries' },
            { val: '6', label: 'Score axes' },
            { val: '<10s', label: 'Pipeline' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-foreground">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* ─── Features Bento Grid ─── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">End-to-end compliance pipeline</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Every step automated, auditable, and transparent — from document upload to AI recommendation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: <FileSearch size={22} />, title: 'Smart OCR', desc: '12 specialized parsers for Udyam, GST, PAN, MCA21, EPFO, ESIC and more. Automatic field extraction with confidence scoring.' },
            { icon: <Globe size={22} />, title: 'Registry verification', desc: 'Parallel checks against 9 government registries. Cross-reference extracted data with official records in real-time.' },
            { icon: <CheckCircle size={22} />, title: 'Requirement matching', desc: 'Automated matching of tender eligibility against verified bidder evidence. MSME, Make in India, Startup India checks.' },
            { icon: <BarChart3 size={22} />, title: 'Multi-dimensional scoring', desc: 'Six sub-scores — Eligibility, Compliance, Risk, Completeness, Quality, Overall. Automatic risk classification.' },
            { icon: <Brain size={22} />, title: 'AI recommendations', desc: 'Groq-powered Llama 3.3 analysis with structured reasoning traces. GFR 2017 and CVC guideline citations.' },
            { icon: <Lock size={22} />, title: 'Immutable audit trail', desc: 'CVC-compliant logging of every action. Officer override tracking with mandatory justification.' },
          ].map((f, i) => (
            <Card key={i} className="group hover:border-[var(--gem-blue)]/30 transition-colors duration-300">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--gem-blue-muted)] flex items-center justify-center text-[var(--gem-blue-light)] mb-4 group-hover:bg-[var(--gem-blue)]/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Pipeline Steps ─── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        </div>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {[
            { n: '1', label: 'Upload docs', icon: <FileText size={16} /> },
            { n: '2', label: 'OCR extract', icon: <FileSearch size={16} /> },
            { n: '3', label: 'Registry check', icon: <Globe size={16} /> },
            { n: '4', label: 'Match rules', icon: <Scale size={16} /> },
            { n: '5', label: 'Score bid', icon: <BarChart3 size={16} /> },
            { n: '6', label: 'AI recommend', icon: <Brain size={16} /> },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground text-sm font-mono font-bold">
                  {step.n}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{step.label}</span>
              </div>
              {i < 5 && <ChevronRight size={14} className="text-border mt-[-20px] flex-shrink-0" />}
            </div>
          ))}
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* ─── Two Portals CTA ─── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="group hover:border-[var(--gem-blue)]/30 transition-all duration-300 cursor-pointer" onClick={() => navigate('/register')}>
            <CardContent className="pt-6 pb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--gem-blue-muted)] flex items-center justify-center text-[var(--gem-blue-light)] mb-4">
                <Users size={22} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">For bidders</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Submit bids with confidence. Upload documents, get instant AI verification, and track compliance status.
              </p>
              <span className="text-sm text-[var(--gem-blue-light)] flex items-center gap-1.5 group-hover:gap-2.5 transition-all font-medium">
                Register as bidder <ArrowRight size={14} />
              </span>
            </CardContent>
          </Card>
          <Card className="group hover:border-[var(--gem-blue)]/30 transition-all duration-300 cursor-pointer" onClick={() => navigate('/register')}>
            <CardContent className="pt-6 pb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--gem-blue-muted)] flex items-center justify-center text-[var(--gem-blue-light)] mb-4">
                <Shield size={22} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">For officers</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Review AI-scored bids with full transparency. Approve, reject, or request clarification with reasoning trails.
              </p>
              <span className="text-sm text-[var(--gem-blue-light)] flex items-center gap-1.5 group-hover:gap-2.5 transition-all font-medium">
                Register as officer <ArrowRight size={14} />
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">GemVerify © 2026</span>
          </div>
          <p className="text-xs text-muted-foreground">AI-Powered Government Procurement Compliance</p>
        </div>
      </footer>
    </div>
  )
}
