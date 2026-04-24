import { useState, useCallback } from 'react'
import { detectImage, detectVideo, detectAudio } from '../api/client.js'
import toast from 'react-hot-toast'

export function useDetect() {
  const [state, setState] = useState({
    status: 'idle',      // 'idle' | 'uploading' | 'scanning' | 'done' | 'error'
    progress: 0,
    result: null,
    mediaType: null,
    file: null,
    error: null,
  })

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, result: null, mediaType: null, file: null, error: null })
  }, [])

  const scan = useCallback(async (file) => {
    const name = file.name.toLowerCase()
    let mediaType

    if (/\.(jpg|jpeg|png|webp|bmp|tiff?)$/i.test(name)) mediaType = 'image'
    else if (/\.(mp4|mov|avi|mkv|webm)$/i.test(name)) mediaType = 'video'
    else if (/\.(wav|mp3|flac|ogg|m4a|aac)$/i.test(name)) mediaType = 'audio'
    else {
      toast.error('Unsupported file type')
      return
    }

    setState({ status: 'uploading', progress: 0, result: null, mediaType, file, error: null })

    const onProgress = (pct) => setState(s => ({ ...s, progress: pct }))

    try {
      const detect = mediaType === 'image' ? detectImage : mediaType === 'video' ? detectVideo : detectAudio
      setState(s => ({ ...s, status: 'uploading', progress: 0 }))
      const { data } = await detect(file, null, onProgress)
      setState(s => ({ ...s, status: 'scanning', progress: 100 }))

      // Short artificial pause for the scan animation to feel real
      await new Promise(r => setTimeout(r, 1200))

      setState(s => ({ ...s, status: 'done', result: data }))
      toast.success(`Analysis complete — ${data.label.toUpperCase()}`)
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Unknown error'
      setState(s => ({ ...s, status: 'error', error: msg }))
      toast.error(`Scan failed: ${msg}`)
    }
  }, [])

  return { ...state, scan, reset }
}
