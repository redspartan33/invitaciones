import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.tsx'
import './index.css'

// Dev: '' → relative, served by Vite proxy. Prod: absolute backend URL.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
