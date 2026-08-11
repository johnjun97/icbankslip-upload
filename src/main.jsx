import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import App from './App.jsx'
import Monitor from './monitor/Monitor.jsx'
import MonitorLogin from './monitor/MonitorLogin.jsx'


createRoot(document.getElementById('root')).render(

  <StrictMode>

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<App />} />

        <Route path="/monitor" element={<Monitor />} />

        <Route path="/monitor-login" element={<MonitorLogin />} />

      </Routes>

    </BrowserRouter>

  </StrictMode>

)