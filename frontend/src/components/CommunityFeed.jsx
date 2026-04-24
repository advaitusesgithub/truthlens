import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Activity, ImageIcon, Film, Music, RefreshCw, BarChart3 } from 'lucide-react'
import { getFeed, getStats } from '../api/client.js'

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

const TYPE_ICONS = { image: ImageIcon, video: Film, audio: Music }
const TYPE_COLORS = { image: '#2563EB', video: '#7C3AED', audio: '#059669' }

function VerdictPill({ verdict }) {
  const cfg = {
    fake: { color: 'var(--c-fake)', bg: 'var(--c-fake-bg)', border: 'var(--c-fake-border)' },
    real: { color: 'var(--c-real)', bg: 'var(--c-real-bg)', border: 'var(--c-real-border)' },
    uncertain: { color: 'var(--c-uncertain)', bg: 'var(--c-uncertain-bg)', border: 'var(--c-uncertain-border)' },
  }[verdict] || {}

  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10,
      fontWeight: 500, letterSpacing: '0.08em',
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: '3px 8px',
      textTransform: 'uppercase',
    }}>
      {verdict}
    </span>
  )
}

export default function CommunityFeed() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const load = useCallback(async () => {
    try {
      const [feedRes, statsRes] = await Promise.all([getFeed(50), getStats()])
      setReports(feedRes.data.reports || [])
      setStats(statsRes.data)
      setLastRefresh(new Date())
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 28, color: 'var(--c-ink)', letterSpacing: '-0.03em',
          }}>
            Community Feed
          </h1>
          <p style={{
            margin: '4px 0 0',
            fontFamily: 'var(--font-body)', fontSize: 14,
            color: 'var(--c-ink-3)',
          }}>
            Anonymous public log of all scan results
          </p>
        </div>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--c-ink-2)',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 8, padding: '8px 14px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Total Scans', value: stats.total_scans, icon: BarChart3, color: 'var(--c-accent)' },
            { label: 'Deepfakes Found', value: stats.fake_count, icon: Activity, color: 'var(--c-fake)' },
            { label: 'Authentic Media', value: stats.real_count, icon: Activity, color: 'var(--c-real)' },
            { label: 'Images', value: stats.by_media_type?.image || 0, icon: ImageIcon, color: TYPE_COLORS.image },
            { label: 'Videos', value: stats.by_media_type?.video || 0, icon: Film, color: TYPE_COLORS.video },
            { label: 'Audio', value: stats.by_media_type?.audio || 0, icon: Music, color: TYPE_COLORS.audio },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} style={{
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                borderRadius: 12, padding: '16px 18px',
                boxShadow: 'var(--shadow-sm)',
                animation: 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--c-ink-3)', letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {card.label}
                  </span>
                  <Icon size={13} color={card.color} />
                </div>
                <p style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 28, color: card.color,
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  {card.value}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Feed */}
      <div style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 80px 80px 120px 80px',
          gap: 12, alignItems: 'center',
          padding: '10px 20px',
          background: 'var(--c-surface-2)',
          borderBottom: '1px solid var(--c-border)',
        }}>
          {['', 'File / Domain', 'Type', 'Verdict', 'Confidence', 'Time'].map((h, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--c-ink-3)', letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {h}
            </span>
          ))}
        </div>

        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                height: 48, borderRadius: 6,
                marginBottom: 8,
                background: 'var(--c-surface-2)',
              }} className="shimmer" />
            ))}
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Activity size={32} color="var(--c-border-strong)" style={{ marginBottom: 12 }} />
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--c-ink-3)', margin: 0,
            }}>
              No scans yet — be the first to analyse something.
            </p>
          </div>
        )}

        {!loading && reports.map((r, i) => {
          const TypeIcon = TYPE_ICONS[r.media_type] || Activity
          const typeColor = TYPE_COLORS[r.media_type] || 'var(--c-ink-3)'
          const pct = Math.round(r.confidence * 100)

          return (
            <div key={r.id} style={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 80px 80px 120px 80px',
              gap: 12, alignItems: 'center',
              padding: '12px 20px',
              borderBottom: i < reports.length - 1 ? '1px solid var(--c-border)' : 'none',
              transition: 'background 0.15s',
              animation: `fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 20}ms both`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Index */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--c-border-strong)',
                textAlign: 'right',
              }}>
                #{i + 1}
              </span>

              {/* Domain */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--c-ink-2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {r.source_domain || 'anonymous'}
              </span>

              {/* Type */}
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: typeColor,
              }}>
                <TypeIcon size={12} />
                {r.media_type}
              </span>

              {/* Verdict */}
              <VerdictPill verdict={r.verdict} />

              {/* Confidence bar + % */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: 'var(--c-surface-2)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    borderRadius: 2,
                    background: r.verdict === 'fake' ? 'var(--c-fake)' : r.verdict === 'real' ? 'var(--c-real)' : 'var(--c-uncertain)',
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--c-ink-3)', minWidth: 28, textAlign: 'right',
                }}>
                  {pct}%
                </span>
              </div>

              {/* Time */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--c-ink-3)',
              }}>
                {timeAgo(r.created_at)}
              </span>
            </div>
          )
        })}

        {/* Last refresh */}
        {lastRefresh && (
          <div style={{
            padding: '8px 20px',
            borderTop: '1px solid var(--c-border)',
            background: 'var(--c-surface-2)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'pulseRing 2s infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-ink-3)' }}>
              Live · auto-refreshes every 30s · last updated {timeAgo(lastRefresh)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

