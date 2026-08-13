import { Bell, Wifi, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function TopBar() {
  const [time, setTime] = useState(new Date())
  useState(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  })

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-surface-border bg-surface/60 backdrop-blur-md z-10">
      <div>
        <p className="text-xs text-text-muted">
          {time.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
        <p className="text-sm font-semibold text-text-primary">
          {time.toLocaleTimeString('en-IN')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          <Wifi size={12} />
          <span>Live</span>
        </div>
        <button className="relative p-2 rounded-xl bg-surface-border hover:bg-surface-card transition-colors">
          <Bell size={16} className="text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
          F
        </div>
      </div>
    </header>
  )
}
