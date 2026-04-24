import React from 'react'
import { ShieldAlert, ShieldCheck, ShieldQuestion, Clock } from 'lucide-react'

export default function VerdictBadge({ label, confidence, inferenceMs }) {
  const cfg = {
    fake: {
      icon: ShieldAlert,
      headline: 'DEEPFAKE DETECTED',
      sub: 'Manipulation signatures found',
      color: 'var(--c-fake)',
      bg: 'var(--c-fake-bg)',
      border: 'var(--c-fake-border)',
      glow: 'var(--c-fake-glow)',
      bar: '#C0392B',
    },
    real: {
      icon: ShieldCheck,
      headline: 'AUTHENTIC MEDIA',
      sub: 'No manipulation detected',
      color: 'var(--c-real)',
      bg: 'var(--c-real-bg)',
      border: 'var(--c-real-border)',
      glow: 'var(--c-real-glow)',
      bar: '#1A7A4A',
    },
    uncertain: {
      icon: ShieldQuestion,
      headline: 'INCONCLUSIVE',
      sub: 'Low confidence — manual review advised',
      color: 'var(--c-uncertain)',
      bg: 'var(--c-uncertain-bg)',
      border: 'var(--c-uncertain-border)',
      glow: 'rgba(161,98,7,0.08)',
      bar: '#A16207',
    },
  }[label] || cfg?.uncertain

  const Icon = cfg.icon
  const pct = Math.round(confidence * 100)

  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 16,
      padding: '28px 32px',
      boxShadow: `0 0 40px ${cfg.glow}, var(--shadow-md)`,
      animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        {/* Icon */}
        <div style={{
          width: 60, height: 60,
          borderRadius: 14,
          background: `${cfg.color}18`,
          border: `1.5px solid ${cfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={30} color={cfg.color} />
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <p style={{
            margin: '0 0 4px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: cfg.color,
            fontWeight: 500,
          }}>
            VERDICT
          </p>
          <h2 style={{
            margin: '0 0 4px',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 26,
            color: cfg.color,
            letterSpacing: '-0.02em',
          }}>
            {cfg.headline}
          </h2>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: `${cfg.color}CC`,
          }}>
            {cfg.sub}
          </p>
        </div>

        {/* Confidence circle */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 36,
            color: cfg.color,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}>
            {pct}<span style={{ fontSize: 18 }}>%</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: cfg.color,
            opacity: 0.7,
            letterSpacing: '0.08em',
            marginTop: 2,
          }}>
            CONFIDENCE
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 20 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: cfg.color, opacity: 0.7,
          }}>
            Confidence level
          </span>
          {inferenceMs && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: cfg.color, opacity: 0.6,
            }}>
              <Clock size={10} />
              {inferenceMs}ms
            </span>
          )}
        </div>
        <div style={{
          height: 6, borderRadius: 3,
          background: `${cfg.color}18`,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: cfg.bar,
            borderRadius: 3,
            transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      </div>
    </div>
  )
}

