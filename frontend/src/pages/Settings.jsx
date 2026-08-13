import { useState } from 'react'
import { Settings as SettingsIcon, Save, User, Database, Cpu, Bell } from 'lucide-react'

const SECTION = ({ title, icon, children }) => (
  <div className="card space-y-4">
    <h2 className="section-title flex items-center gap-2">{icon}{title}</h2>
    {children}
  </div>
)

const Row = ({ label, desc, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
    <div>
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {desc && <p className="text-xs text-text-muted">{desc}</p>}
    </div>
    <div className="ml-4">{children}</div>
  </div>
)

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${value ? 'bg-primary' : 'bg-surface-border'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${value ? 'translate-x-5' : 'translate-x-0'}`}/>
    </button>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState({
    farmName: 'Demo Farm',
    city: 'Mumbai',
    weatherApiKey: '',
    simulatorInterval: 10,
    autoIrrigation: false,
    mlAutoPredict: true,
    alertLowMoisture: true,
    alertHighTemp: true,
    alertRain: true,
    alertSensorOffline: true,
    role: 'farmer',
    moistureAlertThreshold: 25,
    tempAlertThreshold: 38,
  })
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <h1 className="page-title flex items-center gap-2"><SettingsIcon className="text-primary" size={24}/> Settings</h1>

      {/* Farm & Account */}
      <SECTION title="Farm & Account" icon={<User size={18} className="text-primary"/>}>
        <Row label="Farm Name" desc="Display name for your farm">
          <input className="input w-48 text-sm" value={settings.farmName} onChange={e => set('farmName', e.target.value)}/>
        </Row>
        <Row label="Location / City" desc="Used for weather forecasting">
          <input className="input w-48 text-sm" placeholder="e.g. Mumbai" value={settings.city} onChange={e => set('city', e.target.value)}/>
        </Row>
        <Row label="User Role" desc="Your access level">
          <select className="select w-36 text-sm" value={settings.role} onChange={e => set('role', e.target.value)}>
            <option value="farmer">Farmer</option>
            <option value="admin">Admin</option>
          </select>
        </Row>
      </SECTION>

      {/* Weather API */}
      <SECTION title="Weather API" icon={<Database size={18} className="text-accent"/>}>
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-sm text-accent">
          💡 Add your OpenWeatherMap API key for live weather data. Without it, simulated weather data is used.
        </div>
        <Row label="OpenWeatherMap API Key" desc="Get a free key at openweathermap.org">
          <input className="input w-64 text-sm" type="password" placeholder="Paste your API key..."
            value={settings.weatherApiKey} onChange={e => set('weatherApiKey', e.target.value)}/>
        </Row>
        <p className="text-xs text-text-muted">After updating, add this key to <code className="text-primary">backend/.env → WEATHER_API_KEY</code></p>
      </SECTION>

      {/* Sensor Simulator */}
      <SECTION title="Sensor Simulator" icon={<Cpu size={18} className="text-warning"/>}>
        <Row label="Simulator Interval (seconds)" desc="How often sensor data is posted to backend">
          <input type="number" min={5} max={60} className="input w-24 text-sm"
            value={settings.simulatorInterval} onChange={e => set('simulatorInterval', parseInt(e.target.value))}/>
        </Row>
        <div className="bg-surface-border rounded-xl p-4 text-sm space-y-2">
          <p className="text-text-primary font-medium">Start Simulator</p>
          <code className="text-primary text-xs block bg-surface p-2 rounded-lg">python sensor-simulator/simulator.py</code>
          <p className="text-text-muted text-xs">Edit <code>INTERVAL_SECONDS</code> in the script to change the polling frequency.</p>
        </div>
      </SECTION>

      {/* ML / Automation */}
      <SECTION title="ML & Automation" icon={<Cpu size={18} className="text-primary"/>}>
        <Row label="Auto ML Prediction" desc="Automatically run predictions with each sensor reading">
          <Toggle value={settings.mlAutoPredict} onChange={v => set('mlAutoPredict', v)}/>
        </Row>
        <Row label="Auto Irrigation" desc="Automatically control pump based on ML decision (CAUTION)">
          <Toggle value={settings.autoIrrigation} onChange={v => set('autoIrrigation', v)}/>
        </Row>
        {settings.autoIrrigation && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm">
            ⚠️ Auto irrigation will control your pump without confirmation. Use with caution in production.
          </div>
        )}
      </SECTION>

      {/* Alert Thresholds */}
      <SECTION title="Alert Thresholds" icon={<Bell size={18} className="text-warning"/>}>
        <Row label="Low Moisture Alerts" desc="Get alerted when soil moisture drops below threshold">
          <Toggle value={settings.alertLowMoisture} onChange={v => set('alertLowMoisture', v)}/>
        </Row>
        <Row label="Moisture Alert Threshold (%)" desc="Alert fires below this value">
          <input type="number" min={5} max={60} className="input w-24 text-sm"
            value={settings.moistureAlertThreshold} onChange={e => set('moistureAlertThreshold', parseInt(e.target.value))}/>
        </Row>
        <Row label="High Temperature Alerts" desc="Alert when temperature exceeds threshold">
          <Toggle value={settings.alertHighTemp} onChange={v => set('alertHighTemp', v)}/>
        </Row>
        <Row label="Temperature Alert Threshold (°C)" desc="Alert fires above this value">
          <input type="number" min={30} max={50} className="input w-24 text-sm"
            value={settings.tempAlertThreshold} onChange={e => set('tempAlertThreshold', parseInt(e.target.value))}/>
        </Row>
        <Row label="Rain Expected Alerts" desc="Alert when rain probability is high">
          <Toggle value={settings.alertRain} onChange={v => set('alertRain', v)}/>
        </Row>
        <Row label="Sensor Offline Alerts" desc="Alert when no sensor data received for >5 minutes">
          <Toggle value={settings.alertSensorOffline} onChange={v => set('alertSensorOffline', v)}/>
        </Row>
      </SECTION>

      {/* System Info */}
      <SECTION title="System Information" icon={<Database size={18} className="text-text-muted"/>}>
        {[
          ['Backend',   'FastAPI + Python 3.10+'],
          ['Database',  'MongoDB (local)'],
          ['ML Engine', 'Random Forest (scikit-learn)'],
          ['Frontend',  'React 18 + Vite + Tailwind CSS'],
          ['Sensors',   'IoT Simulator / ESP32 Compatible'],
          ['Version',   'v1.0.0 — MVP'],
        ].map(([k, v]) => (
          <Row key={k} label={k}><span className="text-text-muted text-sm">{v}</span></Row>
        ))}
      </SECTION>

      <button onClick={save}
        className={`btn-primary flex items-center gap-2 transition-all duration-300 ${saved ? 'bg-green-500 shadow-glow-green' : ''}`}>
        <Save size={16}/>{saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
