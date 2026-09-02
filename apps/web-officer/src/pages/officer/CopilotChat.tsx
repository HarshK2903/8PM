import { useState, useRef, useEffect } from 'react'
import api from '@/lib/api'
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, HelpCircle } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  'What are the GFR 2017 rules for bid evaluation?',
  'When should I request clarification vs reject a bid?',
  'What documents are mandatory for Make in India compliance?',
  'How does the risk scoring algorithm work?',
  'What are CVC guidelines for officer overrides?',
  'Explain the MSME/Udyam registration requirements',
]

export default function CopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Compliance Copilot. I can help you with:\n\n• **GFR 2017 rules** and procurement regulations\n• **Document requirements** for different tender types\n• **Bid evaluation** best practices\n• **Risk assessment** guidance\n• **CVC compliance** guidelines\n\nAsk me anything about government procurement compliance!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(question?: string) {
    const text = question || input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Simulate AI response (will be connected to Groq in production)
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: `Based on my analysis of GeM procurement guidelines and GFR 2017:\n\n**Regarding your question about "${text.slice(0, 50)}..."**\n\nAs per Rule 149 of GFR 2017, procurement officers must ensure:\n\n1. **Due diligence** in verifying all statutory documents\n2. **Transparent evaluation** based on pre-defined criteria\n3. **Documented reasoning** for every approval or rejection\n\n> ⚠️ Note: This is a demo response. Connect your Groq API key for live AI-powered answers based on your specific compliance data.\n\nWould you like me to elaborate on any specific aspect?`,
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: responses.default,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Compliance Copilot</h1>
            <p className="text-xs text-navy-500">AI-powered procurement guidance • GFR 2017 • CVC Guidelines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
          <span className="text-xs text-navy-500">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'assistant' ? 'gradient-accent' : 'bg-navy-700'}`}>
              {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-navy-300" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'assistant' ? 'glass' : 'bg-accent-500/15 border border-accent-500/20'}`}>
              <div className="text-sm text-navy-200 whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              <p className="text-[10px] text-navy-600 mt-2">{msg.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-navy-400">
                <Loader2 size={14} className="animate-spin" /> Analyzing...
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="py-3">
          <p className="text-xs text-navy-600 mb-2 flex items-center gap-1"><HelpCircle size={12} /> Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)}
                className="text-xs px-3 py-1.5 rounded-full glass text-navy-400 hover:text-accent-400 hover:border-accent-500/30 transition-all cursor-pointer">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-3 pt-3 border-t border-navy-800/50">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl bg-navy-800/50 border border-navy-700/50 text-white placeholder-navy-500 focus:border-accent-500 outline-none transition-all text-sm"
          placeholder="Ask about procurement compliance..." />
        <button type="submit" disabled={!input.trim() || loading}
          className="px-4 py-3 rounded-xl gradient-accent text-white hover:opacity-90 disabled:opacity-30 transition-opacity cursor-pointer">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
