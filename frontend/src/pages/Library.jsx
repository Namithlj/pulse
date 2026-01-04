import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = import.meta.env.VITE_API_URL || 'https://pulse-qj2r.vercel.app'

export default function Library() {
  const [filter, setFilter] = useState('')
  const [videos, setVideos] = useState([])
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API}/api/videos`, { headers: { Authorization: `Bearer ${token}` } })
      setVideos(res.data.videos)

      // subscribe to processing updates for fetched videos
      const s = io(API)
      res.data.videos.forEach(v => s.emit('join', String(v._id)))
      s.on('processing', (p) => {
        setVideos((prev) => prev.map(v => v._id === p.id ? { ...v, status: p.status } : v))
      })
    } catch (err) {
      console.error(err)
      alert('Could not load videos')
    }
  }

  return (
    <div className="fade-in" style={{ padding: '40px' }}>
      <h2>Video Library</h2>

      <input
        placeholder="Search video..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ margin: '16px 0' }}
      />

      <div style={{ display: 'grid', gap: 12 }}>
        {videos.filter(v => v.originalName.toLowerCase().includes(filter.toLowerCase())).map(v => (
          <div key={v._id} style={{ padding: 12, border: '1px solid #233', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{v.originalName}</strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{v.status}</div>
              </div>
              <div>
                {v.status === 'safe' && <button onClick={() => setPlaying(v._id)}>Play</button>}
                {v.status === 'flagged' && <span style={{ color: 'crimson' }}>Flagged</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {playing && (
        <div style={{ marginTop: 20 }}>
          <h3>Player</h3>
          <video
            controls
            style={{ width: '100%', maxWidth: 800 }}
            src={`${API}/api/videos/${playing}/stream?token=${localStorage.getItem('token')}`}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setPlaying(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
