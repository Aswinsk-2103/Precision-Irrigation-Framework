export default function StatCard({ icon, label, value, unit = '', color = 'green', trend, subtitle }) {
  const colors = {
    green:  { bg: 'bg-primary/10',  border: 'border-primary/20',  icon: 'text-primary',  glow: 'shadow-glow-green' },
    blue:   { bg: 'bg-accent/10',   border: 'border-accent/20',   icon: 'text-accent',   glow: 'shadow-glow-blue'  },
    yellow: { bg: 'bg-warning/10',  border: 'border-warning/20',  icon: 'text-warning',  glow: '' },
    red:    { bg: 'bg-danger/10',   border: 'border-danger/20',   icon: 'text-danger',   glow: '' },
  }
  const c = colors[color] || colors.green

  return (
    <div className={`card border ${c.border} ${c.bg} hover:${c.glow} transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${c.bg} border ${c.border}`}>
          <span className={`${c.icon} block`}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-primary bg-primary/10' : 'text-danger bg-danger/10'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-1">
        <div className="stat-label mb-1">{label}</div>
        <div className="flex items-end gap-1">
          <span className="stat-value">{value ?? '—'}</span>
          {unit && <span className="text-text-muted text-sm mb-0.5">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
