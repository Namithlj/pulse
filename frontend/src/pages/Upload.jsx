import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = import.meta.env.VITE_API_URL || 'https://pulse-qj2r.vercel.app'

export default function Upload() {
  const [video, setVideo] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processProgress, setProcessProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect()
    }
  }, [socket])

  const handleUpload = async () => {
    if (!video) return
    const token = localStorage.getItem('token')
    const form = new FormData()
    form.append('video', video)
    try {
      setStatus('uploading')
      const res = await axios.post(`${API}/api/videos/upload`, form, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(pct)
        }
      })
      const vid = res.data.video
      setStatus(vid.status)

      // connect socket and join room for realtime processing
      const s = io(API)
      setSocket(s)
      s.emit('join', String(vid._id))
      s.on('processing', (payload) => {
        if (payload.id === vid._id) {
          setProcessProgress(payload.progress || 0)
          setStatus(payload.status)
        }
      })

    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || 'Upload error')
      setStatus('error')
    }
  }

  return (
    <div className="fade-in" style={styles.container}>
      <h2>Upload Video</h2>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideo(e.target.files[0])}
      />

      <button onClick={handleUpload} disabled={!video || status === 'uploading'}>
        Upload
      </button>

      {uploadProgress > 0 && (
        <div style={styles.progressBox}>
          <p>Uploading: {uploadProgress}%</p>
          <div style={styles.bar}>
            <div style={{ ...styles.fill, width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {status !== 'idle' && (
        <div style={{ marginTop: 16 }}>
          <p>Processing status: {status}</p>
          <p>Progress: {processProgress}%</p>
          <div style={styles.bar}>
            <div style={{ ...styles.fill, width: `${processProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  progressBox: {
    marginTop: '20px',
  },
  bar: {
    height: '8px',
    background: '#1e293b',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: '#38bdf8',
    transition: 'width 0.3s',
  },
}
