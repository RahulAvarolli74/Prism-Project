import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import AppShell from './components/layout/AppShell'
import PageFallback from './components/ui/PageFallback'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import DependencyGraphPage from './pages/DependencyGraph'

const LandingPage = lazy(() => import('./pages/Landing'))
const DashboardPage = lazy(() => import('./pages/Dashboard'))
const AlertsPage = lazy(() => import('./pages/Alerts'))
const MetricsPage = lazy(() => import('./pages/Metrics'))
const TimelinePage = lazy(() => import('./pages/Timeline'))
const ServiceDetailsPage = lazy(() => import('./pages/ServiceDetails'))

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="min-h-full"
      >
        <Suspense fallback={<PageFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/graph" element={<DependencyGraphPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/service/:id" element={<ServiceDetailsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
