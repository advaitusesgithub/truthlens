import React from 'react'
import { useEffect, useState } from 'react'

const STEPS = [
  'Preprocessing media…',
  'Running EfficientNet-B4…',
  'Generating GradCAM heatmap…',
  'Aggregating results…',
]

export default function ScanningOverlay({ status, progress, mediaType, fileName }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'uploading' && status !== 'scanning') return
    const t = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, STEPS.length - 1))
      setElapsed(s => s + 1)
    }, 900)
    return () => clearInterval(t)
  }, [status])

  useEffect(() => {
    if (status === 'idle') { setStepIndex(0); setElapsed(0) }
  }, [status])

  if (status !== 'uploading' && status !== 'scanning') return null

  const isUploading = status === 'uploading'

  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 16,
      padding: '48px 40px',
      textAlign: 'center',
      animation: 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)',
      boxShadow: 'var(--shadow-md)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Scan sweep line */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        height: 2,
        background: 'linear-gradient(90deg, transparent, var(--c-accent), transparent)',
        animation: 'scanSweep 1.8s ease-in-out infinite',
        opacity: 0.6,
      }} />

      {/* Radar animation */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'var(--c-surface-2)',
          border: '2px solid var(--c-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Rotating arc */}
          <svg width="80" height="80" style={{ position: 'absolute', animation: 'spin 1.2s linear infinite' }}>
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="36" fill="none" stroke="url(#arcGrad)" strokeWidth="2.5"
              strokeDasharray="60 168" strokeLinecap="round" />
          </svg>
          {/* Center dot */}
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: 'var(--c-accent)',
            boxShadow: '0 0 8px rgba(37,99,235,0.5)',
          }} />
        </div>
        {/* Pulse rings */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80, height: 80,
            borderRadius: '50%',
            border: '1.5px solid var(--c-accent)',
            animation: `pulseRing 2s ease-out ${i * 0.5}s infinite`,
          }} />
        ))}
      </div>

      {/* File name */}
      {fileName && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--c-ink-3)',
          margin: '0 0 8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 320,
          marginInline: 'auto',
        }}>
          {fileName}
        </p>
      )}

      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 22,
        color: 'var(--c-ink)',
        margin: '0 0 6px',
        letterSpacing: '-0.02em',
      }}>
        {isUploading ? 'Uploading…' : 'Analysing media…'}
      </h3>

      {/* Current step */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--c-ink-3)',
        margin: '0 0 24px',
        minHeight: 20,
      }}>
        {isUploading ? `${progress}% uploaded` : STEPS[stepIndex]}
      </p>

      {/* Progress bar */}
      <div style={{
        background: 'var(--c-surface-2)',
        borderRadius: 6,
        height: 6,
        overflow: 'hidden',
        maxWidth: 300,
        margin: '0 auto 16px',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 6,
          background: 'linear-gradient(90deg, var(--c-accent), #60A5FA)',
          width: isUploading ? `${progress}%` : '100%',
          transition: 'width 0.3s',
          animation: !isUploading ? 'shimmer 1.6s infinite' : 'none',
          backgroundSize: isUploading ? 'auto' : '200% 100%',
        }} />
      </div>

      {/* Step dots */}
      {!isUploading && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={i} data-tooltip={s} style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: i <= stepIndex ? 'var(--c-accent)' : 'var(--c-border)',
              transition: 'background 0.3s',
              cursor: 'help',
            }} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

