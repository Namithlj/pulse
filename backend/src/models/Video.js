const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: String },
  filename: { type: String, required: true },
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  status: { type: String, enum: ['uploaded','processing','safe','flagged','error'], default: 'uploaded' },
  analysis: { type: Object },
  duration: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
