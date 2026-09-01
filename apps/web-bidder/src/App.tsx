import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import BidderLayout from '@/components/layout/BidderLayout'
import BidderDashboard from '@/pages/bidder/BidderDashboard'
import TenderBrowse from '@/pages/bidder/TenderBrowse'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user && (user.role === 'officer' || user.role === 'admin')) return <Navigate to="/" replace />
  return <>{children}</>
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/bidder" replace />
  return <>{children}</>
}

export default function App() {
  const { loadFromStorage } = useAuthStore()
  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
        <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
        <Route path="/bidder" element={<ProtectedRoute><BidderLayout /></ProtectedRoute>}>
          <Route index element={<BidderDashboard />} />
          <Route path="tenders" element={<TenderBrowse />} />
        </Route>
        <Route path="*" element={<Navigate to="/bidder" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
