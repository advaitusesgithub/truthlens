import React from 'react'
import { useState } from 'react'
import { Film, ChevronLeft, ChevronRight } from 'lucide-react'

function frameColor(conf, label) {
  if (label === 'fake' || conf > 0.7) return { border: '#C0392B', bg: '#FEF2F2' }
  if (conf > 0.45) return { border: '#D97706', bg: '#FFFBEB' }
  return { border: '#16A34A', bg: '#F0FDF4' }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1).padStart(4, '0')
  return `${m}:${s}`
}

export default function VideoTimeline({ frames, worstHeatmap, onSelectFrame }) {
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(0)

  if (!frames?.length) return null

  const PER_PAGE = 10
  const totalPages = Math.ceil(frames.length / PER_PAGE)
  const visible = frames.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const handleSelect = (frame) => {
    setSelected(frame.index)
    onSelectFrame?.(frame)
  }

  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 16,
      overflow: 'hidden',
      animation: 'fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--c-border)',
        background: 'var(--c-surface-2)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Film size={15} color="var(--c-ink-2)" />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 14, color: 'var(--c-ink)', letterSpacing: '-0.01em',
        }}>
          Frame Analysis
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--c-ink-3)', marginLeft: 4,
        }}>
          {frames.length} frames · every 10th frame sampled
        </span>

        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {[
            { color: '#C0392B', label: 'Fake' },
            { color: '#D97706', label: 'Uncertain' },
            { color: '#16A34A', label: 'Real' },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-ink-3)' }}>{l.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Frame strip */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 8,
        }}>
          {visible.map((frame) => {
            const { border, bg } = frameColor(frame.confidence, frame.label)
            const isSelected = selected === frame.index
            return (
              <button
                key={frame.index}
                onClick={() => handleSelect(frame)}
                style={{
                  flexShrink: 0,
                  width: 88,
                  background: bg,
                  border: `2px solid ${isSelected ? 'var(--c-accent)' : border}`,
                  borderRadius: 10,
                  padding: '8px 6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                }}
              >
                {/* Heatmap preview */}
                <div style={{
                  width: '100%', aspectRatio: '1',
                  borderRadius: 6, overflow: 'hidden',
                  marginBottom: 6,
                  background: 'var(--c-surface-2)',
                  position: 'relative',
                }} className={frame.heatmap ? 'scanlines' : ''}>
                  {frame.heatmap ? (
                    <img
                      src={`data:image/png;base64,${frame.heatmap}`}
                      alt={`Frame ${frame.index}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: border + '20' }} />
                  )}
                </div>

                {/* Timestamp */}
                <p style={{
                  margin: '0 0 2px',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--c-ink-3)',
                  textAlign: 'center',
                }}>
                  {formatTime(frame.timestamp_sec)}
                </p>

                {/* Confidence bar */}
                <div style={{ height: 3, borderRadius: 2, background: border + '30', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.round(frame.confidence * 100)}%`,
                    background: border, borderRadius: 2,
                  }} />
                </div>

                <p style={{
                  margin: '3px 0 0',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: border, fontWeight: 500,
                  textAlign: 'center',
                }}>
                  {Math.round(frame.confidence * 100)}%
                </p>
              </button>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginTop: 12,
          }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                background: 'none', border: '1px solid var(--c-border)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                opacity: page === 0 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-ink-3)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                background: 'none', border: '1px solid var(--c-border)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                opacity: page >= totalPages - 1 ? 0.4 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Selected frame heatmap */}
        {selected !== null && frames.find(f => f.index === selected)?.heatmap && (
          <div style={{ marginTop: 16, animation: 'fadeIn 0.3s' }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--c-ink-3)', margin: '0 0 8px',
              letterSpacing: '0.06em',
            }}>
              SELECTED FRAME — {formatTime(frames.find(f => f.index === selected)?.timestamp_sec || 0)}
            </p>
            <div style={{
              borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--c-fake-border)',
              maxHeight: 280, display: 'flex',
            }} className="scanlines">
              <img
                src={`data:image/png;base64,${frames.find(f => f.index === selected)?.heatmap}`}
                alt="Selected frame heatmap"
                style={{ width: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

