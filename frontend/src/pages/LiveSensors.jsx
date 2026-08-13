import { useEffect, useState, useCallback } from 'react'
import { getSensorHistory, getSensorLatest } from '../services/api'
import Spinner from '../components/Spinner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { Activity, RefreshCw } from 'lucide-react'

const METRICS = [
  { key: 'soil_moisture', label: 'Soil Moisture', unit: '%', color: '#22c55e', refMin: 40, refMax: 70 },
  { key: 'temperature',   label: 'Temperature',   unit: '°C', color: '#f59e0b' },
  { key: 'humidity',      label: 'Humidity',      unit: '%',  color: '#38bdf8' },
  { key: 'rainfall',      label: 'Rainfall',      unit: 'mm', color: '#818cf8' },
]

function SensorValue({ label, value, unit, color, icon }) {
  return (
    <div className="card flex flex-col gap-1 hover:shadow-glow-green transition-all duration-300">
      <span className="stat-label">{label}</span>
      <div className="flex items-end gap-1">
        <span className="text-4xl font-bold" style={{ color }}>{value ?? '—'}</span>
        <span className="text-text-muted mb-1">{unit}</span>
      </div>
      <div className="w-full bg-surface-border rounded-full h-1.5 overflow-hidden mt-1">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, value || 0)}%`, background: color }} />
      </div>
    </div>
  )
}

export default function LiveSensors() {
  const [history, setHistory] = useState([])
  const [latest, setLatest]   = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [hist, lat] = await Promise.all([getSensorHistory(60), getSensorLatest()])
      const processed = hist.data.reverse().map(d => ({
        ...d,
        time: new Date(d.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
      }))
      setHistory(processed)
      setLatest(lat.data)
    } catch { /* backend may be down */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 10000); return () => clearInterval(t) }, [fetchData])

  if (loading) return <Spinner text="Loading sensor data..." />

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Activity className="text-primary" size={24}/> Live Sensors</h1>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Live value cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorValue label="Soil Moisture" value={latest?.soil_moisture?.toFixed(1)} unit="%" color="#22c55e" />
        <SensorValue label="Temperature"   value={latest?.temperature?.toFixed(1)}   unit="°C" color="#f59e0b" />
        <SensorValue label="Humidity"      value={latest?.humidity?.toFixed(1)}      unit="%" color="#38bdf8" />
        <SensorValue label="Rainfall"      value={latest?.rainfall?.toFixed(1)}      unit="mm" color="#818cf8" />
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="stat-label">Wind Speed</p>
          <p className="text-3xl font-bold text-text-primary">{latest?.wind_speed?.toFixed(1) ?? '—'}<span className="text-sm text-text-muted"> km/h</span></p>
        </div>
        <div className="card text-center">
          <p className="stat-label">Rain Probability</p>
          <p className="text-3xl font-bold text-accent">{latest?.rain_probability?.toFixed(0) ?? '—'}<span className="text-sm text-text-muted">%</span></p>
        </div>
        <div className="card text-center">
          <p className="stat-label">Data Source</p>
          <p className="text-lg font-bold text-text-primary capitalize">{latest?.source ?? 'N/A'}</p>
          <p className="text-xs text-text-muted mt-1">{latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : ''}</p>
        </div>
      </div>

      {/* Charts */}
      {history.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {METRICS.map(m => (
            <div key={m.key} className="card">
              <h3 className="font-semibold text-text-primary mb-4">{m.label} ({m.unit})</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history} margin={{ top:4, right:8, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize:10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip contentStyle={{ background:'#152b1e', border:'1px solid #1f3d2b', borderRadius:'12px' }}
                    labelStyle={{ color:'#f0fdf4' }} itemStyle={{ color: m.color }} />
                  {m.refMin && <ReferenceLine y={m.refMin} stroke="#ef4444" strokeDasharray="4 4" label={{ value:'Min', fill:'#ef4444', fontSize:9 }} />}
                  {m.refMax && <ReferenceLine y={m.refMax} stroke="#22c55e" strokeDasharray="4 4" label={{ value:'Max', fill:'#22c55e', fontSize:9 }} />}
                  <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={false} activeDot={{ r:4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-text-muted">No historical sensor data yet.</p>
          <p className="text-sm text-text-muted mt-1">Start the sensor simulator: <code className="text-primary">python sensor-simulator/simulator.py</code></p>
        </div>
      )}

      {/* Raw data table */}
      {history.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="font-semibold text-text-primary mb-3">Recent Readings</h3>
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Moisture %</th><th>Temp °C</th><th>Humidity %</th><th>Rainfall mm</th><th>Source</th></tr>
            </thead>
            <tbody>
              {history.slice(-10).reverse().map((r, i) => (
                <tr key={i}>
                  <td className="text-text-primary">{r.time}</td>
                  <td className={r.soil_moisture < 30 ? 'text-danger font-semibold' : 'text-primary'}>{r.soil_moisture?.toFixed(1)}</td>
                  <td className={r.temperature > 35 ? 'text-warning font-semibold' : ''}>{r.temperature?.toFixed(1)}</td>
                  <td>{r.humidity?.toFixed(1)}</td>
                  <td>{r.rainfall?.toFixed(1)}</td>
                  <td className="capitalize">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
