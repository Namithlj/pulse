const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://pulse_namith:Namith0987@pulse.j6btx3k.mongodb.net/?appName=pulse';
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err);
    // Do not exit process in serverless environments; return false so caller can
    // decide how to handle the failure without abruptly terminating the runtime.
    return false;
  }
};

module.exports = connectDB;
