import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          background: 'var(--c-surface-2)',
          color: 'var(--c-ink)',
          border: '1px solid var(--c-border)',
          borderRadius: '8px',
          padding: '10px 16px',
        },
        success: { iconTheme: { primary: 'var(--c-real)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--c-fake)', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>
)