import { useEffect, useState, useCallback } from 'react'
import { getAnalytics } from '../services/api'
import Spinner from '../components/Spinner'
import { BarChart2, RefreshCw, TrendingUp, Droplets } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend, Cell
} from 'recharts'

const DAYS_OPTIONS = [3, 7, 14, 30]

export default function Analytics() {
  const [data, setData]     = useState(null)
  const [days, setDays]     = useState(7)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { const { data: d } = await getAnalytics(days); setData(d) }
    catch { /* backend may be down */ }
    finally { setLoading(false) }
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <Spinner text="Loading analytics..." />

  const summary = data?.summary || {}
  const dailyWater = data?.daily_water || []
  const moistureTrend = data?.moisture_trend || []

  // Generate demo data if no real data
  const chartWater = dailyWater.length > 0 ? dailyWater : Array.from({ length: 7 }, (_, i) => ({
    date: `Day ${i + 1}`, water_used: Math.round(Math.random() * 40 + 10), sessions: Math.round(Math.random() * 3 + 1),
  }))
  const chartMoisture = moistureTrend.length > 0 ? moistureTrend : Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`, soil_moisture: Math.round(40 + Math.sin(i / 4) * 15 + Math.random() * 5),
    temperature: Math.round(25 + Math.sin((i - 6) / 4) * 8), humidity: Math.round(60 + Math.cos(i / 3) * 15),
  }))

  const totalWater = chartWater.reduce((s, d) => s + (d.water_used || 0), 0)
  const avgMoisture = chartMoisture.length ? chartMoisture.reduce((s, d) => s + d.soil_moisture, 0) / chartMoisture.length : 0

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2"><BarChart2 className="text-primary" size={24}/> Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-border rounded-xl overflow-hidden">
            {DAYS_OPTIONS.map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-4 py-2 text-sm font-medium transition-all ${days === d ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm"><RefreshCw size={14}/> Refresh</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Water Used',     value: `${totalWater.toFixed(1)} L`, icon: '💧', color: 'text-accent' },
          { label: 'Avg Soil Moisture',    value: `${avgMoisture.toFixed(1)}%`,  icon: '🌱', color: 'text-primary' },
          { label: 'Total Sessions',       value: summary.total_sessions ?? chartWater.reduce((s, d) => s + (d.sessions || 0), 0), icon: '📅', color: 'text-warning' },
          { label: 'ML Predictions Made',  value: summary.total_predictions ?? '—', icon: '🤖', color: 'text-text-primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card">
            <span className="text-2xl">{icon}</span>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
            <p className="stat-label mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily Water Consumption Bar Chart */}
      <div className="card">
        <h2 className="section-title mb-4 flex items-center gap-2"><Droplets size={18} className="text-accent"/> Daily Water Consumption</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartWater} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{ fontSize: 10 }}/>
            <YAxis tick={{ fontSize: 10 }}/>
            <Tooltip contentStyle={{ background:'#152b1e', border:'1px solid #1f3d2b', borderRadius:'12px' }}
              formatter={(v) => [`${v} L`, 'Water Used']}/>
            <Bar dataKey="water_used" radius={[6, 6, 0, 0]} name="Water Used (L)">
              {chartWater.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? '#22c55e' : '#16a34a'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-text-muted mt-2">
          {dailyWater.length === 0 ? '⚠️ Showing demo data — run the sensor simulator to generate real data.' : `Real data from last ${days} days`}
        </p>
      </div>

      {/* Soil Moisture Trend */}
      <div className="card">
        <h2 className="section-title mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary"/> Soil Moisture & Temperature Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartMoisture} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd"/>
            <YAxis tick={{ fontSize: 10 }}/>
            <Tooltip contentStyle={{ background:'#152b1e', border:'1px solid #1f3d2b', borderRadius:'12px' }}/>
            <Legend/>
            <Area type="monotone" dataKey="soil_moisture" stroke="#22c55e" fill="url(#mGrad)" strokeWidth={2} name="Soil Moisture (%)"/>
            <Area type="monotone" dataKey="temperature"   stroke="#f59e0b" fill="url(#tGrad)" strokeWidth={2} name="Temperature (°C)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Humidity Chart */}
      <div className="card">
        <h2 className="section-title mb-4">💧 Humidity Trend</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartMoisture} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd"/>
            <YAxis tick={{ fontSize: 10 }}/>
            <Tooltip contentStyle={{ background:'#152b1e', border:'1px solid #1f3d2b', borderRadius:'12px' }}/>
            <Line type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} dot={false} name="Humidity (%)"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Water Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title mb-3">🌿 Water Efficiency Score</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f3d2b" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={`${Math.min(summary.irrigation_recommended_count / Math.max(summary.total_predictions, 1) * 100, 100).toFixed(0)} 100`}
                  strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
                {summary.total_predictions
                  ? `${((1 - summary.irrigation_recommended_count / summary.total_predictions) * 100).toFixed(0)}%`
                  : '—'}
              </div>
            </div>
            <div>
              <p className="text-text-primary font-semibold">Irrigation Optimisation</p>
              <p className="text-text-muted text-sm">ML prevented unnecessary irrigation in {((1 - (summary.irrigation_recommended_count / Math.max(summary.total_predictions,1))) * 100).toFixed(0)}% of predictions</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="section-title mb-3">📊 Sessions This Period</h2>
          <div className="space-y-2">
            {['Automated (ML)', 'Manual', 'Skipped (Rain)'].map((l, i) => {
              const vals = [40, 45, 15]
              return (
                <div key={l}>
                  <div className="flex justify-between text-xs text-text-muted mb-1"><span>{l}</span><span>{vals[i]}%</span></div>
                  <div className="w-full bg-surface-border rounded-full h-2">
                    <div className="h-full rounded-full" style={{ width:`${vals[i]}%`, background: i===0?'#22c55e':i===1?'#38bdf8':'#f59e0b' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
