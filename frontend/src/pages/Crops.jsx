import { useEffect, useState } from 'react'
import { getCrops, createCrop } from '../services/api'
import Spinner from '../components/Spinner'
import { Leaf, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const CROP_ICONS = { Rice:'🌾', Wheat:'🌿', Tomato:'🍅', Cotton:'🌸', Maize:'🌽', Sugarcane:'🎋', Groundnut:'🥜' }

function MoistureRangeBar({ minThreshold, optimalMin, optimalMax }) {
  return (
    <div className="space-y-1.5 my-2">
      {/* 0-100% Scale Track */}
      <div className="relative w-full bg-surface-border rounded-full h-2.5 overflow-hidden border border-white/5">
        {/* Danger zone (0% to minThreshold) */}
        <div
          className="absolute top-0 bottom-0 bg-red-500/25"
          style={{ left: '0%', width: `${minThreshold}%` }}
        />
        {/* Caution zone (minThreshold to optimalMin) */}
        {optimalMin > minThreshold && (
          <div
            className="absolute top-0 bottom-0 bg-amber-500/20"
            style={{ left: `${minThreshold}%`, width: `${optimalMin - minThreshold}%` }}
          />
        )}
        {/* Optimal Moisture Range (optimalMin to optimalMax) */}
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full shadow-sm"
          style={{
            left: `${optimalMin}%`,
            width: `${Math.max(3, optimalMax - optimalMin)}%`
          }}
        />
        {/* Min Threshold Marker Line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 shadow-[0_0_5px_#ef4444]"
          style={{ left: `${minThreshold}%` }}
        />
      </div>

      {/* Markers & Legend */}
      <div className="flex justify-between text-[10px] text-text-muted px-0.5">
        <span>0%</span>
        <span className="text-red-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
          Min {minThreshold}%
        </span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
          Opt {optimalMin}–{optimalMax}%
        </span>
        <span>100%</span>
      </div>
    </div>
  )
}

function CropCard({ crop, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const icon = CROP_ICONS[crop.name] || crop.icon || '🌱'
  return (
    <div
      className={`card border-2 cursor-pointer transition-all duration-200 ${selected ? 'border-primary shadow-glow-green bg-primary/5' : 'border-surface-border hover:border-primary/40'}`}
      onClick={() => onSelect(crop)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="font-bold text-text-primary">{crop.name}</h3>
            {crop.is_custom && <span className="badge badge-blue text-[10px]">Custom</span>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); setExpanded(x => !x) }} className="text-text-muted hover:text-text-primary transition-colors">
          {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-text-muted">
          <span>Moisture Profile</span>
        </div>

        <MoistureRangeBar
          minThreshold={crop.min_moisture_threshold}
          optimalMin={crop.optimal_moisture_min}
          optimalMax={crop.optimal_moisture_max}
        />

        <div className="flex justify-between text-xs mt-2 pt-1 border-t border-surface-border/50">
          <span className="text-text-muted">Water Requirement</span>
          <span className="text-accent font-medium">{crop.typical_water_requirement} L/session</span>
        </div>
      </div>

      {expanded && crop.growth_stages?.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-surface-border pt-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Growth Stages</p>
          {crop.growth_stages.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-border rounded-lg px-3 py-1.5 text-xs">
              <span className="text-text-secondary">{s.name}</span>
              <div className="flex gap-3">
                <span className="text-text-muted">💧 {s.water_requirement} L</span>
                <span className="text-primary">{s.min_moisture}–{s.max_moisture}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Crops() {
  const [crops, setCrops]     = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ name:'', optimal_moisture_min:50, optimal_moisture_max:70, min_moisture_threshold:35, typical_water_requirement:20 })
  const [saving, setSaving]   = useState(false)

  const fetchCrops = async () => {
    try { const { data } = await getCrops(); setCrops(data) } catch { /* skip */ }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchCrops() }, [])

  const addCrop = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await createCrop({ ...form, growth_stages: [], is_custom: true })
      await fetchCrops()
      setShowForm(false)
      setForm({ name:'', optimal_moisture_min:50, optimal_moisture_max:70, min_moisture_threshold:35, typical_water_requirement:20 })
    } catch (e) { alert(e.response?.data?.detail || 'Failed to add crop') }
    setSaving(false)
  }

  if (loading) return <Spinner text="Loading crops..." />

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><Leaf className="text-primary" size={24}/> Crop Management</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Custom Crop</>}
        </button>
      </div>

      {selected && (
        <div className="card border border-primary/40 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{CROP_ICONS[selected.name] || '🌱'}</span>
              <div>
                <h2 className="text-xl font-bold text-primary">{selected.name} — Active Crop</h2>
                <p className="text-sm text-text-muted">Thresholds loaded for ML predictions</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary"><X size={18}/></button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card border border-primary/30 animate-slide-up">
          <h2 className="section-title mb-4">Add Custom Crop</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="col-span-2 lg:col-span-1 flex flex-col gap-1">
              <span className="text-xs text-text-muted">Crop Name *</span>
              <input className="input" placeholder="e.g. Soybean" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}/>
            </label>
            {[
              { k:'optimal_moisture_min', label:'Optimal Moisture Min (%)' },
              { k:'optimal_moisture_max', label:'Optimal Moisture Max (%)' },
              { k:'min_moisture_threshold', label:'Min Moisture Threshold (%)' },
              { k:'typical_water_requirement', label:'Water Requirement (L/session)' },
            ].map(({ k, label }) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">{label}</span>
                <input type="number" className="input" value={form[k]} onChange={e => setForm(f => ({...f, [k]: parseFloat(e.target.value)}))}/>
              </label>
            ))}
          </div>
          <button onClick={addCrop} disabled={saving} className="btn-primary mt-4 flex items-center gap-2 text-sm">
            <Plus size={14}/> {saving ? 'Saving...' : 'Add Crop'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {crops.map(crop => (
          <CropCard key={crop.id} crop={crop} selected={selected?.id === crop.id} onSelect={setSelected} />
        ))}
      </div>
    </div>
  )
}
