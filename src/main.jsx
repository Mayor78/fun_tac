// src/main.jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Temporarily remove StrictMode to fix double mounting
createRoot(document.getElementById('root')).render(
  <App />
)