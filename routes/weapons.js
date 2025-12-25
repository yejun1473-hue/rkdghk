const express = require('express');
const { Op, Sequelize } = require('sequelize');
const { Weapon, User, EnhancementAttempt, Currency, Battle } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Hidden weapons configuration
const HIDDEN_WEAPONS = [
  { id: 'ancient_bone', name: '제작자의 유골', condition: { type: 'total_destroyed', value: 10 } },
  { id: 'christmas_sword', name: '크리스마스 검', condition: { type: 'seasonal', month: 12 } },
  { id: 'gingerbread', name: '진저브레드', condition: { type: 'seasonal', month: 12 } },
  { id: 'discount_flowers', name: '금방 시들 것 같은 할인 꽃다발', condition: { type: 'random', chance: 0.05 } },
  { id: 'mini_lightsaber', name: '작은 광선검', condition: { type: 'high_level', level: 15 } },
  { id: 'mystery_sausage', name: '빵에 낀 의문의 소시지', condition: { type: 'random', chance: 0.01 } }
];

// Enhancement rates configuration with costs in gold (G)
const ENHANCEMENT_RATES = {
  0: { success: 100, maintain: 0, destroy: 0, cost: 1000 }, // 1,000G
  1: { success: 95, maintain: 3, destroy: 2, cost: 2000 },    // 2,000G
  2: { success: 90, maintain: 7, destroy: 3, cost: 5000 },    // 5,000G
  3: { success: 85, maintain: 10, destroy: 5, cost: 10000 },  // 10,000G
  4: { success: 80, maintain: 10, destroy: 10, cost: 50000 }, // 50,000G
  5: { success: 65, maintain: 22, destroy: 13, cost: 150000 }, // 150,000G
  6: { success: 60, maintain: 24, destroy: 16, cost: 500000 }, // 500,000G
  7: { success: 55, maintain: 26, destroy: 19, cost: 1000000 }, // 1,000,000G
  8: { success: 50, maintain: 28, destroy: 22, cost: 2000000 }, // 2,000,000G
  9: { success: 45, maintain: 30, destroy: 25, cost: 3000000 }, // 3,000,000G
  10: { success: 40, maintain: 30, destroy: 30, cost: 5000000 }, // 5,000,000G
  11: { success: 35, maintain: 30, destroy: 35, cost: 7500000 }, // 7,500,000G
  12: { success: 30, maintain: 30, destroy: 40, cost: 10000000 }, // 10,000,000G
  13: { success: 25, maintain: 30, destroy: 45, cost: 15000000 }, // 15,000,000G
  14: { success: 20, maintain: 30, destroy: 50, cost: 20000000 }, // 20,000,000G
  15: { success: 15, maintain: 30, destroy: 55, cost: 30000000 }, // 30,000,000G
  16: { success: 10, maintain: 30, destroy: 60, cost: 40000000 }, // 40,000,000G
  17: { success: 8, maintain: 30, destroy: 62, cost: 50000000 },  // 50,000,000G
  18: { success: 5, maintain: 30, destroy: 65, cost: 75000000 },  // 75,000,000G
  19: { success: 2, maintain: 30, destroy: 68, cost: 100000000 }  // 100,000,000G
};

// Currency conversion rates (G -> C -> M)
const CURRENCY_RATES = {
  G_TO_C: 120000, // 1C = 120,000G
  C_TO_M: 120      // 1M = 120C = 14,400,000G
};

// Helper function to check hidden weapon conditions
async function checkHiddenWeaponConditions(user, weapon) {
  const conditions = {
    total_destroyed: async () => {
      const destroyed = await EnhancementAttempt.count({
        where: { 
          userId: user.id,
          result: 'destroyed'
        }
      });
      return destroyed >= weapon.condition.value;
    },
    seasonal: async () => {
      const now = new Date();
      return now.getMonth() + 1 === weapon.condition.month;
    },
    random: async () => Math.random() < weapon.condition.chance,
    high_level: async () => {
      const highestWeapon = await Weapon.findOne({
        where: { userId: user.id },
        order: [['level', 'DESC']]
      });
      return highestWeapon && highestWeapon.level >= weapon.condition.level;
    }
  };

  const conditionMet = await conditions[weapon.condition.type]();
  return conditionMet;
}

