import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import OfficerLayout from '@/components/layout/OfficerLayout'
import OfficerDashboard from '@/pages/officer/OfficerDashboard'
import TenderManagement from '@/pages/officer/TenderManagement'
import ComplianceReview from '@/pages/officer/ComplianceReview'
import AuditTrail from '@/pages/officer/AuditTrail'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user && user.role === 'bidder') return <Navigate to="/" replace />
  return <>{children}</>
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/officer" replace />
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
        <Route path="/officer" element={<ProtectedRoute><OfficerLayout /></ProtectedRoute>}>
          <Route index element={<OfficerDashboard />} />
          <Route path="tenders" element={<TenderManagement />} />
          <Route path="compliance" element={<ComplianceReview />} />
          <Route path="audit" element={<AuditTrail />} />
        </Route>
        <Route path="*" element={<Navigate to="/officer" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
