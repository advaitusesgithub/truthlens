import React from 'react'
import { useState } from 'react'
import { Eye, Layers, Info } from 'lucide-react'

export default function HeatmapViewer({ originalFile, heatmapBase64, label }) {
  const [blend, setBlend] = useState(60)
  const [mode, setMode] = useState('side') // 'side' | 'overlay'

  const originalUrl = originalFile ? URL.createObjectURL(originalFile) : null
  const heatmapUrl = heatmapBase64 ? `data:image/png;base64,${heatmapBase64}` : null

  if (!heatmapUrl) return null

  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 16,
      overflow: 'hidden',
      animation: 'fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--c-surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={15} color="var(--c-ink-2)" />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: 14,
            color: 'var(--c-ink)',
            letterSpacing: '-0.01em',
          }}>
            GradCAM Heatmap
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--c-ink-3)',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            padding: '2px 8px', borderRadius: 20,
          }}>
            <Info size={9} />
            Highlights manipulated regions
          </span>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: 2,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 8,
          padding: 2,
        }}>
          {[
            { id: 'side', label: 'Side-by-side' },
            { id: 'overlay', label: 'Overlay' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: mode === m.id ? 'var(--c-ink)' : 'var(--c-ink-3)',
              background: mode === m.id ? 'var(--c-surface-2)' : 'transparent',
              border: 'none', borderRadius: 6,
              padding: '5px 10px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div style={{ padding: 20 }}>
        {mode === 'side' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            {/* Original */}
            <div>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--c-ink-3)', letterSpacing: '0.1em',
                margin: '0 0 8px', textTransform: 'uppercase',
              }}>
                ORIGINAL
              </p>
              <div style={{
                borderRadius: 10, overflow: 'hidden',
                background: 'var(--c-surface-2)',
                border: '1px solid var(--c-border)',
                aspectRatio: '1/1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {originalUrl
                  ? <img src={originalUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--c-surface-2)' }} />
                  : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-ink-3)' }}>Original</span>
                }
              </div>
            </div>

            {/* Heatmap */}
            <div>
              <p style={{
               fontFamily: 'var(--font-mono)', fontSize: 10,
               color: label === 'fake' ? 'var(--c-fake)' : label === 'real' ? 'var(--c-real)' : 'var(--c-uncertain)',
               letterSpacing: '0.1em',
               margin: '0 0 8px', textTransform: 'uppercase',
              }}>
              HEATMAP OVERLAY
              </p>
              <div style={{
                borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${label === 'fake' ? 'var(--c-fake-border)' : label === 'real' ? 'var(--c-real-border)' : 'var(--c-border)'}`,
                aspectRatio: '1/1',
                position: 'relative',
              }} className="scanlines">
                <img
                  src={heatmapUrl}
                  alt="GradCAM heatmap"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
                />
                {label === 'fake' && (
                <div style={{
                 position: 'absolute', bottom: 8, left: 8,
                 background: 'rgba(192,57,43,0.85)',
                 color: 'white',
                 fontFamily: 'var(--font-mono)', fontSize: 10,
                 padding: '3px 8px', borderRadius: 4,
                 backdropFilter: 'blur(4px)',
              }}>
              Manipulated region
              </div>
             )}
              {label === 'real' && (
               <div style={{
               position: 'absolute', bottom: 8, left: 8,
               background: 'rgba(26,122,74,0.85)',
               color: 'white',
               fontFamily: 'var(--font-mono)', fontSize: 10,
               padding: '3px 8px', borderRadius: 4,
               backdropFilter: 'blur(4px)',
             }}>
                No manipulation detected
              </div>
              )}
              </div>
            </div>
          </div>
        ) : (
          /* Overlay mode */
          <div>
            <div style={{
              borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--c-border)',
              aspectRatio: '16/9',
              position: 'relative',
              maxHeight: 400,
            }} className="scanlines">
              {originalUrl && (
                <img src={originalUrl} alt="Original" style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'contain',
                }} />
              )}
              <img src={heatmapUrl} alt="Heatmap" style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'contain',
                opacity: blend / 100,
                transition: 'opacity 0.1s',
              }} />
            </div>

            {/* Blend slider */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Layers size={14} color="var(--c-ink-3)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-ink-3)', width: 70 }}>
                Blend: {blend}%
              </span>
              <input
                type="range" min={0} max={100} value={blend}
                onChange={e => setBlend(Number(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: 'var(--c-accent)',
                  height: 4, cursor: 'pointer',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-ink-3)', width: 50, textAlign: 'right' }}>
                {blend === 0 ? 'ORIGINAL' : blend === 100 ? 'HEATMAP' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

