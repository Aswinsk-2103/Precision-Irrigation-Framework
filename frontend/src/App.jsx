import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LiveSensors from './pages/LiveSensors'
import MLPrediction from './pages/MLPrediction'
import Weather from './pages/Weather'
import Irrigation from './pages/Irrigation'
import Crops from './pages/Crops'
import Analytics from './pages/Analytics'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Welcome Landing Page & Login */}
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboard Layout Routes */}
        <Route element={<Layout />}>
          <Route path="dashboard font-medium" element={<Dashboard />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="sensors"    element={<LiveSensors />} />
          <Route path="prediction" element={<MLPrediction />} />
          <Route path="weather"    element={<Weather />} />
          <Route path="irrigation" element={<Irrigation />} />
          <Route path="crops"      element={<Crops />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="history"    element={<History />} />
          <Route path="settings"   element={<Settings />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
