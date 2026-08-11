import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import App from './App.jsx'
import Monitor from './Monitor/Monitor.jsx'
import MonitorLogin from './Monitor/MonitorLogin.jsx'


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