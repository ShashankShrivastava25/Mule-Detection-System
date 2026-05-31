import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardRoute from './routes/Dashboard.jsx'
import LandingRoute from './routes/Landing.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
