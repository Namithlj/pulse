import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || 'https://pulse-qj2r.vercel.app'

export default function AdminPage() {
  const [videos, setVideos] = useState([])
  const [playing, setPlaying] = useState(null)
  const [tab, setTab] = useState('videos')
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (tab === 'videos') fetchVideos()
    if (tab === 'users') fetchUsers()
  }, [tab])

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API}/api/videos`, { headers: { Authorization: `Bearer ${token}` } })
      setVideos(res.data.videos)
    } catch (err) {
      console.error(err)
      alert('Could not load videos')
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      setUsers(res.data)
    } catch (err) {
      console.error(err)
      alert('Could not load users')
    }
  }

  const changeRole = async (id, role) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${API}/api/auth/users/${id}/role`, { role }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Role updated')
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert('Could not update role')
    }
  }

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button className="btn" onClick={() => setTab('videos')}>Videos</button>
        <button className="btn" onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'videos' && (
        <>
          <h1 style={{ marginBottom: 16 }}>Admin — Videos</h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {videos.map(v => (
          <div key={v._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{v.originalName}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{v.mimeType} • {(v.size/1024|0)} KB</div>
              </div>
              <div>
                <span className={`badge ${v.status}`}>{v.status}</span>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: '#cbd5e1' }}>
              <div><strong>Owner:</strong> {v.owner?.name || '—'} ({v.owner?.email || '—'})</div>
              <div><strong>Uploaded:</strong> {new Date(v.createdAt).toLocaleString()}</div>
              {v.analysis?.reason && <div><strong>Analysis:</strong> {v.analysis.reason}</div>}
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setPlaying(v._id)}>Play</button>
              <a className="btn subtle" href={`${API}/uploads/${v.filename}`} target="_blank" rel="noreferrer">Download</a>
            </div>
          </div>
            ))}
          </div>

          {playing && (
            <div style={{ marginTop: 20 }}>
              <h3>Player</h3>
              <video
                controls
                style={{ width: '100%', maxWidth: 900 }}
                src={`${API}/api/videos/${playing}/stream?token=${localStorage.getItem('token')}`}
              />
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => setPlaying(null)}>Close</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'users' && (
        <div>
          <h1 style={{ marginBottom: 12 }}>Admin — Users</h1>
          <div style={{ display: 'grid', gap: 8 }}>
            {users.map(u => (
              <div key={u._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div className="muted">{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select defaultValue={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { padding: "2rem", background: "#e8f0fe", minHeight: "100vh" },
  title: { textAlign: "center", marginBottom: "2rem" },
  table: {
    width: "60%",
    margin: "0 auto",
    borderCollapse: "collapse",
    textAlign: "left",
  },
};


