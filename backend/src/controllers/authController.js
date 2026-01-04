const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role, tenant: user.tenant }, process.env.JWT_SECRET || 'replace_this_with_secure_secret', { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  const { name, email, password, role, tenant } = req.body;
  try {
    // basic required field validation
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });

    // debug log to help track requests in production logs
    console.info('REGISTER request', { name, email, role, tenant });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User exists' });
    // allowed roles must match the enum in User model
    const allowedRoles = ['viewer', 'editor', 'admin'];
    let finalRole = 'editor';
    if (role && allowedRoles.includes(role)) finalRole = role;
    // Prevent public creation of admin accounts. Only allow role 'admin' when
    // the request includes a valid admin JWT in Authorization header.
    if (finalRole === 'admin') {
      const authHeader = req.headers.authorization;
      let allowed = false;
      if (authHeader) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'replace_this_with_secure_secret');
          if (decoded.role === 'admin') allowed = true;
        } catch (err) {
          // ignore
        }
      }
      if (!allowed) finalRole = 'editor';
    }

    // log final resolved role before saving to help diagnose enum/validation errors
    console.info('REGISTER finalRole', { email, finalRole, tenant });

    user = new User({ name, email, password, role: finalRole, tenant });
    await user.save();
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, tenant: user.tenant } });
  } catch (err) {
    console.error('REGISTER error', err);
    // If explicit debug flag is set, return the error message even in production
    if (process.env.DEBUG_REG === 'true') {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    if ((process.env.NODE_ENV || 'development') === 'production') {
      // keep generic in production
      return res.status(500).json({ message: 'Server error' });
    }
    // in non-production, return the error message to help remote debugging
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, tenant: user.tenant } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
