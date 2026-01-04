import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'https://pulse-qj2r.vercel.app'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('editor')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) return alert('Fill all fields')
    try {
      if (isLogin) {
        const res = await axios.post(`${API}/api/auth/login`, { email, password })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        // redirect based on role
        if (res.data.user?.role === 'admin') navigate('/admin')
        else navigate('/upload')
      } else {
        const res = await axios.post(`${API}/api/auth/register`, { name, email, password, role })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        if (res.data.user?.role === 'admin') navigate('/admin')
        else navigate('/upload')
      }
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || 'Auth error')
    }
  }

  return (
    <div className="fade-in" style={styles.container}>
      <div style={styles.card}>
        <h2>{isLogin ? 'Login' : 'Register'}</h2>

        {!isLogin && (
          <>
            <input
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13 }}>Role:</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </>
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleSubmit}>
          {isLogin ? 'Login' : 'Register'}
        </button>

        <p onClick={() => setIsLogin(!isLogin)} style={styles.toggle}>
          {isLogin ? 'Create account' : 'Already have an account?'}
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '90vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    background: '#020617',
    padding: '32px',
    borderRadius: '12px',
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  toggle: {
    color: '#38bdf8',
    cursor: 'pointer',
    textAlign: 'center',
  },
}
