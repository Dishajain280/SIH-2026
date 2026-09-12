import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { AppLayout } from './layout/AppLayout'
import { RouteFallback } from './components/RouteFallback'

// Route-level code splitting: the heavy chart bundle (Recharts) only loads
// when a page that needs it is actually visited.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const UploadReports = lazy(() => import('./pages/UploadReports'))
const LsrMapping = lazy(() => import('./pages/LsrMapping'))
const RiskPrioritization = lazy(() => import('./pages/RiskPrioritization'))
const SiteInsights = lazy(() => import('./pages/SiteInsights'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/upload"
            element={
              <Suspense fallback={<RouteFallback />}>
                <UploadReports />
              </Suspense>
            }
          />
          <Route
            path="/lsr-mapping"
            element={
              <Suspense fallback={<RouteFallback />}>
                <LsrMapping />
              </Suspense>
            }
          />
          <Route
            path="/risk"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RiskPrioritization />
              </Suspense>
            }
          />
          <Route
            path="/insights"
            element={
              <Suspense fallback={<RouteFallback />}>
                <SiteInsights />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
