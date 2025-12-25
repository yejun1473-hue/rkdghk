const express = require('express');
const { User } = require('../models');
const router = express.Router();

// Middleware to check if user is GM
const isGM = (req, res, next) => {
  if (req.user && req.user.role === 'gm') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

// Get all users (GM only)
router.get('/users', isGM, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'gold', 'money', 'choco', 'checkInStreak']
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user resources (GM only)
router.patch('/users/:id/resources', isGM, async (req, res) => {
  try {
    const { gold, money, choco } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (gold !== undefined) updates.gold = gold;
    if (money !== undefined) updates.money = money;
    if (choco !== undefined) updates.choco = choco;

    await user.update(updates);
    
    res.json({
      id: user.id,
      username: user.username,
      gold: user.gold,
      money: user.money,
      choco: user.choco
    });
  } catch (error) {
    console.error('Error updating user resources:', error);
    res.status(500).json({ error: 'Failed to update user resources' });
  }
});

// Update user currency (GM only)
router.put('/users/:id/currency', isGM, async (req, res) => {
  try {
    const { gold, choco, money } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (gold !== undefined) updates.gold = gold;
    if (choco !== undefined) updates.choco = choco;
    if (money !== undefined) updates.money = money;

    await user.update(updates);
    
    res.json({
      id: user.id,
      username: user.username,
      gold: user.gold,
      choco: user.choco,
      money: user.money
    });
  } catch (error) {
    console.error('Error updating user currency:', error);
    res.status(500).json({ error: 'Failed to update user currency' });
  }
});

// Give currency to all users (GM only)
router.post('/users/give-currency', isGM, async (req, res) => {
  try {
    const { type, amount } = req.body;
    
    if (!['gold', 'choco', 'money'].includes(type)) {
      return res.status(400).json({ error: 'Invalid currency type' });
    }

    const updateField = {};
    updateField[type] = require('sequelize').literal(`${type} + ${amount}`);

    await User.update(updateField, {
      where: {}
    });

    const [updatedCount] = await User.update(updateField, {
      where: {}
    });

    res.json({
      message: `Successfully gave ${amount} ${type} to all users`,
      updatedCount
    });
  } catch (error) {
    console.error('Error giving currency to all users:', error);
    res.status(500).json({ error: 'Failed to give currency' });
  }
});

// Daily check-in for players
router.post('/check-in', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const today = new Date().toISOString().split('T')[0];
    
    if (user.lastCheckInDate === today) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let streak = 1;
    if (user.lastCheckInDate === yesterdayStr) {
      streak = user.checkInStreak + 1;
    }
    
    // Cap streak at 30 days
    streak = Math.min(streak, 30);
    
    // Calculate reward (60,000 gold per day, up to 30 days)
    const reward = 60000 * streak;
    
    await user.update({
      gold: user.gold + reward,
      checkInStreak: streak,
      lastCheckIn: new Date(),
      lastCheckInDate: today
    });
    
    res.json({
      message: `Checked in successfully! Streak: ${streak} day(s)`,
      reward,
      streak,
      gold: user.gold + reward
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to process check-in' });
  }
});

module.exports = router;
