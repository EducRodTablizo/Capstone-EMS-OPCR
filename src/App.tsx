import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { TransactionDetailPage } from './pages/TransactionDetailPage'
import { SLAReviewPage } from './pages/SLAReviewPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected app */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* EMS-001, 002, 003 — Subsystem Admin + OPCR Evaluator */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['subsystem_admin', 'opcr_evaluator']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* EMS-004 to 007 — all roles (OPCR read-only) */}
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/:id" element={<TransactionDetailPage />} />

            {/* EMS-008 to 012 — Subsystem Admin + OPCR Evaluator */}
            <Route
              path="sla-review"
              element={
                <ProtectedRoute allowedRoles={['subsystem_admin', 'opcr_evaluator']}>
                  <SLAReviewPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
