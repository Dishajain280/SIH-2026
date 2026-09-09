import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { AppLayout } from './layout/AppLayout'
import Dashboard from './pages/Dashboard'
import UploadReports from './pages/UploadReports'
import LsrMapping from './pages/LsrMapping'
import RiskPrioritization from './pages/RiskPrioritization'
import SiteInsights from './pages/SiteInsights'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadReports />} />
          <Route path="/lsr-mapping" element={<LsrMapping />} />
          <Route path="/risk" element={<RiskPrioritization />} />
          <Route path="/insights" element={<SiteInsights />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
