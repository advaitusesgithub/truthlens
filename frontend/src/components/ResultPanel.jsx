import React from 'react'
import { RotateCcw, Download } from 'lucide-react'
import VerdictBadge from './VerdictBadge.jsx'
import HeatmapViewer from './HeatmapViewer.jsx'
import VideoTimeline from './VideoTimeline.jsx'
import AudioResult from './AudioResult.jsx'

export default function ResultPanel({ result, mediaType, file, onReset }) {
  if (!result) return null

  const handleDownloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      file: file?.name,
      media_type: mediaType,
      ...result,
      // Don't include massive base64 blobs in the JSON download
      heatmap_base64: result.heatmap_base64 ? '[base64 image omitted]' : undefined,
      worst_frame_heatmap: result.worst_frame_heatmap ? '[base64 image omitted]' : undefined,
      frames: result.frames?.map(f => ({ ...f, heatmap: f.heatmap ? '[omitted]' : undefined })),
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `truthlens-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ animation: 'fadeUp 0.45s cubic-bezier(0.22,1,0.36,1)' }}>
      {/* Action bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <h2 style={{
          margin: 0,
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 20, color: 'var(--c-ink)', letterSpacing: '-0.02em',
        }}>
          Analysis Complete
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDownloadReport}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: 'var(--c-ink-2)',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 8, padding: '8px 14px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-border-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
          >
            <Download size={13} />
            Export JSON
          </button>
          <button
            onClick={onReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: 'var(--c-ink)',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 8, padding: '8px 14px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-border-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
          >
            <RotateCcw size={13} />
            Scan Another
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Verdict */}
        <VerdictBadge
          label={result.label}
          confidence={result.confidence}
          inferenceMs={result.inference_ms}
        />

        {/* Image heatmap */}
        {mediaType === 'image' && result.heatmap_base64 && (
          <HeatmapViewer
            originalFile={file}
            heatmapBase64={result.heatmap_base64}
             label={result.label}
          />
        )}

        {/* Video timeline */}
        {mediaType === 'video' && result.frames && (
          <VideoTimeline
            frames={result.frames}
            worstHeatmap={result.worst_frame_heatmap}
          />
        )}

        {/* Audio */}
        {mediaType === 'audio' && (
          <AudioResult result={result} fileName={file?.name} />
        )}
      </div>
    </div>
  )
}

