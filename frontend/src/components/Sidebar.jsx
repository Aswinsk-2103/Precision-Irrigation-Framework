import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Activity, Brain, Cloud, Droplets,
  Leaf, BarChart2, History, Settings, Menu, X, Sprout, Home,
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/',           label: 'Welcome',      icon: Home },
  { to: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/sensors',    label: 'Live Sensors', icon: Activity },
  { to: '/prediction', label: 'ML Prediction',icon: Brain },
  { to: '/weather',    label: 'Weather',      icon: Cloud },
  { to: '/irrigation', label: 'Irrigation',   icon: Droplets },
  { to: '/crops',      label: 'Crops',        icon: Leaf },
  { to: '/analytics',  label: 'Analytics',    icon: BarChart2 },
  { to: '/history',    label: 'History',      icon: History },
  { to: '/settings',   label: 'Settings',     icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 bg-surface transition-all duration-300
        border-r border-surface-border ${collapsed ? 'w-16' : 'w-60'}`}
      style={{ background: 'linear-gradient(180deg,#0f2318 0%,#0a1628 100%)' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-4 py-5 border-b border-surface-border hover:bg-white/5 transition-colors">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-green">
          <Sprout size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">PrecisionIrrigate</p>
            <p className="text-[10px] text-text-muted truncate">AI Smart Irrigation</p>
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCollapsed(c => !c) }}
          className="ml-auto text-text-muted hover:text-primary transition-colors"
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
              ${isActive
                ? 'bg-primary/20 text-primary shadow-glow-green border border-primary/30'
                : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-surface-border animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
              F
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">Demo Farmer</p>
              <p className="text-[10px] text-text-muted truncate">farmer@farm.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
