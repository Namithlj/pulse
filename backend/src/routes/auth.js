const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);

// Admin: list users
router.get('/users', auth, async (req, res) => {
	if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
	try {
		const users = await require('../models/User').find().select('-password');
		res.json(users);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
});

// get current user
router.get('/me', auth, async (req, res) => {
	try {
		res.json({ user: req.user });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
});

// Admin: change user role
router.put('/users/:id/role', auth, async (req, res) => {
	if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
	const { role } = req.body;
	const allowed = ['viewer', 'editor', 'admin'];
	if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' });
	try {
		const User = require('../models/User');
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		user.role = role;
		await user.save();
		res.json({ message: 'Role updated', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
});

// Dev-only: inspect token payload (helps debug JWT secret / token issues)
router.get('/token-info', (req, res) => {
	if ((process.env.NODE_ENV || 'development') === 'production') return res.status(404).json({ message: 'Not found' });
	let token = null;
	const authHeader = req.headers.authorization;
	if (authHeader) token = authHeader.split(' ')[1];
	if (!token && req.query && req.query.token) token = req.query.token;
	if (!token) return res.status(400).json({ message: 'No token provided' });
	try {
		const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'replace_this_with_secure_secret');
		return res.json({ decoded });
	} catch (err) {
		return res.status(400).json({ message: 'Invalid token', error: err.message });
	}
});

module.exports = router;
