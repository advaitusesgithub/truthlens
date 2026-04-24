import React from 'react'
import { Shield, Activity } from 'lucide-react'

export default function Navbar({ view, setView }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(13,13,15,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--c-border)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button
          onClick={() => setView('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0,
          }}
        >
          <div style={{
            width: 32, height: 32,
            background: 'var(--c-surface-2)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="white" fill="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            color: 'var(--c-ink)',
            letterSpacing: '-0.02em',
          }}>
            TruthLens
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--c-ink-3)',
            background: 'var(--c-surface-2)',
            border: '1px solid var(--c-border)',
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.08em',
          }}>
            v1.0
          </span>
        </button>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { id: 'home', label: 'Detect' },
            { id: 'feed', label: 'Community Feed' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: 14,
                color: view === item.id ? 'var(--c-ink)' : 'var(--c-ink-3)',
                background: view === item.id ? 'var(--c-surface)' : 'transparent',
                border: view === item.id ? '1px solid var(--c-border)' : '1px solid transparent',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {item.id === 'feed' && (
                <Activity size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              )}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}