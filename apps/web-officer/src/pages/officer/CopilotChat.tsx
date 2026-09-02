import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Send, Bot, User, Loader2, Sparkles, HelpCircle } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string; time: Date }

const suggestions = [
  'GFR 2017 rules for bid evaluation',
  'When to reject vs request clarification',
  'Make in India mandatory documents',
  'How does risk scoring work',
  'CVC guidelines for officer overrides',
  'MSME/Udyam registration requirements',
]

export default function CopilotChat() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "I'm your compliance copilot. I can help with GFR 2017 rules, document requirements, bid evaluation best practices, and CVC compliance guidelines.\n\nWhat would you like to know?",
    time: new Date(),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function send(text?: string) {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q, time: new Date() }])
    setLoading(true)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Regarding "${q.slice(0, 40)}...":\n\nPer Rule 149 of GFR 2017, procurement officers must ensure due diligence in verifying all statutory documents, transparent evaluation based on pre-defined criteria, and documented reasoning for every approval or rejection.\n\nNote: Connect your Groq API key for live AI-powered answers with specific compliance data context.`,
        time: new Date(),
      }])
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[var(--gem-blue)] flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Compliance Copilot</h1>
          <p className="text-xs text-muted-foreground">GFR 2017 · CVC Guidelines · GeM Rules</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs ${
              m.role === 'assistant' ? 'bg-[var(--gem-blue)]' : 'bg-secondary'}`}>
              {m.role === 'assistant' ? <Bot size={14} className="text-white" /> : <User size={14} />}
            </div>
            <Card className={`max-w-[75%] ${m.role === 'user' ? 'bg-secondary border-secondary' : ''}`}>
              <CardContent className="py-2.5 px-3.5">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">{m.time.toLocaleTimeString()}</p>
              </CardContent>
            </Card>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-md bg-[var(--gem-blue)] flex items-center justify-center"><Bot size={14} className="text-white" /></div>
            <Card><CardContent className="py-2.5 px-3.5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Thinking...</CardContent></Card>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="py-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><HelpCircle size={12} /> Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <Button key={i} variant="outline" size="sm" className="h-7 text-xs" onClick={() => send(s)}>{s}</Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <Separator className="my-3" />
      <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} disabled={loading}
          placeholder="Ask about procurement compliance..." className="flex-1" />
        <Button type="submit" size="sm" disabled={!input.trim() || loading} className="px-3">
          <Send size={16} />
        </Button>
      </form>
    </div>
  )
}
