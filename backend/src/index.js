require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// connect to DB and seed default admin
connectDB().then(async () => {
  try {
    const User = require('./models/User');
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'n@gmail.com';
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'n@0987';
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const admin = new User({ name: 'Default Admin', email: adminEmail, password: adminPass, role: 'admin', tenant: 'default' });
      await admin.save();
      console.log(`Default admin created: ${adminEmail}`);
    } else {
      console.log('Default admin already exists');
    }
  } catch (err) {
    console.error('Error seeding default admin', err);
  }
}).catch(err => console.error('DB connect error', err));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

// determine safe uploads directory (env override, local uploads, or OS tmp)
let uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch (err) {
    console.warn('Could not create uploads dir at', dir, '-', err.message);
    return null;
  }
}

let resolvedUploads = ensureDir(uploadsDir);
if (!resolvedUploads) {
  const tmpDir = path.join(os.tmpdir(), 'pulse-uploads');
  resolvedUploads = ensureDir(tmpDir);
  if (!resolvedUploads) {
    console.error('Failed to create any uploads directory. Uploads will not be available.');
  }
}

if (resolvedUploads) {
  app.locals.uploadsDir = resolvedUploads;
  // serve uploaded files statically (for testing)
  app.use('/uploads', express.static(resolvedUploads));
}

// basic root health route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'pulse-backend', env: process.env.NODE_ENV || 'development' });
});

// Socket.io: simple progress channel
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('join', (room) => {
    socket.join(room);
  });
});

// make io available to controllers via app.locals
app.locals.io = io;

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
