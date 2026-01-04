import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function ProtectedRoute({ adminOnly }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user))
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch (err) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [])

  if (loading) return null

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (!token) return <Navigate to="/" />

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/upload" />
  }

  return <Outlet />
}
