const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = (req.app && req.app.locals && req.app.locals.uploadsDir) ? req.app.locals.uploadsDir : (process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'));
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } });

// upload video
// Only editors & admins can upload
router.post('/upload', auth, (req, res, next) => {
  if (!['editor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  try {
    const video = new Video({
      owner: req.user._id,
      tenant: req.user.tenant,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'uploaded'
    });
    await video.save();

    // start processing asynchronously
    process.nextTick(() => {
      const io = req.app.locals.io;
      const dir = req.app && req.app.locals && req.app.locals.uploadsDir ? req.app.locals.uploadsDir : (process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'));
      simulateProcessing(io, video, path.join(dir, req.file.filename));
    });

    res.json({ video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// list videos for user (multi-tenant)
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    // non-admins only see their own videos
    if (req.user.role !== 'admin') {
      filter.owner = req.user._id;
    }
    const videos = await Video.find(filter).populate('owner', 'name email').sort({ createdAt: -1 });
    res.json({ videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// stream with range support (requires auth and ownership/admin)
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).send('Not found');
    // enforce ownership or admin
    if (String(video.owner) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).send('Forbidden');
    const dir = req.app && req.app.locals && req.app.locals.uploadsDir ? req.app.locals.uploadsDir : (process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'));
    const filePath = path.join(dir, video.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File missing');

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType || 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType || 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// basic get metadata
router.get('/:id', auth, async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: 'Not found' });
  // enforce ownership
  if (String(video.owner) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  res.json({ video });
});

async function simulateProcessing(io, videoDoc, filePath) {
  try {
    await videoDoc.updateOne({ status: 'processing' });
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const pct = Math.round((i / steps) * 100);
      io.to(String(videoDoc._id)).emit('processing', { id: videoDoc._id, progress: pct, status: 'processing' });
      await new Promise(r => setTimeout(r, 1000));
    }
    // fake sensitivity: random safe/flagged
    const isFlagged = Math.random() < 0.25;
    const finalStatus = isFlagged ? 'flagged' : 'safe';
    await videoDoc.updateOne({ status: finalStatus, analysis: { flagged: isFlagged, reason: isFlagged ? 'Detected sensitive frames' : 'No issues' } });
    io.to(String(videoDoc._id)).emit('processing', { id: videoDoc._id, progress: 100, status: finalStatus });
  } catch (err) {
    console.error('Processing error', err);
    await videoDoc.updateOne({ status: 'error' });
    io.to(String(videoDoc._id)).emit('processing', { id: videoDoc._id, progress: 0, status: 'error' });
  }
}

module.exports = router;