// Get all weapons for a user with enhancement rates and battle stats
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get user's weapons with battle stats
    const weapons = await Weapon.findAll({
      where: { userId },
      include: [{
        model: Battle,
        as: 'wonBattles',
        attributes: [],
        required: false
      }],
      attributes: [
        '*',
        [Sequelize.fn('COUNT', Sequelize.col('wonBattles.id')), 'battleWins']
      ],
      group: ['Weapon.id'],
      order: [['level', 'DESC'], ['createdAt', 'DESC']],
      subQuery: false
    });

    // Get enhancement rates and calculate battle power for each weapon
    const weaponsWithStats = await Promise.all(weapons.map(async (weapon) => {
      const rates = ENHANCEMENT_RATES[weapon.level] || {};
      const battlePower = calculateBattlePower(weapon);
      const sellPrice = calculateSellPrice(weapon);
      
      // Get enhancement history
      const history = await EnhancementAttempt.findAll({
        where: { weaponId: weapon.id },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['result', 'levelBefore', 'levelAfter', 'createdAt']
      });

      return {
        ...weapon.toJSON(),
        enhancementRates: rates,
        nextLevelCost: rates.cost || 0,
        battlePower,
        sellPrice,
        history
      };
    }));

    // Check for hidden weapon unlocks
    const hiddenWeapons = [];
    for (const hw of HIDDEN_WEAPONS) {
      const exists = weapons.some(w => w.baseName === hw.name);
      if (!exists) {
        const canUnlock = await checkHiddenWeaponConditions(req.user, hw);
        if (canUnlock) {
          hiddenWeapons.push({
            ...hw,
            unlockMessage: getUnlockMessage(hw)
          });
        }
      }
    }

    // Get user's currency
    const currency = await Currency.findOne({ where: { userId } });

    res.json({
      weapons: weaponsWithStats,
      hiddenWeapons,
      currency: {
        gold: currency?.gold || 0,
        choco: currency?.choco || 0,
        money: currency?.money || 0
      },
      currencyRates: CURRENCY_RATES
    });
  } catch (error) {
    console.error('Get weapons error:', error);
    res.status(500).json({ error: 'Failed to fetch weapons' });
  }
});

// Create a new weapon
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, baseName, isHidden = false } = req.body;
    const userId = req.user.id;
    
    // Check if user already has this weapon
    const existingWeapon = await Weapon.findOne({
      where: { userId, baseName }
    });
    
    if (existingWeapon) {
      return res.status(400).json({ error: 'You already have this weapon' });
    }

    const weapon = await Weapon.create({
      userId,
      name: name || 'Basic Sword',
      baseName: baseName || 'Basic Sword',
      isHidden,
      level: 0,
      imageUrl: isHidden 
        ? `/assets/hidden/${baseName?.toLowerCase().replace(/\s+/g, '_')}.png` 
        : `/assets/weapons/${baseName?.toLowerCase().replace(/\s+/g, '_')}/0.png`
    });

    res.status(201).json(weapon);
  } catch (error) {
    console.error('Create weapon error:', error);
    res.status(500).json({ error: 'Failed to create weapon' });
  }
});

// Helper function to calculate battle power
function calculateBattlePower(weapon) {
  const basePower = 10 + (weapon.level * 2);
  const bonus = weapon.isHidden ? 1.5 : 1.0;
  return Math.floor(basePower * bonus);
}

// Helper function to calculate sell price
function calculateSellPrice(weapon) {
  const basePrice = weapon.level * 1000;
  const bonus = weapon.isHidden ? 3 : 1;
  return Math.floor(basePrice * bonus);
}

// Helper function to get unlock message for hidden weapons
function getUnlockMessage(weapon) {
  const messages = {
    total_destroyed: `무기 ${weapon.condition.value}개 파괴 달성`,
    seasonal: '시즌 한정 무기',
    random: '운이 좋으시네요!',
    high_level: `+${weapon.condition.level}강 무기 보유`
  };
  return messages[weapon.condition.type] || '새로운 무기 해금!';
}

