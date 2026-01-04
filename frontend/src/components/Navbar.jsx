import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'https://pulse-qj2r.vercel.app'

export default function Navbar() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    // validate token and refresh user
    setLoading(true)
    axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user))
          setUser(res.data.user)
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const doLogout = () => {
    localStorage.clear()
    setUser(null)
    navigate('/')
  }

  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>Pulse</h2>
      <div style={styles.links} className="nav-links">
        {localStorage.getItem('token') ? (
          <>
            <Link to="/upload">Upload</Link>
            <Link to="/library">Library</Link>
            {!loading && user?.role === 'admin' && <Link to="/admin">Admin</Link>}
            <button className="btn" onClick={doLogout}>Logout</button>
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 32px',
    background: 'rgba(15,23,42,0.8)',
    backdropFilter: 'blur(10px)',
  },
  logo: { color: '#38bdf8' },
  links: {
    display: 'flex',
    gap: '20px',
  },
}
