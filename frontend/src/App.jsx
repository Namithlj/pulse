import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Auth from './pages/Auth'
import Upload from './pages/Upload'
import Library from './pages/Library'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Auth />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/upload" element={<Upload />} />
          <Route path="/library" element={<Library />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
