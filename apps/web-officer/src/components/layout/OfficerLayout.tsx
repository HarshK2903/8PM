import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard, FileText, ClipboardCheck, History,
  LogOut, Shield, Bell, Menu, X, MessageSquare, BarChart3, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', path: '/officer', icon: <LayoutDashboard size={20} /> },
  { label: 'Tenders', path: '/officer/tenders', icon: <FileText size={20} /> },
  { label: 'Compliance Review', path: '/officer/compliance', icon: <ClipboardCheck size={20} /> },
  { label: 'Copilot', path: '/officer/copilot', icon: <MessageSquare size={20} /> },
  { label: 'Analytics', path: '/officer/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Audit Trail', path: '/officer/audit', icon: <History size={20} /> },
]

export default function OfficerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col border-r border-navy-800/50 bg-navy-900/80 backdrop-blur-xl transition-all duration-300`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-navy-800/50">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-white tracking-wide">GemVerify</h1>
              <p className="text-[10px] text-navy-400 uppercase tracking-widest">Officer Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer
                  ${isActive ? 'bg-accent-500/15 text-accent-400' : 'text-navy-400 hover:text-navy-200 hover:bg-navy-800/50'}`}
              >
                <span className={isActive ? 'text-accent-400' : 'text-navy-500 group-hover:text-navy-300'}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && isActive && <ChevronRight size={14} className="ml-auto text-accent-400" />}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-navy-800/50 p-3">
          {sidebarOpen && user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-navy-200 truncate">{user.full_name}</p>
              <p className="text-xs text-navy-500 truncate">{user.email}</p>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all cursor-pointer">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-navy-800/50 bg-navy-900/50 backdrop-blur-xl flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-navy-400 hover:text-navy-200 transition-colors cursor-pointer">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <button className="relative text-navy-400 hover:text-navy-200 transition-colors cursor-pointer">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || 'O'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}
