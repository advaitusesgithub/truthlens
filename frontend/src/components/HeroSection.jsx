import React from 'react'
import { Cpu, Zap, Eye } from 'lucide-react'

const FEATURES = [
  { icon: Cpu, text: 'EfficientNet-B4 · GradCAM' },
  { icon: Eye, text: 'Image · Video · Audio' },
  { icon: Zap, text: 'Real-time · < 10s' },
]

export default function HeroSection() {
  return (
    <div style={{
      textAlign: 'center',
      paddingTop: 48, paddingBottom: 40,
      animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* Eyebrow label */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 20,
        padding: '5px 14px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11, letterSpacing: '0.1em',
          color: 'var(--c-ink-3)',
        }}>
          ROCKVERSE HACKATHON 2026
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        margin: '0 0 12px',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 'clamp(36px, 6vw, 58px)',
        color: 'var(--c-ink)',
        letterSpacing: '-0.035em',
        lineHeight: 1.08,
      }}>
        Detect deepfakes
        <br />
        <span style={{
          background: 'linear-gradient(135deg, #1A1714 0%, #4A4540 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          with one upload.
        </span>
      </h1>

      {/* Sub */}
      <p style={{
        margin: '0 auto 28px',
        fontFamily: 'var(--font-body)',
        fontWeight: 300,
        fontSize: 17,
        color: 'var(--c-ink-3)',
        maxWidth: 480,
        lineHeight: 1.6,
      }}>
        AI-powered deepfake detection for images, video, and audio — with
        explainability via GradCAM heatmaps.
      </p>

      {/* Feature chips */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 20,
            padding: '6px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Icon size={13} color="var(--c-ink-3)" />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12, color: 'var(--c-ink-2)',
            }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

