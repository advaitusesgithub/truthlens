import React, { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import HeroSection from './components/HeroSection.jsx'
import UploadZone from './components/UploadZone.jsx'
import ScanningOverlay from './components/ScanningOverlay.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import CommunityFeed from './components/CommunityFeed.jsx'
import { useDetect } from './hooks/useDetect.js'

export default function App() {
  const [view, setView] = useState('home')
  const { status, progress, result, mediaType, file, error, scan, reset } = useDetect()

  const showHero = view === 'home' && status === 'idle'
  const showUpload = view === 'home' && (status === 'idle' || status === 'error')
  const showScanning = view === 'home' && (status === 'uploading' || status === 'scanning')
  const showResult = view === 'home' && status === 'done'

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)' }}>
      <Navbar view={view} setView={(v) => { setView(v); if (v === 'home' && status === 'done') reset() }} />

      <main style={{
        flex: 1,
        maxWidth: 860,
        width: '100%',
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        {view === 'home' && (
          <>
            {showHero && <HeroSection />}

            {showUpload && (
              <div style={{ paddingTop: showHero ? 0 : 40 }}>
                <UploadZone onScan={scan} disabled={status !== 'idle'} />
                {error && (
                  <div style={{
                    marginTop: 16, padding: '12px 16px',
                    background: 'var(--c-fake-bg)',
                    border: '1px solid var(--c-fake-border)',
                    borderRadius: 10,
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    color: 'var(--c-fake)',
                  }}>
                    ⚠ {error}
                  </div>
                )}
              </div>
            )}

            {showScanning && (
              <div style={{ paddingTop: 40 }}>
                <ScanningOverlay status={status} progress={progress} mediaType={mediaType} fileName={file?.name} />
              </div>
            )}

            {showResult && (
              <div style={{ paddingTop: 40 }}>
                <ResultPanel result={result} mediaType={mediaType} file={file} onReset={reset} />
              </div>
            )}
          </>
        )}

        {view === 'feed' && (
          <div style={{ paddingTop: 40 }}>
            <CommunityFeed />
          </div>
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--c-border)',
        padding: '16px 24px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24,
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-ink-3)' }}>
          TruthLens · Rockverse Hackathon 2026
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-border-strong)' }}>·</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-ink-3)' }}>
          EfficientNet-B4 · GradCAM · FastAPI
        </span>
      </footer>
    </div>
  )
}