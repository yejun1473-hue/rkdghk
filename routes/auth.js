const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );
};

// Predefined user credentials
const USER_CREDENTIALS = {
  '조예준': { code: 'yj123234', role: 'gm' },
  '박은찬': { code: 'ecfir125', role: 'beta_tester' },
  '김동혁': { code: 'dhsec394', role: 'beta_tester' },
  '정결': { code: 'jg283913', role: 'player' },
  '이승준': { code: 'sj283710', role: 'player' },
  '이정태': { code: 'jtet0928', role: 'player' },
  '김산': { code: 'sk228391', role: 'player' }
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, code } = req.body;
    
    // Check if username exists
    if (!USER_CREDENTIALS[username]) {
      console.log('Invalid username:', username);
      return res.status(401).json({ error: 'Invalid username or code' });
    }
    
    const userData = USER_CREDENTIALS[username];
    
    // Check if code matches
    if (code !== userData.code) {
      console.log('Invalid code for user:', username);
      return res.status(401).json({ error: 'Invalid username or code' });
    }
    
    // Find or create user
    let user = await User.findOne({ where: { username } });
    
    if (!user) {
      console.log('Creating new user:', { username, role: userData.role });
      user = await User.create({
        username,
        role: userData.role,
        gold: userData.role === 'gm' ? 1000000 : 10000
      });
    } else {
      console.log('User found:', { id: user.id, username: user.username });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    console.log('Generated token for user:', username);
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['personalKey'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
