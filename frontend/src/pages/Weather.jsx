import { useEffect, useState, useCallback } from 'react'
import { getWeather } from '../services/api'
import Spinner from '../components/Spinner'
import { Cloud, RefreshCw, Wind, Droplets, Thermometer, Eye } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const CONDITION_ICON = {
  Clear: '☀️', Sunny: '☀️', Clouds: '☁️', Rain: '🌧️',
  Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️',
  'Partly Cloudy': '⛅', 'Light Rain': '🌦️',
}
const cIcon = (c) => CONDITION_ICON[c] || '🌤️'

export default function Weather() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchWeather = useCallback(async () => {
    try { const { data: d } = await getWeather(); setData(d) }
    catch { /* skip */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchWeather(); const t = setInterval(fetchWeather, 60000); return () => clearInterval(t) }, [fetchWeather])

  if (loading) return <Spinner text="Fetching weather data..." />

  const c = data?.current
  const forecast = data?.forecast || []
  const tempChartData = forecast.map(f => ({ name: f.date, min: f.temp_min, max: f.temp_max, rain: f.rain_probability }))

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Cloud className="text-accent" size={24}/> Weather Conditions</h1>
        <div className="flex items-center gap-2">
          {data?.source === 'mock' && <span className="badge badge-yellow">Simulated Data</span>}
          {data?.source === 'api'  && <span className="badge badge-green">Live API</span>}
          <button onClick={fetchWeather} className="btn-secondary flex items-center gap-2 text-sm"><RefreshCw size={14}/> Refresh</button>
        </div>
      </div>

      {c && (
        <>
          {/* Hero current weather */}
          <div className="card border border-accent/20 bg-accent/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <span className="text-7xl">{cIcon(c.condition)}</span>
                <div>
                  <p className="text-6xl font-bold text-text-primary">{c.temperature?.toFixed(1)}<span className="text-2xl text-text-muted">°C</span></p>
                  <p className="text-text-secondary text-lg capitalize mt-1">{c.description}</p>
                  <p className="text-text-muted text-sm">📍 {c.city || 'Your Location'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Thermometer size={16}/>, label:'Feels Like',  val:`${c.feels_like?.toFixed(1)}°C` },
                  { icon: <Droplets size={16}/>,   label:'Humidity',     val:`${c.humidity?.toFixed(0)}%` },
                  { icon: <Wind size={16}/>,        label:'Wind Speed',   val:`${c.wind_speed?.toFixed(1)} km/h` },
                  { icon: <Eye size={16}/>,          label:'Rain Chance',  val:`${c.rain_probability?.toFixed(0)}%` },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="bg-surface-border rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-text-muted mb-1">{icon}<span className="text-xs">{label}</span></div>
                    <p className="font-bold text-text-primary">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Irrigation advisory */}
            <div className={`mt-4 p-3 rounded-xl border text-sm font-medium ${
              c.rain_probability > 70
                ? 'bg-accent/10 border-accent/30 text-accent'
                : c.rainfall > 8
                ? 'bg-blue-500/10 border-blue-400/30 text-blue-300'
                : 'bg-primary/10 border-primary/30 text-primary'
            }`}>
              {c.rain_probability > 70
                ? `🌧️ Rain expected (${c.rain_probability?.toFixed(0)}% probability) — Consider skipping irrigation today.`
                : c.rainfall > 8
                ? `🌦️ Recent rainfall (${c.rainfall?.toFixed(1)}mm) detected — Soil may already be adequately moist.`
                : `☀️ No significant rainfall expected — Monitor soil moisture and irrigate as needed.`}
            </div>
          </div>

          {/* Forecast cards */}
          {forecast.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-4">📅 5-Day Forecast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {forecast.map((f, i) => (
                  <div key={i} className="bg-surface-border rounded-xl p-4 text-center hover:bg-surface-card transition-colors">
                    <p className="text-xs text-text-muted font-medium">{f.date}</p>
                    <p className="text-3xl my-2">{cIcon(f.condition)}</p>
                    <p className="text-sm font-bold text-text-primary">{f.temp_max?.toFixed(0)}°C</p>
                    <p className="text-xs text-text-muted">{f.temp_min?.toFixed(0)}°C</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-accent">
                      <Droplets size={10}/>{f.rain_probability?.toFixed(0)}%
                    </div>
                    {f.rainfall > 0 && <p className="text-xs text-blue-400 mt-0.5">{f.rainfall?.toFixed(1)}mm</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Temperature trend chart */}
          {tempChartData.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-4">📈 Temperature & Rain Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tempChartData} margin={{ top:4, right:8, bottom:4, left:0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="name" tick={{ fontSize:10 }}/>
                  <YAxis tick={{ fontSize:10 }}/>
                  <Tooltip contentStyle={{ background:'#152b1e', border:'1px solid #1f3d2b', borderRadius:'12px' }} labelStyle={{ color:'#f0fdf4' }}/>
                  <Area type="monotone" dataKey="max" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} name="Max Temp (°C)"/>
                  <Area type="monotone" dataKey="min" stroke="#22c55e" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Min Temp (°C)"/>
                  <Area type="monotone" dataKey="rain" stroke="#38bdf8" fill="url(#rainGrad)" strokeWidth={2} name="Rain Prob (%)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!c && (
        <div className="card text-center py-16">
          <Cloud size={48} className="text-text-muted mx-auto mb-4"/>
          <p className="text-text-muted">Unable to fetch weather data. Add your API key to <code className="text-primary">backend/.env</code></p>
        </div>
      )}
    </div>
  )
}
