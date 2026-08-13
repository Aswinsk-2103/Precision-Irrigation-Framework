import { useEffect, useState, useCallback } from 'react'
import { getIrrigationHistory, getPredictionHistory } from '../services/api'
import Spinner from '../components/Spinner'
import { History as HistoryIcon, RefreshCw, Droplets, Brain } from 'lucide-react'

const TABS = ['Irrigation Events', 'ML Predictions']

export default function History() {
  const [tab, setTab]           = useState(0)
  const [irrigation, setIrrigation] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [iRes, pRes] = await Promise.all([getIrrigationHistory(50), getPredictionHistory(30)])
      setIrrigation(iRes.data); setPredictions(pRes.data)
    } catch { /* skip */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return <Spinner text="Loading history..." />

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><HistoryIcon className="text-primary" size={24}/> History</h1>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm"><RefreshCw size={14}/> Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-border p-1 rounded-xl w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? 'bg-surface-card text-primary shadow' : 'text-text-muted hover:text-text-primary'}`}>
            {i === 0 ? <><Droplets size={14} className="inline mr-1.5"/>{t}</> : <><Brain size={14} className="inline mr-1.5"/>{t}</>}
          </button>
        ))}
      </div>

      {/* Irrigation History Tab */}
      {tab === 0 && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">💦 Irrigation Events</h2>
            <span className="badge badge-green">{irrigation.length} records</span>
          </div>
          {irrigation.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th><th>Action</th><th>Duration</th>
                  <th>Water Used</th><th>Triggered By</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {irrigation.map((h, i) => (
                  <tr key={i}>
                    <td className="text-text-primary whitespace-nowrap">
                      {h.timestamp ? new Date(h.timestamp).toLocaleString('en-IN') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${h.action === 'on' ? 'badge-green' : 'badge-red'}`}>
                        {h.action?.toUpperCase()}
                      </span>
                    </td>
                    <td>{h.duration_minutes ? `${h.duration_minutes} min` : '—'}</td>
                    <td>{h.water_used ? <span className="text-accent font-semibold">{h.water_used} L</span> : '—'}</td>
                    <td className="capitalize">{h.triggered_by || 'manual'}</td>
                    <td className="max-w-xs truncate">{h.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-muted">No irrigation events recorded yet.</p>
              <p className="text-xs text-text-muted mt-1">Use the Irrigation page to turn the pump ON/OFF.</p>
            </div>
          )}
        </div>
      )}

      {/* ML Prediction History Tab */}
      {tab === 1 && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">🤖 ML Prediction Log</h2>
            <span className="badge badge-blue">{predictions.length} records</span>
          </div>
          {predictions.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th><th>Result</th><th>Moisture %</th><th>Temp °C</th>
                  <th>Rain Prob %</th><th>Water (L)</th><th>Duration</th><th>Risk</th><th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={i}>
                    <td className="text-text-primary whitespace-nowrap">
                      {p.timestamp ? new Date(p.timestamp).toLocaleString('en-IN') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${p.irrigation_required ? 'badge-green' : 'badge-red'}`}>
                        {p.irrigation_required ? '💧 Irrigate' : '✅ Skip'}
                      </span>
                    </td>
                    <td className={p.soil_moisture < 30 ? 'text-danger font-semibold' : ''}>{p.soil_moisture?.toFixed(1)}</td>
                    <td className={p.temperature > 35 ? 'text-warning font-semibold' : ''}>{p.temperature?.toFixed(1)}</td>
                    <td className={p.rain_probability > 60 ? 'text-accent font-semibold' : ''}>{p.rain_probability?.toFixed(0)}</td>
                    <td className="text-accent">{p.water_quantity ? `${p.water_quantity} L` : '—'}</td>
                    <td>{p.duration_minutes ? `${p.duration_minutes} min` : '—'}</td>
                    <td>
                      <span className={`badge ${p.risk_level === 'High' ? 'badge-red' : p.risk_level === 'Medium' ? 'badge-yellow' : 'badge-green'}`}>
                        {p.risk_level}
                      </span>
                    </td>
                    <td className="font-semibold text-text-primary">{p.confidence?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-muted">No ML predictions recorded yet.</p>
              <p className="text-xs text-text-muted mt-1">Go to the ML Prediction page and run a prediction.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
