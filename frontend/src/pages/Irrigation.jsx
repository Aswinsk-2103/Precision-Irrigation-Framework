import { useEffect, useState, useCallback } from 'react'
import { getIrrigationStatus, controlIrrigation, getIrrigationHistory, runPrediction, getSensorLatest } from '../services/api'
import Spinner from '../components/Spinner'
import { Droplets, Power, PowerOff, Clock, BarChart2, Zap } from 'lucide-react'

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="card max-w-sm w-full mx-4 border border-primary/30">
        <h3 className="section-title mb-2">Confirm Action</h3>
        <p className="text-text-secondary text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-primary flex-1">Confirm</button>
          <button onClick={onCancel}  className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Irrigation() {
  const [status, setStatus]       = useState(null)
  const [history, setHistory]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [confirm, setConfirm]     = useState(null)
  const [mlRec, setMlRec]         = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, hRes] = await Promise.all([getIrrigationStatus(), getIrrigationHistory(20)])
      setStatus(sRes.data); setHistory(hRes.data)
    } catch { /* skip */ }
    finally { setLoading(false) }
  }, [])

  const fetchMLRec = useCallback(async () => {
    try {
      const { data: s } = await getSensorLatest()
      const { data: p } = await runPrediction({
        soil_moisture: s.soil_moisture, temperature: s.temperature,
        humidity: s.humidity, rainfall: s.rainfall || 0,
        rain_probability: s.rain_probability || 0, wind_speed: s.wind_speed || 0,
        soil_type: 'Loamy', crop_type: 'Wheat', growth_stage: 'Vegetative',
        prev_irrigation: 0, hours_since_irrigation: 24,
      })
      setMlRec(p)
    } catch { /* model not ready */ }
  }, [])

  useEffect(() => {
    fetchAll(); fetchMLRec()
    const t = setInterval(fetchAll, 10000)
    return () => clearInterval(t)
  }, [fetchAll, fetchMLRec])

  const handleControl = async (action) => {
    setActionLoading(true)
    try {
      await controlIrrigation(action, { triggered_by: 'manual', ml_recommended: mlRec?.irrigation_required })
      await fetchAll()
    } catch (e) { alert('Control failed: ' + (e.response?.data?.detail || e.message)) }
    setActionLoading(false)
    setConfirm(null)
  }

  if (loading) return <Spinner text="Loading irrigation status..." />

  return (
    <div className="space-y-6 animate-slide-up">
      <h1 className="page-title flex items-center gap-2"><Droplets className="text-accent" size={24}/> Irrigation Control</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 card">
          <h2 className="section-title mb-5">💦 Control Panel</h2>

          {/* Status Indicator */}
          <div className={`flex items-center justify-center gap-4 p-6 rounded-2xl mb-5 border-2 transition-all duration-500 ${
            status?.is_active
              ? 'bg-primary/10 border-primary/40 shadow-glow-green'
              : 'bg-surface-border border-surface-border'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${status?.is_active ? 'bg-primary animate-pulse' : 'bg-surface-border'}`}>
              <Droplets size={28} className={status?.is_active ? 'text-white' : 'text-text-muted'} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {status?.is_active ? 'IRRIGATION ON' : 'IRRIGATION OFF'}
              </p>
              {status?.is_active && status.started_at && (
                <p className="text-text-muted text-sm">Started: {new Date(status.started_at).toLocaleTimeString()}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <button
              onClick={() => setConfirm({ action:'on', msg:'Turn irrigation ON? This will start the water pump.' })}
              disabled={status?.is_active || actionLoading}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all duration-200
                ${status?.is_active ? 'opacity-40 cursor-not-allowed bg-surface-border text-text-muted' : 'bg-gradient-primary text-white hover:shadow-glow-green active:scale-95'}`}
            >
              <Power size={22}/> Turn ON
            </button>
            <button
              onClick={() => setConfirm({ action:'off', msg:'Turn irrigation OFF? Water usage will be recorded.' })}
              disabled={!status?.is_active || actionLoading}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all duration-200
                ${!status?.is_active ? 'opacity-40 cursor-not-allowed bg-surface-border text-text-muted' : 'bg-danger text-white hover:bg-red-600 active:scale-95'}`}
            >
              <PowerOff size={22}/> Turn OFF
            </button>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-border rounded-xl p-3 text-center">
              <p className="text-xs text-text-muted mb-1"><Droplets size={12} className="inline"/> Water Used</p>
              <p className="text-xl font-bold text-accent">{status?.water_used_today ?? 0} L</p>
            </div>
            <div className="bg-surface-border rounded-xl p-3 text-center">
              <p className="text-xs text-text-muted mb-1"><BarChart2 size={12} className="inline"/> Water Saved</p>
              <p className="text-xl font-bold text-primary">{status?.water_saved_today ?? 0} L</p>
            </div>
            <div className="bg-surface-border rounded-xl p-3 text-center">
              <p className="text-xs text-text-muted mb-1"><Clock size={12} className="inline"/> Duration</p>
              <p className="text-xl font-bold text-warning">{status?.total_duration_today ?? 0} min</p>
            </div>
          </div>
        </div>

        {/* ML Recommendation */}
        <div className="card">
          <h2 className="section-title flex items-center gap-2 mb-4"><Zap size={18} className="text-primary"/> AI Recommendation</h2>
          {mlRec ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl text-center font-bold ${mlRec.irrigation_required ? 'bg-primary/20 text-primary' : 'bg-surface-border text-text-secondary'}`}>
                {mlRec.irrigation_required ? '💧 Irrigate Now' : '✅ Skip Irrigation'}
              </div>
              {mlRec.irrigation_required && (
                <>
                  <div className="bg-surface-border rounded-xl p-3">
                    <p className="text-xs text-text-muted">Recommended Amount</p>
                    <p className="text-2xl font-bold text-accent">{mlRec.water_quantity} L</p>
                  </div>
                  <div className="bg-surface-border rounded-xl p-3">
                    <p className="text-xs text-text-muted">Estimated Duration</p>
                    <p className="text-2xl font-bold text-warning">{mlRec.duration_minutes} min</p>
                  </div>
                </>
              )}
              <div className="bg-surface-border rounded-xl p-3">
                <p className="text-xs text-text-muted">Risk Level</p>
                <p className={`font-bold ${mlRec.risk_level === 'High' ? 'text-danger' : mlRec.risk_level === 'Medium' ? 'text-warning' : 'text-primary'}`}>
                  {mlRec.risk_level}
                </p>
              </div>
              <p className="text-xs text-text-muted text-center">{mlRec.recommendation_text}</p>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">
              Train the ML model to get AI-powered irrigation recommendations.
            </p>
          )}
        </div>
      </div>

      {/* Recent History */}
      <div className="card overflow-x-auto">
        <h2 className="section-title mb-4">📋 Recent Irrigation Events</h2>
        {history.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Action</th><th>Duration</th><th>Water Used</th><th>Triggered By</th></tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="text-text-primary">{h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}</td>
                  <td>
                    <span className={`badge ${h.action === 'on' ? 'badge-green' : 'badge-red'}`}>
                      {h.action?.toUpperCase()}
                    </span>
                  </td>
                  <td>{h.duration_minutes ? `${h.duration_minutes} min` : '—'}</td>
                  <td>{h.water_used ? `${h.water_used} L` : '—'}</td>
                  <td className="capitalize">{h.triggered_by || 'manual'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-text-muted text-center py-8">No irrigation events recorded yet.</p>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.msg}
          onConfirm={() => handleControl(confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
