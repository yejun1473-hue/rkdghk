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

// Predefined user codes from PRD
const PREDEFINED_CODES = {
  // GM
  'yj123234': 'gm',
  
  // Beta Testers
  'ecfir125': 'beta_tester',
  'dhsec394': 'beta_tester',
  
  // Regular Players
  'jg283913': 'player',
  'sj283710': 'player',
  'jtet0928': 'player',
  'sk228391': 'player'
};

// Login with predefined code
router.post('/login', async (req, res) => {
  try {
    const { username, code } = req.body;
    
    if (!username || !code) {
      return res.status(400).json({ error: 'Username and code are required' });
    }

    // Check if code is valid
    const role = PREDEFINED_CODES[code];
    if (!role) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Find or create user
    let user = await User.findOne({ where: { username } });
    
    if (!user) {
      // Create new user with the code as personal key
      user = await User.create({
        username,
        personalKey: code, // Store the code as personal key
        role,
        gold: role === 'gm' ? 1000000 : 10000 // GMs start with more gold
      });
    } else {
      // Verify code matches
      const isMatch = await user.verifyPersonalKey(code);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid code for this user' });
      }
    }

    // Generate token
    const token = generateToken(user);
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    // This would be protected by auth middleware in a real app
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
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
