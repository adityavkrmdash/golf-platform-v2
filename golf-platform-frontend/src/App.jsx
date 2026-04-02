import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import useAuth from './hooks/useAuth'
import api from './api/axios'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/Dashboard'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const CharitiesPage = lazy(() => import('./pages/CharitiesPage'))
const CharityDetailPage = lazy(() => import('./pages/CharityDetailPage'))
const DonationPage = lazy(() => import('./pages/DonationPage'))
const DrawsPage = lazy(() => import('./pages/DrawsPage'))
const WinningsPage = lazy(() => import('./pages/WinningsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const PageLoader = () => (
  <div className="min-h-screen bg-[linear-gradient(180deg,#071411_0%,#0d231f_100%)] text-white flex items-center justify-center px-4">
    <div className="text-center">
      <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#d7a84a]" />
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d7a84a]">
        Loading
      </p>
      <p className="mt-3 text-sm text-[#c7d7d2]">Preparing your experience...</p>
    </div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

const SubscriberRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [checking, setChecking] = React.useState(true)
  const [isActive, setIsActive] = React.useState(false)

  React.useEffect(() => {
    if (!user) {
      setChecking(false)
      setIsActive(false)
      return
    }

    let ignore = false

    api
      .get('/subscriptions/my')
      .then((res) => {
        if (ignore) return
        setIsActive(res.data?.status === 'active')
      })
      .catch(() => {
        if (ignore) return
        setIsActive(false)
      })
      .finally(() => {
        if (!ignore) {
          setChecking(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [user, location.pathname])

  if (loading || checking) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isActive) {
    return <Navigate to="/subscribe" replace state={{ from: location.pathname }} />
  }

  return children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/charities/:id" element={<CharityDetailPage />} />
        <Route path="/donate" element={<DonationPage />} />
        <Route path="/draws" element={<DrawsPage />} />
        <Route
          path="/dashboard"
          element={
            <SubscriberRoute>
              <DashboardPage />
            </SubscriberRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscribe"
          element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/winnings"
          element={
            <SubscriberRoute>
              <WinningsPage />
            </SubscriberRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
