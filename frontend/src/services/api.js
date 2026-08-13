import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Sensor ──────────────────────────────────────────────────────────
export const getSensorLatest = (farmId = 'default') =>
  api.get(`/sensor-data/latest?farm_id=${farmId}`)

export const getSensorHistory = (limit = 50, farmId = 'default') =>
  api.get(`/sensor-data?limit=${limit}&farm_id=${farmId}`)

export const postSensorData = (data) => api.post('/sensor-data', data)

// ── Prediction ──────────────────────────────────────────────────────
export const runPrediction = (data) => api.post('/predict', data)
export const getPredictionHistory = (limit = 20) =>
  api.get(`/predictions/history?limit=${limit}`)

// ── Weather ─────────────────────────────────────────────────────────
export const getWeather = (city) =>
  api.get(`/weather${city ? `?city=${city}` : ''}`)

// ── Irrigation ──────────────────────────────────────────────────────
export const getIrrigationStatus = (farmId = 'default') =>
  api.get(`/irrigation-status?farm_id=${farmId}`)

export const controlIrrigation = (action, opts = {}) =>
  api.post('/irrigation/control', { action, ...opts })

export const getIrrigationHistory = (limit = 50) =>
  api.get(`/irrigation-history?limit=${limit}`)

// ── Analytics ───────────────────────────────────────────────────────
export const getAnalytics = (days = 7) =>
  api.get(`/analytics?days=${days}`)

// ── Crops ───────────────────────────────────────────────────────────
export const getCrops = () => api.get('/crops')
export const getCrop  = (name) => api.get(`/crops/${name}`)
export const createCrop = (data) => api.post('/crops', data)

// ── Auth ────────────────────────────────────────────────────────────
export const login    = (creds) => api.post('/auth/login', creds)
export const register = (data)  => api.post('/auth/register', data)

export default api
