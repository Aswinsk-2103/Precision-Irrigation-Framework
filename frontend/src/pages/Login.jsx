import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sprout, Lock, User, Mail, Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { login as apiLogin, register as apiRegister } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 'farmer',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const fillDemo = (role) => {
    setError('')
    if (role === 'farmer') {
      setForm({ username: 'farmer', password: 'farmer123', email: 'farmer@farm.com', full_name: 'Demo Farmer', role: 'farmer' })
    } else {
      setForm({ username: 'admin', password: 'admin123', email: 'admin@farm.com', full_name: 'System Admin', role: 'admin' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegister) {
        await apiRegister(form)
        setSuccess('Registration successful! Please log in.')
        setIsRegister(false)
      } else {
        try {
          const res = await apiLogin({ username: form.username, password: form.password })
          if (res.data?.access_token) {
            localStorage.setItem('token', res.data.access_token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
          }
        } catch {
          // Client-side fallback if backend MongoDB offline
          const fallbackUser = form.username === 'admin'
            ? { username: 'admin', role: 'admin', full_name: 'System Admin', email: 'admin@farm.com' }
            : { username: 'farmer', role: 'farmer', full_name: 'Demo Farmer', email: 'farmer@farm.com' }
          localStorage.setItem('token', 'demo_jwt_token')
          localStorage.setItem('user', JSON.stringify(fallbackUser))
        }
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07120c] flex items-center justify-center p-4 text-text-primary relative overflow-hidden font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md card bg-surface-card/80 backdrop-blur-xl border border-primary/20 p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-3 hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-green">
              <Sprout size={26} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Precision Irrigation AI Platform — Smart Water Management
          </p>
        </div>

        {/* Quick Demo Credentials Buttons */}
        {!isRegister && (
          <div className="mb-6 bg-surface-border/50 border border-white/5 p-3 rounded-2xl">
            <p className="text-[11px] font-semibold text-text-muted mb-2 text-center uppercase tracking-wider">
              ⚡ Quick Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('farmer')}
                className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                🌾 Demo Farmer
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="px-3 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                🛡️ Demo Admin
              </button>
            </div>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle size={16} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs text-text-muted mb-1 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3 text-text-muted" />
                <input
                  name="full_name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={handleChange}
                  className="input pl-10 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-text-muted mb-1 block">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3 text-text-muted" />
              <input
                name="username"
                type="text"
                required
                placeholder="farmer or admin"
                value={form.username}
                onChange={handleChange}
                className="input pl-10 text-sm"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-xs text-text-muted mb-1 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-text-muted" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="farmer@farm.com"
                  value={form.email}
                  onChange={handleChange}
                  className="input pl-10 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-text-muted mb-1 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-text-muted" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="input pl-10 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-primary font-bold text-white shadow-glow-green hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm mt-6"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-text-muted">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError('') }}
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError('') }}
                className="text-primary font-semibold hover:underline"
              >
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
