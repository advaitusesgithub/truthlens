import React from 'react'
import { Music, Mic, Bot } from 'lucide-react'

export default function AudioResult({ result, fileName }) {
  const isFake = result.label === 'fake'
  const conf = Math.round(result.confidence * 100)

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
        background: 'var(--c-surface-2)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Music size={15} color="var(--c-ink-2)" />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 14, color: 'var(--c-ink)', letterSpacing: '-0.01em',
        }}>
          Audio Analysis
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--c-ink-3)', marginLeft: 4,
        }}>
          mel-spectrogram · ResNet18
        </span>
      </div>

      <div style={{ padding: 20 }}>
        {/* Voice type badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: isFake ? 'var(--c-fake-bg)' : 'var(--c-real-bg)',
          border: `1px solid ${isFake ? 'var(--c-fake-border)' : 'var(--c-real-border)'}`,
          borderRadius: 12, padding: '14px 18px',
          marginBottom: 20,
        }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 10,
            background: isFake ? '#C0392B18' : '#1A7A4A18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isFake ? (
              <Bot size={22} color="var(--c-fake)" />
            ) : (
              <Mic size={22} color="var(--c-real)" />
            )}
          </div>
          <div>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 18,
              color: isFake ? 'var(--c-fake)' : 'var(--c-real)',
              letterSpacing: '-0.01em',
            }}>
              {isFake ? 'AI Generated Voice' : 'Real Human Voice'}
            </p>
            <p style={{
              margin: '2px 0 0',
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: isFake ? 'var(--c-fake)' : 'var(--c-real)',
              opacity: 0.7,
            }}>
              {conf}% confidence · {result.model}
            </p>
          </div>
        </div>

        {/* Fake waveform visualization */}
        <AudioWaveViz isFake={isFake} confidence={result.confidence} />

        {/* Spectrogram */}
        {result.spectrogram && (
          <div style={{ marginTop: 16 }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--c-ink-3)', letterSpacing: '0.1em',
              margin: '0 0 8px', textTransform: 'uppercase',
            }}>
              MEL SPECTROGRAM
            </p>
            <div style={{
              borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--c-border)',
            }}>
              <img
                src={`data:image/png;base64,${result.spectrogram}`}
                alt="Mel spectrogram"
                style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }}
              />
            </div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--c-ink-3)', marginTop: 6,
            }}>
              Frequency patterns over time — AI voices often show unnatural uniformity
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* Simulated waveform bars */
function AudioWaveViz({ isFake, confidence }) {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const base = Math.sin(i * 0.4) * 0.4 + 0.5
    const noise = Math.random() * 0.3
    return Math.max(0.05, Math.min(1, base + noise))
  })

  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--c-ink-3)', letterSpacing: '0.1em',
        margin: '0 0 8px', textTransform: 'uppercase',
      }}>
        WAVEFORM
      </p>
      <div style={{
        background: 'var(--c-surface-2)',
        border: '1px solid var(--c-border)',
        borderRadius: 10,
        padding: '16px 12px',
        display: 'flex', alignItems: 'center', gap: 2,
        height: 80,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            flex: 1,
            height: `${h * 100}%`,
            borderRadius: 2,
            background: isFake
              ? `rgba(192,57,43,${0.3 + h * 0.5})`
              : `rgba(26,122,74,${0.3 + h * 0.5})`,
            transition: 'height 0.5s cubic-bezier(0.22,1,0.36,1)',
            transitionDelay: `${i * 8}ms`,
          }} />
        ))}
        {/* Scan line */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          width: 1, background: isFake ? 'var(--c-fake)' : 'var(--c-real)',
          opacity: 0.4,
          animation: 'scanSweep 3s ease-in-out infinite',
          left: '50%',
        }} />
      </div>
    </div>
  )
}

