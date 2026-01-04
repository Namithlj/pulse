const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // accept token in Authorization header or as query param ?token=
  let token = null;
  if (authHeader) token = authHeader.split(' ')[1];
  if (!token && req.query && req.query.token) token = req.query.token;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_this_with_secure_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware token error:', err && err.message ? err.message : err);
    // In development return the underlying message to help debugging JWT issues. In production keep it generic.
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    return res.status(401).json({ message: isDev ? `Token error: ${err.message || err}` : 'Token error' });
  }
};
