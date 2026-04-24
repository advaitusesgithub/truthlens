import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 90_000, // 90s for large video files
})

export default client

// ── Detection helpers ─────────────────────────────────────────────

export function detectImage(file, sourceDomain = null, onProgress) {
  const form = new FormData()
  form.append('file', file)
  if (sourceDomain) form.append('source_domain', sourceDomain)
  return client.post('/detect/image', form, {
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  })
}

export function detectVideo(file, sourceDomain = null, onProgress) {
  const form = new FormData()
  form.append('file', file)
  if (sourceDomain) form.append('source_domain', sourceDomain)
  return client.post('/detect/video', form, {
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  })
}

export function detectAudio(file, sourceDomain = null, onProgress) {
  const form = new FormData()
  form.append('file', file)
  if (sourceDomain) form.append('source_domain', sourceDomain)
  return client.post('/detect/audio', form, {
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  })
}

export function getFeed(limit = 50) {
  return client.get(`/reports/feed?limit=${limit}`)
}

export function getStats() {
  return client.get('/reports/stats')
}

export function submitReport(data) {
  return client.post('/report/submit', data)
}
