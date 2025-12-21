const express = require('express');
const { Op } = require('sequelize');
const { Weapon, User, EnhancementAttempt } = require('../models');
const router = express.Router();

// Enhancement rates configuration
const ENHANCEMENT_RATES = {
  0: { success: 100, maintain: 0, destroy: 0, cost: 10 },
  1: { success: 95, maintain: 3, destroy: 2, cost: 20 },
  2: { success: 90, maintain: 7, destroy: 3, cost: 50 },
  3: { success: 85, maintain: 10, destroy: 5, cost: 100 },
  4: { success: 80, maintain: 10, destroy: 10, cost: 500 },
  5: { success: 65, maintain: 22, destroy: 13, cost: 1500 },
  6: { success: 60, maintain: 24, destroy: 16, cost: 5000 },
  7: { success: 55, maintain: 26, destroy: 19, cost: 10000 },
  8: { success: 50, maintain: 28, destroy: 22, cost: 50000 },
  9: { success: 45, maintain: 30, destroy: 25, cost: 65000 },
  10: { success: 38, maintain: 32, destroy: 30, cost: 82000 },
  11: { success: 32, maintain: 33, destroy: 35, cost: 101000 },
  12: { success: 27, maintain: 33, destroy: 40, cost: 150000 },
  13: { success: 22, maintain: 33, destroy: 45, cost: 250000 },
  14: { success: 18, maintain: 32, destroy: 50, cost: 500000 },
  15: { success: 15, maintain: 30, destroy: 55, cost: 750000 },
  16: { success: 12, maintain: 28, destroy: 60, cost: 1000000 },
  17: { success: 10, maintain: 25, destroy: 65, cost: 1250000 },
  18: { success: 8, maintain: 22, destroy: 70, cost: 2000000 },
  19: { success: 5, maintain: 20, destroy: 75, cost: 3000000 }
};

// Get all weapons for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const weapons = await Weapon.findAll({
      where: { userId },
      order: [['level', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(weapons);
  } catch (error) {
    console.error('Get weapons error:', error);
    res.status(500).json({ error: 'Failed to fetch weapons' });
  }
});

// Create a new weapon
router.post('/', async (req, res) => {
  try {
    const { userId, name, baseName, isHidden = false } = req.body;
    
    const weapon = await Weapon.create({
      name,
      baseName: baseName || name,
      level: 0,
      isHidden,
      userId
    });

    res.status(201).json(weapon);
  } catch (error) {
    console.error('Create weapon error:', error);
    res.status(500).json({ error: 'Failed to create weapon' });
  }
});

// Enhance a weapon
router.post('/:id/enhance', async (req, res) => {
  const transaction = await Weapon.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Find the weapon with user
    const weapon = await Weapon.findOne({
      where: { id, userId },
      include: [User],
      transaction
    });

    if (!weapon) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Weapon not found' });
    }

    const currentLevel = weapon.level;
    const rates = ENHANCEMENT_RATES[currentLevel];

    if (!rates) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid enhancement level' });
    }

    // Check if user has enough gold
    if (weapon.User.gold < rates.cost) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Not enough gold' });
    }

    // Deduct gold
    weapon.User.gold -= rates.cost;
    await weapon.User.save({ transaction });

    // Calculate enhancement result
    const roll = Math.random() * 100;
    let result, newLevel = currentLevel;

    if (roll <= rates.success) {
      result = 'success';
      newLevel = currentLevel + 1;
    } else if (roll <= rates.success + rates.maintain) {
      result = 'maintain';
    } else {
      result = 'destroy';
      newLevel = 0;
    }

    // Update weapon level
    const previousLevel = weapon.level;
    weapon.level = newLevel;
    await weapon.save({ transaction });

    // Log the attempt
    await EnhancementAttempt.create({
      userId,
      weaponId: weapon.id,
      levelBefore: currentLevel,
      levelAfter: newLevel,
      goldSpent: rates.cost,
      result
    }, { transaction });

    // Commit transaction
    await transaction.commit();

    // Send response
    res.json({
      result,
      previousLevel,
      newLevel,
      goldSpent: rates.cost,
      goldRemaining: weapon.User.gold,
      weapon: {
        id: weapon.id,
        name: weapon.name,
        level: weapon.level,
        isHidden: weapon.isHidden,
        baseName: weapon.baseName
      }
    });

    // If enhancement was successful and level is 10+, send global notification
    if (result === 'success' && newLevel >= 10) {
      // In a real app, you would use WebSocket or SSE to notify all clients
      console.log(`GLOBAL: ${weapon.User.username}님이 [+${newLevel}]강 ${weapon.name} 강화에 성공했습니다!`);
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Enhance weapon error:', error);
    res.status(500).json({ error: 'Failed to enhance weapon' });
  }
});

// Sell a weapon
router.post('/:id/sell', async (req, res) => {
  const transaction = await Weapon.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Find the weapon with user
    const weapon = await Weapon.findOne({
      where: { id, userId },
      include: [User],
      transaction
    });

    if (!weapon) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Weapon not found' });
    }

    // Calculate sell price (30% of the original sell price if destroyed, else full)
    const sellPrice = Math.floor(weapon.sellPrice * (weapon.level === 0 ? 0.3 : 1));
    
    // Add gold to user
    weapon.User.gold += sellPrice;
    await weapon.User.save({ transaction });

    // Delete the weapon
    await weapon.destroy({ transaction });

    // Commit transaction
    await transaction.commit();

    res.json({
      success: true,
      goldEarned: sellPrice,
      goldRemaining: weapon.User.gold
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Sell weapon error:', error);
    res.status(500).json({ error: 'Failed to sell weapon' });
  }
});

// Get enhancement history for a weapon
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await EnhancementAttempt.findAll({
      where: { weaponId: id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    res.json(history);
  } catch (error) {
    console.error('Get weapon history error:', error);
    res.status(500).json({ error: 'Failed to fetch weapon history' });
  }
});

module.exports = router;
