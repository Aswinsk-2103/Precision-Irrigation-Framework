import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout, Brain, Activity, CloudRain, Droplets, Leaf,
  BarChart2, ArrowRight, CheckCircle2, ShieldCheck, Zap,
  Cpu, Database, Sparkles, Compass
} from 'lucide-react'
import { getSensorLatest } from '../services/api'

export default function Welcome() {
  const [liveSensor, setLiveSensor] = useState(null)
  const [apiConnected, setApiConnected] = useState(true)

  useEffect(() => {
    getSensorLatest()
      .then(res => setLiveSensor(res.data))
      .catch(() => setApiConnected(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#07120c] text-text-primary overflow-x-hidden font-sans selection:bg-primary selection:text-white">
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#07120c]/80 backdrop-blur-xl border-b border-primary/10 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-green">
            <Sprout size={22} className="text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-200">
              PrecisionIrrigate
            </span>
            <span className="text-[10px] block text-primary/80 font-medium tracking-wide uppercase">
              AI Smart Agriculture
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#architecture" className="hover:text-primary transition-colors">Architecture</a>
          <a href="#metrics" className="hover:text-primary transition-colors">Live Telemetry</a>
          <Link to="/crops" className="hover:text-primary transition-colors">Crops</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-surface-border/60 hover:bg-surface-border text-sm font-semibold text-text-primary border border-white/10 hover:border-primary/40 transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/dashboard"
            className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl shadow-glow-green hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Launch App <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 px-6 lg:px-16 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Hero Tag Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles size={14} className="text-primary animate-pulse" />
          <span>Next-Generation IoT + Machine Learning Irrigation</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Precision Agriculture Powered by{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">
            Explainable AI
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-text-muted max-w-2xl font-normal leading-relaxed mb-10">
          Combine real-time IoT soil sensors, local weather data, and Random Forest machine learning models to maximize crop yield and conserve water.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            to="/dashboard"
            className="px-8 py-4 rounded-2xl bg-gradient-primary font-bold text-white shadow-glow-green hover:shadow-lg hover:scale-[1.03] transition-all flex items-center gap-3 text-base"
          >
            <Zap size={18} /> Open Live Dashboard
          </Link>
          <Link
            to="/prediction"
            className="px-8 py-4 rounded-2xl bg-surface-border/60 hover:bg-surface-border border border-white/10 font-semibold text-text-primary hover:border-primary/40 transition-all flex items-center gap-3 text-base"
          >
            <Brain size={18} className="text-primary" /> Run AI Predictor
          </Link>
        </div>

        {/* Live Status Telemetry Pill */}
        <div className="w-full max-w-3xl card bg-surface-card/60 backdrop-blur-md border border-primary/20 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-2xl">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${apiConnected ? 'bg-primary animate-ping' : 'bg-red-500'}`} />
            <span className="font-semibold text-text-primary">
              Backend Status: <span className={apiConnected ? 'text-primary' : 'text-red-400'}>{apiConnected ? 'Online (FastAPI)' : 'Connecting...'}</span>
            </span>
          </div>

          {liveSensor && (
            <>
              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <Droplets size={14} className="text-primary" />
                <span className="text-text-muted">Soil Moisture:</span>
                <span className="font-bold text-text-primary">{liveSensor.soil_moisture?.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <Activity size={14} className="text-amber-400" />
                <span className="text-text-muted">Temperature:</span>
                <span className="font-bold text-text-primary">{liveSensor.temperature?.toFixed(1)}°C</span>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <Brain size={14} className="text-accent" />
            <span className="text-text-muted">ML Accuracy:</span>
            <span className="font-bold text-accent">~92% F1-Score</span>
          </div>
        </div>
      </section>

      {/* ── Key Metrics & Impact Section ─────────────────────────────────── */}
      <section id="metrics" className="py-16 bg-surface/40 border-y border-white/5 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-surface-card/40 border border-white/5">
            <p className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">30–40%</p>
            <p className="text-xs text-text-muted">Water Saved per Session</p>
          </div>
          <div className="p-6 rounded-2xl bg-surface-card/40 border border-white/5">
            <p className="text-3xl sm:text-4xl font-extrabold text-accent mb-1">~92%</p>
            <p className="text-xs text-text-muted">Random Forest Model Accuracy</p>
          </div>
          <div className="p-6 rounded-2xl bg-surface-card/40 border border-white/5">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mb-1">7+ Crops</p>
            <p className="text-xs text-text-muted">Configured Threshold Profiles</p>
          </div>
          <div className="p-6 rounded-2xl bg-surface-card/40 border border-white/5">
            <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 mb-1">&lt; 100ms</p>
            <p className="text-xs text-text-muted">Real-Time AI Inference Speed</p>
          </div>
        </div>
      </section>

      {/* ── Architecture Pipeline ─────────────────────────────────────────── */}
      <section id="architecture" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How PrecisionIrrigate Works
          </h2>
          <p className="text-text-muted max-w-xl mx-auto text-sm sm:text-base">
            End-to-end intelligent pipeline connecting hardware telemetry with state-of-the-art machine learning models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'IoT Telemetry',
              desc: 'Soil moisture, temperature, humidity, and rain sensors post data every 10 seconds.',
              icon: Activity,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              step: '02',
              title: 'FastAPI Backend',
              desc: 'Validates readings, fetches weather forecast, and persists telemetry in MongoDB.',
              icon: Database,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
            },
            {
              step: '03',
              title: 'Random Forest AI',
              desc: 'Dual ML models compute irrigation necessity, exact water volume (L), and runtime (min).',
              icon: Cpu,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
            },
            {
              step: '04',
              title: 'Smart Execution',
              desc: 'Automated relay control triggers pump cycles while presenting actionable insights on dashboard.',
              icon: Droplets,
              color: 'text-primary',
              bg: 'bg-primary/10 border-primary/20',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${item.bg} backdrop-blur-md relative hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon size={22} />
                </div>
                <span className="text-2xl font-black text-white/20">{item.step}</span>
              </div>
              <h3 className="font-bold text-lg text-text-primary mb-2">{item.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards Showcase ───────────────────────────────────────── */}
      <section id="features" className="py-20 bg-surface/30 border-t border-white/5 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Comprehensive Smart Agriculture Suite
            </h2>
            <p className="text-text-muted max-w-xl mx-auto text-sm sm:text-base">
              Everything farmers and agricultural engineers need to automate water management efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Real-Time IoT Sensors',
                desc: 'Live streaming telemetry for soil moisture, temperature, humidity, rainfall, and wind speed.',
                icon: Activity,
                link: '/sensors',
                badge: 'Live Telemetry',
              },
              {
                title: 'Random Forest AI Predictor',
                desc: 'Predicts exact irrigation need with explainable feature importance ratings for complete transparency.',
                icon: Brain,
                link: '/prediction',
                badge: 'Dual ML Models',
              },
              {
                title: 'Live Weather Integration',
                desc: 'Integrated OpenWeather API forecasting with automatic rain probability alerts.',
                icon: CloudRain,
                link: '/weather',
                badge: '5-Day Forecast',
              },
              {
                title: 'Automated Pump Control',
                desc: 'Remote valve control with manual toggle overrides and automated threshold protection.',
                icon: Droplets,
                link: '/irrigation',
                badge: 'Relay Control',
              },
              {
                title: 'Crop Specific Profiles',
                desc: 'Tailored optimal moisture ranges and growth stage dynamics for Rice, Wheat, Cotton, and more.',
                icon: Leaf,
                link: '/crops',
                badge: '7+ Crop Types',
              },
              {
                title: 'Water Analytics & Logs',
                desc: 'Historical trend charts, water conservation metrics, and full prediction logs.',
                icon: BarChart2,
                link: '/analytics',
                badge: 'Historical Charts',
              },
            ].map((f, i) => (
              <Link
                key={i}
                to={f.link}
                className="group p-8 rounded-2xl bg-surface-card border border-surface-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-green flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-white transition-all">
                      <f.icon size={24} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-border text-text-secondary">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-6">
                    {f.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  Explore Feature <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer Banner ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-16 max-w-7xl mx-auto text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-b from-surface-card to-surface-border/40 border border-primary/20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 blur-[90px] rounded-full pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Experience Smart Precision Agriculture?
          </h2>
          <p className="text-text-muted max-w-xl mx-auto text-sm sm:text-base mb-8">
            Access the live control dashboard to inspect sensor streams, run ML predictions, and manage irrigation pumps.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-2xl bg-gradient-primary font-bold text-white shadow-glow-green hover:scale-[1.03] transition-transform flex items-center gap-2"
            >
              Enter Application Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-white/5 text-center text-xs text-text-muted">
        <p>🌱 Precision Agriculture Framework — Machine Learning + IoT + FastAPI + React</p>
      </footer>
    </div>
  )
}
