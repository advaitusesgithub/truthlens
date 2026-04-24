import React from 'react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, ImageIcon, Film, Music, ChevronRight, AlertCircle } from 'lucide-react'

const ACCEPTED = {
  'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  'audio/*': ['.wav', '.mp3', '.flac', '.ogg', '.m4a'],
}

const TYPE_META = {
  image: { icon: ImageIcon, label: 'Image', color: '#2563EB', bg: '#EFF6FF' },
  video: { icon: Film, label: 'Video', color: '#7C3AED', bg: '#F5F3FF' },
  audio: { icon: Music, label: 'Audio', color: '#059669', bg: '#ECFDF5' },
}

function getType(file) {
  if (!file) return null
  if (file.type.startsWith('image')) return 'image'
  if (file.type.startsWith('video')) return 'video'
  if (file.type.startsWith('audio')) return 'audio'
  return null
}

function formatBytes(b) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function UploadZone({ onScan, disabled }) {
  const [file, setFile] = useState(null)
  const [rejected, setRejected] = useState(false)

  const onDrop = useCallback((accepted, rej) => {
    if (rej.length > 0) { setRejected(true); setFile(null); return }
    setRejected(false)
    setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    disabled,
  })

  const type = getType(file)
  const TypeMeta = type ? TYPE_META[type] : null
  const TypeIcon = TypeMeta?.icon

  const handleScan = () => {
    if (file) onScan(file)
  }

  const borderColor = isDragReject || rejected
    ? 'var(--c-fake)'
    : isDragActive
    ? 'var(--c-accent)'
    : file
    ? 'var(--c-border-strong)'
    : 'var(--c-border)'

  const bgColor = isDragReject || rejected
    ? 'var(--c-fake-bg)'
    : isDragActive
    ? 'var(--c-accent-light)'
    : 'var(--c-surface)'

  return (
    <div style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both', animationDelay: '0.1s' }}>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 16,
          background: bgColor,
          padding: '56px 40px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input {...getInputProps()} />

        {/* Drag active flash */}
        {isDragActive && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(37,99,235,0.04)',
            borderRadius: 14,
            animation: 'fadeIn 0.15s',
          }} />
        )}

        {/* Upload icon */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          width: 64, height: 64,
          background: isDragActive ? 'var(--c-accent)' : 'var(--c-surface-2)',
          borderRadius: 16,
          marginBottom: 20,
          transition: 'all 0.2s',
          border: '1px solid var(--c-border)',
          position: 'relative',
        }}>
          <Upload size={28} color={isDragActive ? 'white' : 'var(--c-ink-2)'} />
          {/* Pulse rings when active */}
          {isDragActive && [1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: '100%', height: '100%',
              borderRadius: 16,
              border: '2px solid var(--c-accent)',
              animation: `pulseRing 1s ease-out ${i * 0.3}s infinite`,
              opacity: 0,
            }} />
          ))}
        </div>

        {/* Text */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 20,
          color: 'var(--c-ink)',
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}>
          {isDragActive ? 'Release to analyse' : 'Drop media here'}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--c-ink-3)',
          margin: '0 0 24px',
        }}>
          or click to browse files
        </p>

        {/* Type chips */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_META).map(([key, meta]) => {
            const Icon = meta.icon
            return (
              <span key={key} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: meta.color,
                background: meta.bg,
                border: `1px solid ${meta.color}22`,
                borderRadius: 20,
                padding: '4px 10px',
                letterSpacing: '0.04em',
              }}>
                <Icon size={11} />
                {key.toUpperCase()}
              </span>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {rejected && (
        <div style={{
          marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--c-fake)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          animation: 'fadeIn 0.2s',
        }}>
          <AlertCircle size={14} />
          Unsupported file type. Please use JPG, PNG, MP4, MOV, WAV, or MP3.
        </div>
      )}

      {/* Selected file card */}
      {file && !rejected && (
        <div style={{
          marginTop: 16,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            width: 40, height: 40,
            background: TypeMeta?.bg,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {TypeIcon && <TypeIcon size={18} color={TypeMeta?.color} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--c-ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{file.name}</p>
            <p style={{
              margin: '2px 0 0',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--c-ink-3)',
            }}>
              {TypeMeta?.label} · {formatBytes(file.size)}
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.01em',
              color: 'var(--c-bg)',
              background: 'var(--c-ink)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              flexShrink: 0,
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!disabled) e.target.style.background = '#B0ADA8' }}
            onMouseLeave={e => { e.target.style.background = 'var(--c-ink)' }}
          >
            Scan Now
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

