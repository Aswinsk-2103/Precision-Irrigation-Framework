import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Droplets, Thermometer, Wind, CloudRain, Activity, Zap } from 'lucide-react'
import { getSensorLatest, getIrrigationStatus, runPrediction, getWeather } from '../services/api'
import StatCard from '../components/StatCard'
import Spinner from '../components/Spinner'
import { Link } from 'react-router-dom'

function MoistureBar({ value, min = 0, max = 100 }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const color = value < 30 ? '#ef4444' : value < 50 ? '#f59e0b' : '#22c55e'
  return (
    <div className="w-full bg-surface-border rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function Dashboard() {
  const [sensor, setSensor]   = useState(null)
  const [status, setStatus]   = useState(null)
  const [weather, setWeather] = useState(null)
  const [pred, setPred]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, stRes, wRes] = await Promise.allSettled([
        getSensorLatest(), getIrrigationStatus(), getWeather()
      ])
      if (sRes.status === 'fulfilled')  setSensor(sRes.value.data)
      if (stRes.status === 'fulfilled') setStatus(stRes.value.data)
      if (wRes.status === 'fulfilled')  setWeather(wRes.value.data)
      setLastUpdate(new Date())

      // Auto-predict based on latest sensor + weather
      if (sRes.status === 'fulfilled' && wRes.status === 'fulfilled') {
        const s = sRes.value.data
        const w = wRes.value.data.current
        try {
          const pRes = await runPrediction({
            soil_moisture: s.soil_moisture, temperature: s.temperature,
            humidity: s.humidity, rainfall: s.rainfall || 0,
            rain_probability: s.rain_probability || w?.rain_probability || 0,
            wind_speed: s.wind_speed || 0, soil_type: 'Loamy',
            crop_type: 'Wheat', growth_stage: 'Vegetative',
            prev_irrigation: 0, hours_since_irrigation: 24,
          })
          setPred(pRes.data)
        } catch { /* model not trained yet */ }
      }
    } catch { /* backend may not be up */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 15000); return () => clearInterval(t) }, [fetchAll])

  if (loading) return <Spinner text="Loading dashboard..." />

  const riskColor = { Low: 'green', Medium: 'yellow', High: 'red' }[pred?.risk_level] || 'green'

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🌱 Smart Irrigation Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : 'Connecting to sensors...'}
          </p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Droplets size={18}/>} label="Soil Moisture" value={sensor?.soil_moisture?.toFixed(1) ?? '—'} unit="%" color="blue"
          subtitle={sensor?.soil_moisture < 30 ? '⚠️ Critically low' : sensor?.soil_moisture < 50 ? 'Below optimal' : 'Good'} />
        <StatCard icon={<Thermometer size={18}/>} label="Temperature" value={sensor?.temperature?.toFixed(1) ?? '—'} unit="°C"
          color={sensor?.temperature > 35 ? 'red' : 'yellow'} subtitle={weather?.current?.condition || 'Ambient'} />
        <StatCard icon={<Activity size={18}/>} label="Humidity" value={sensor?.humidity?.toFixed(1) ?? '—'} unit="%" color="green" />
        <StatCard icon={<CloudRain size={18}/>} label="Rain Probability" value={sensor?.rain_probability?.toFixed(0) ?? weather?.current?.rain_probability?.toFixed(0) ?? '—'} unit="%"
          color={sensor?.rain_probability > 60 ? 'blue' : 'green'} subtitle={weather?.current?.city || ''} />
      </div>

      {/* Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Soil Moisture Visual */}
        <div className="card space-y-4">
          <h2 className="section-title flex items-center gap-2"><Droplets size={18} className="text-primary" /> Soil Status</h2>
          {sensor ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-5xl font-bold text-primary">{sensor.soil_moisture?.toFixed(1)}<span className="text-2xl text-text-muted">%</span></span>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Wind</p>
                  <p className="text-sm font-semibold text-text-primary">{sensor.wind_speed?.toFixed(1)} km/h</p>
                  <p className="text-xs text-text-muted mt-1">Rainfall</p>
                  <p className="text-sm font-semibold text-text-primary">{sensor.rainfall?.toFixed(1)} mm</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Dry (0%)</span><span>Optimal (50-70%)</span><span>Wet (100%)</span>
                </div>
                <MoistureBar value={sensor.soil_moisture} />
              </div>
              <p className="text-xs text-text-muted">Source: {sensor.source || 'sensor'} • Farm: {sensor.farm_id}</p>
            </>
          ) : <p className="text-text-muted text-sm">No sensor data available. Start the simulator.</p>}
        </div>

        {/* ML Prediction Card */}
        <div className={`card border ${pred?.irrigation_required ? 'border-primary/40 bg-primary/5' : 'border-surface-border'}`}>
          <h2 className="section-title flex items-center gap-2 mb-4"><Zap size={18} className="text-primary" /> ML Prediction</h2>
          {pred ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl text-center font-bold text-lg ${pred.irrigation_required ? 'bg-primary/20 text-primary' : 'bg-surface-border text-text-secondary'}`}>
                {pred.irrigation_required ? '💧 Irrigation Required' : '✅ No Irrigation Needed'}
              </div>
              {pred.irrigation_required && (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-surface-border rounded-xl p-2">
                    <p className="text-xl font-bold text-accent">{pred.water_quantity} L</p>
                    <p className="text-xs text-text-muted">Water Needed</p>
                  </div>
                  <div className="bg-surface-border rounded-xl p-2">
                    <p className="text-xl font-bold text-warning">{pred.duration_minutes} min</p>
                    <p className="text-xs text-text-muted">Duration</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Risk Level</span>
                <span className={`badge badge-${riskColor === 'green' ? 'green' : riskColor === 'yellow' ? 'yellow' : 'red'}`}>
                  {pred.risk_level}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Confidence</span>
                <span className="text-text-primary font-semibold">{pred.confidence?.toFixed(1)}%</span>
              </div>
              <Link to="/prediction" className="block text-center text-xs text-primary hover:underline mt-2">
                View full analysis →
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-text-muted text-sm">ML model not loaded.</p>
              <p className="text-text-muted text-xs mt-1">Run <code className="text-primary">python train.py</code> first.</p>
              <Link to="/prediction" className="btn-primary text-xs mt-4 inline-block">Manual Predict</Link>
            </div>
          )}
        </div>

        {/* Irrigation Status */}
        <div className="card">
          <h2 className="section-title mb-4">💦 Today's Irrigation</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-border">
              <span className="text-sm text-text-secondary">Status</span>
              <span className={`flex items-center gap-2 font-semibold text-sm ${status?.is_active ? 'text-primary' : 'text-text-muted'}`}>
                <span className={`pulse-dot ${status?.is_active ? 'bg-primary' : 'bg-text-muted'}`}></span>
                {status?.is_active ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-accent">{status?.water_used_today ?? 0} L</p>
                <p className="text-xs text-text-muted">Used Today</p>
              </div>
              <div className="bg-surface-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">{status?.water_saved_today ?? 0} L</p>
                <p className="text-xs text-text-muted">Saved Today</p>
              </div>
            </div>
            <Link to="/irrigation" className="btn-primary w-full text-center text-sm block">
              Open Control Panel
            </Link>
          </div>
        </div>
      </div>

      {/* Weather Strip */}
      {weather?.forecast?.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">🌤️ 5-Day Forecast — {weather.current?.city}</h2>
          <div className="grid grid-cols-5 gap-3">
            {weather.forecast.slice(0, 5).map((f, i) => (
              <div key={i} className="bg-surface-border rounded-xl p-3 text-center hover:bg-surface-card transition-colors">
                <p className="text-xs text-text-muted">{f.date}</p>
                <p className="text-lg my-1">{f.condition.includes('Rain') ? '🌧️' : f.condition.includes('Cloud') ? '☁️' : '☀️'}</p>
                <p className="text-sm font-semibold text-text-primary">{f.temp_max?.toFixed(0)}°</p>
                <p className="text-xs text-text-muted">{f.temp_min?.toFixed(0)}°</p>
                <p className="text-xs text-accent mt-1">{f.rain_probability?.toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
