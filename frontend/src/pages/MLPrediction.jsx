import { useState } from 'react'
import { runPrediction, getSensorLatest, getWeather } from '../services/api'
import { Brain, Zap, Loader2, RefreshCw } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const CROPS    = ['Rice','Wheat','Tomato','Cotton','Maize','Sugarcane','Groundnut']
const SOILS    = ['Sandy','Loamy','Clay','Silty','Peaty']
const STAGES   = ['Germination','Vegetative','Flowering','Fruiting','Maturity']

const DEFAULT_FORM = {
  soil_moisture: 35, temperature: 30, humidity: 60, rainfall: 0,
  rain_probability: 20, wind_speed: 10, soil_type: 'Loamy',
  crop_type: 'Wheat', growth_stage: 'Vegetative',
  prev_irrigation: 0, hours_since_irrigation: 24,
}

function RiskBadge({ level }) {
  const map = { Low: 'badge-green', Medium: 'badge-yellow', High: 'badge-red' }
  return <span className={`badge ${map[level] || 'badge-green'} text-sm px-3 py-1`}>{level}</span>
}

export default function MLPrediction() {
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const autoFill = async () => {
    try {
      const [sRes, wRes] = await Promise.allSettled([getSensorLatest(), getWeather()])
      if (sRes.status === 'fulfilled') {
        const s = sRes.value.data
        setForm(f => ({ ...f, soil_moisture: s.soil_moisture, temperature: s.temperature, humidity: s.humidity, rainfall: s.rainfall || 0, wind_speed: s.wind_speed || 0 }))
      }
      if (wRes.status === 'fulfilled') {
        const w = wRes.value.data.current
        setForm(f => ({ ...f, rain_probability: w.rain_probability || 0 }))
      }
    } catch { /* ignore */ }
  }

  const predict = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await runPrediction(form)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Make sure the ML model is trained.')
    }
    setLoading(false)
  }

  // Feature importance bar data
  const fiData = result?.feature_importance
    ? Object.entries(result.feature_importance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: parseFloat(v.toFixed(1)) }))
    : []

  return (
    <div className="space-y-6 animate-slide-up">
      <h1 className="page-title flex items-center gap-2"><Brain className="text-primary" size={24}/> ML Prediction Engine</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Input Parameters</h2>
            <button onClick={autoFill} className="btn-secondary flex items-center gap-2 text-xs">
              <RefreshCw size={12}/> Auto-fill from Sensors
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { k:'soil_moisture', label:'Soil Moisture (%)', min:0,  max:100, step:0.1 },
              { k:'temperature',   label:'Temperature (°C)',  min:-10, max:60,  step:0.1 },
              { k:'humidity',      label:'Humidity (%)',      min:0,   max:100, step:0.1 },
              { k:'rainfall',      label:'Rainfall (mm)',     min:0,   max:200, step:0.1 },
              { k:'rain_probability', label:'Rain Probability (%)', min:0, max:100, step:1 },
              { k:'wind_speed',    label:'Wind Speed (km/h)', min:0,   max:100, step:0.1 },
              { k:'prev_irrigation',label:'Prev. Irrigation (L)',min:0,max:100,step:0.1},
              { k:'hours_since_irrigation',label:'Hours Since Irrigation',min:0,max:168,step:1},
            ].map(({ k, label, min, max, step }) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="text-xs text-text-muted font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <input type="range" min={min} max={max} step={step} value={form[k]}
                    onChange={e => set(k, parseFloat(e.target.value))}
                    className="flex-1 accent-primary" />
                  <span className="text-xs font-bold text-text-primary w-10 text-right">{form[k]}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { k:'soil_type',    label:'Soil Type',    opts: SOILS  },
              { k:'crop_type',    label:'Crop Type',    opts: CROPS  },
              { k:'growth_stage', label:'Growth Stage', opts: STAGES },
            ].map(({ k, label, opts }) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="text-xs text-text-muted font-medium">{label}</span>
                <select className="select text-sm" value={form[k]} onChange={e => set(k, e.target.value)}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>

          <button onClick={predict} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin"/> Predicting...</> : <><Zap size={16}/> Run ML Prediction</>}
          </button>
          {error && <p className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-xl p-3">{error}</p>}
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Decision */}
              <div className={`card border-2 text-center ${result.irrigation_required ? 'border-primary bg-primary/10' : 'border-surface-border'}`}>
                <div className="text-4xl mb-2">{result.irrigation_required ? '💧' : '✅'}</div>
                <h2 className="text-xl font-bold text-text-primary">
                  Irrigation {result.irrigation_required ? 'Required' : 'Not Required'}
                </h2>
                <p className="text-text-muted text-sm mt-1">{result.recommendation_text}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <RiskBadge level={result.risk_level}/>
                  <span className="text-text-muted text-sm">Confidence: <strong className="text-text-primary">{result.confidence?.toFixed(1)}%</strong></span>
                </div>
              </div>

              {result.irrigation_required && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="card text-center border border-accent/20">
                    <p className="text-3xl font-bold text-accent">{result.water_quantity} L</p>
                    <p className="text-xs text-text-muted mt-1">💧 Recommended Water</p>
                  </div>
                  <div className="card text-center border border-warning/20">
                    <p className="text-3xl font-bold text-warning">{result.duration_minutes} min</p>
                    <p className="text-xs text-text-muted mt-1">⏱️ Duration</p>
                  </div>
                </div>
              )}

              {/* Explainability — Reasons */}
              <div className="card">
                <h3 className="font-semibold text-text-primary mb-3">🤔 Why this decision?</h3>
                <ul className="space-y-2">
                  {result.reasons?.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                      <span className="text-text-secondary">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature Importance Bar Chart */}
              {fiData.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-text-primary mb-3">📊 Feature Importance</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={fiData} layout="vertical" margin={{ left: 80, right: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#a3c4a8' }} />
                      <Tooltip contentStyle={{ background:'#152b1e', border:'1px solid #1f3d2b', borderRadius:'12px' }}
                        formatter={(v) => [`${v}%`, 'Importance']} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {fiData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#22c55e' : i === 1 ? '#38bdf8' : '#6b9e78'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-16 border-2 border-dashed border-surface-border">
              <Brain size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">Configure inputs and click <strong className="text-primary">Run ML Prediction</strong></p>
              <p className="text-xs text-text-muted mt-2">Uses Random Forest trained on 5,000 agricultural samples</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