// Enhance a weapon
router.post('/:id/enhance', isAuthenticated, async (req, res) => {
  const transaction = await Weapon.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

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
router.post('/:id/sell', isAuthenticated, async (req, res) => {
  const transaction = await Weapon.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { confirm } = req.body;
    
    if (confirm !== true) {
      return res.status(400).json({ error: '판매를 확인해주세요' });
    }

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

// Get enhancement history for a weapon with pagination
router.get('/:id/history', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await EnhancementAttempt.findAndCountAll({
      where: { weaponId: id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      history: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get weapon history error:', error);
    res.status(500).json({ error: 'Failed to fetch weapon history' });
  }
});

// Battle with another player's weapon
router.post('/:id/battle', isAuthenticated, async (req, res) => {
  const transaction = await Weapon.sequelize.transaction();
  
  try {
    const { id: attackerWeaponId } = req.params;
    const { defenderWeaponId } = req.body;
    const attackerId = req.user.id;

    // Get attacker's weapon with user
    const attackerWeapon = await Weapon.findOne({
      where: { id: attackerWeaponId, userId: attackerId },
      include: [
        { model: User, include: [Currency] }
      ],
      transaction
    });

    if (!attackerWeapon) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Your weapon was not found' });
    }

    // Get defender's weapon with user
    const defenderWeapon = await Weapon.findOne({
      where: { id: defenderWeaponId },
      include: [
        { model: User, include: [Currency] }
      ],
      transaction
    });

    if (!defenderWeapon) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Opponent\'s weapon not found' });
    }

    // Calculate battle outcome
    const attackerPower = calculateBattlePower(attackerWeapon);
    const defenderPower = calculateBattlePower(defenderWeapon);
    const attackerWin = Math.random() * (attackerPower + defenderPower) < attackerPower;
    const winnerWeapon = attackerWin ? attackerWeapon : defenderWeapon;
    const loserWeapon = attackerWin ? defenderWeapon : attackerWeapon;

    // Calculate gold exchange (5% of loser's gold, min 1000, max 1,000,000)
    const goldExchange = Math.min(
      Math.max(Math.floor(loserWeapon.User.Currency.gold * 0.05), 1000),
      1000000
    );

    // Update currencies
    await Currency.increment('gold', {
      by: goldExchange,
      where: { userId: winnerWeapon.userId },
      transaction
    });

    await Currency.decrement('gold', {
      by: goldExchange,
      where: { userId: loserWeapon.userId },
      transaction
    });

    // Record battle
    const battle = await Battle.create({
      winnerId: winnerWeapon.userId,
      loserId: loserWeapon.userId,
      winnerWeaponId: winnerWeapon.id,
      loserWeaponId: loserWeapon.id,
      goldExchanged: goldExchange,
      winnerPower: attackerWin ? attackerPower : defenderPower,
      loserPower: attackerWin ? defenderPower : attackerPower
    }, { transaction });

    await transaction.commit();

    res.json({
      winner: {
        id: winnerWeapon.userId,
        username: winnerWeapon.User.username,
        weapon: {
          id: winnerWeapon.id,
          name: winnerWeapon.name,
          level: winnerWeapon.level
        },
        goldWon: goldExchange
      },
      loser: {
        id: loserWeapon.userId,
        username: loserWeapon.User.username,
        weapon: {
          id: loserWeapon.id,
          name: loserWeapon.name,
          level: loserWeapon.level
        },
        goldLost: goldExchange
      },
      battleId: battle.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Battle error:', error);
    res.status(500).json({ error: 'Battle failed' });
  }
});

// Get battle history for a weapon
router.get('/:id/battles', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Battle.findAndCountAll({
      where: {
        [Op.or]: [
          { winnerWeaponId: id },
          { loserWeaponId: id }
        ]
      },
      include: [
        {
          model: User,
          as: 'winner',
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'loser',
          attributes: ['id', 'username']
        },
        {
          model: Weapon,
          as: 'winnerWeapon',
          attributes: ['id', 'name', 'level']
        },
        {
          model: Weapon,
          as: 'loserWeapon',
          attributes: ['id', 'name', 'level']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      battles: rows.map(battle => ({
        id: battle.id,
        winner: {
          id: battle.winner.id,
          username: battle.winner.username,
          weapon: {
            id: battle.winnerWeapon.id,
            name: battle.winnerWeapon.name,
            level: battle.winnerWeapon.level
          }
        },
        loser: {
          id: battle.loser.id,
          username: battle.loser.username,
          weapon: {
            id: battle.loserWeapon.id,
            name: battle.loserWeapon.name,
            level: battle.loserWeapon.level
          }
        },
        goldExchanged: battle.goldExchanged,
        winnerPower: battle.winnerPower,
        loserPower: battle.loserPower,
        createdAt: battle.createdAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get battle history error:', error);
    res.status(500).json({ error: 'Failed to fetch battle history' });
  }
});

module.exports = router;
