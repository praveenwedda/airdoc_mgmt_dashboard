import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

// Cache the root on the container so HMR module re-evaluation
// reuses the existing root instead of mounting a second React tree
// onto the same DOM node (which manifests as duplicated content and
// broken in-place navigation until a hard refresh).
const container = document.getElementById('root')
const root =
  container.__appRoot ||
  (container.__appRoot = ReactDOM.createRoot(container))

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
