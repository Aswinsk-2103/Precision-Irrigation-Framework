import { useState, useEffect } from 'react'
import { AlertTriangle, X, Droplets, Thermometer, CloudRain, Wind } from 'lucide-react'
import { getSensorLatest } from '../services/api'

export default function AlertBanner() {
  const [alerts, setAlerts] = useState([])
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await getSensorLatest()
        const newAlerts = []
        if (data.soil_moisture < 25)
          newAlerts.push({ id:'low_moisture', icon:'💧', msg:`Critical: Soil moisture very low (${data.soil_moisture?.toFixed(1)}%)`, color:'text-danger', bg:'bg-danger/10 border-danger/30' })
        if (data.temperature > 38)
          newAlerts.push({ id:'high_temp', icon:'🌡️', msg:`Warning: High temperature detected (${data.temperature?.toFixed(1)}°C)`, color:'text-warning', bg:'bg-warning/10 border-warning/30' })
        if (data.rain_probability > 75)
          newAlerts.push({ id:'rain', icon:'🌧️', msg:`Rain expected (${data.rain_probability?.toFixed(0)}%) — irrigation may not be needed`, color:'text-accent', bg:'bg-accent/10 border-accent/30' })
        setAlerts(newAlerts.filter(a => !dismissed.has(a.id)))
      } catch { /* no backend yet */ }
    }
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [dismissed])

  if (!alerts.length) return null

  return (
    <div className="px-6 py-2 space-y-1">
      {alerts.map(a => (
        <div key={a.id} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium animate-slide-up ${a.bg} ${a.color}`}>
          <span>{a.icon}</span>
          <span className="flex-1">{a.msg}</span>
          <button onClick={() => setDismissed(d => new Set([...d, a.id]))} className="opacity-60 hover:opacity-100 transition-opacity">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
