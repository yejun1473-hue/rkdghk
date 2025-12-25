const express = require('express');
const { Op } = require('sequelize');
const { User, Battle, Weapon } = require('../models');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Start a new battle
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { opponentId } = req.body;
    const userId = req.user.id;

    // Check if opponent exists and is not the same as the current user
    if (opponentId === userId) {
      return res.status(400).json({ error: '자기 자신과는 대결할 수 없습니다.' });
    }

    const opponent = await User.findByPk(opponentId);
    if (!opponent) {
      return res.status(404).json({ error: '상대방을 찾을 수 없습니다.' });
    }

    // Check if there's already a pending battle between these users
    const existingBattle = await Battle.findOne({
      where: {
        [Op.or]: [
          { player1Id: userId, player2Id: opponentId, status: 'pending' },
          { player1Id: opponentId, player2Id: userId, status: 'pending' }
        ]
      }
    });

    if (existingBattle) {
      return res.status(400).json({ 
        error: '이미 대기 중인 대결이 있습니다.',
        battleId: existingBattle.id
      });
    }

    // Create a new battle
    const battle = await Battle.create({
      player1Id: userId,
      player2Id: opponentId,
      status: 'pending'
    });

    res.status(201).json({ battle });
  } catch (error) {
    console.error('Battle creation error:', error);
    res.status(500).json({ error: '대결 생성 중 오류가 발생했습니다.' });
  }
});

// Get battle details
router.get('/:battleId', authenticateToken, async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = await Battle.findByPk(battleId, {
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username', 'avatar', 'title'] },
        { model: User, as: 'player2', attributes: ['id', 'username', 'avatar', 'title'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ]
    });

    if (!battle) {
      return res.status(404).json({ error: '대결을 찾을 수 없습니다.' });
    }

    res.json({ battle });
  } catch (error) {
    console.error('Get battle error:', error);
    res.status(500).json({ error: '대결 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// Process battle turn
router.post('/:battleId/turn', authenticateToken, async (req, res) => {
  try {
    const { battleId } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    const battle = await Battle.findByPk(battleId, {
      include: [
        { model: User, as: 'player1' },
        { model: User, as: 'player2' }
      ]
    });

    if (!battle) {
      return res.status(404).json({ error: '대결을 찾을 수 없습니다.' });
    }

    // Verify user is part of this battle
    if (battle.player1Id !== userId && battle.player2Id !== userId) {
      return res.status(403).json({ error: '이 대결에 참여할 권한이 없습니다.' });
    }

    // Simple battle logic (can be expanded)
    if (battle.status !== 'in_progress') {
      // Start battle if not already started
      battle.status = 'in_progress';
      battle.battleLog = [];
      await battle.save();
    }

    // Process the battle turn
    // This is a simplified version - you can expand this with more complex battle logic
    const logEntry = {
      playerId: userId,
      action,
      timestamp: new Date().toISOString()
    };

    const battleLog = battle.battleLog || [];
    battleLog.push(logEntry);
    battle.battleLog = battleLog;

    // Check for battle end conditions (simplified)
    if (battleLog.length >= 5) { // Example: battle ends after 5 turns
      battle.status = 'completed';
      // Simple random winner for now
      battle.winnerId = Math.random() > 0.5 ? battle.player1Id : battle.player2Id;
      
      // Update user stats
      const winner = battle.winnerId === battle.player1Id ? battle.player1 : battle.player2;
      const loser = battle.winnerId === battle.player1Id ? battle.player2 : battle.player1;
      
      await Promise.all([
        User.update(
          { 
            wins: winner.wins + 1,
            winStreak: winner.winStreak + 1,
            maxWinStreak: Math.max(winner.maxWinStreak, winner.winStreak + 1),
            battleRating: winner.battleRating + 20,
            totalBattles: winner.totalBattles + 1
          },
          { where: { id: winner.id } }
        ),
        User.update(
          { 
            losses: loser.losses + 1,
            winStreak: 0,
            battleRating: Math.max(0, loser.battleRating - 10),
            totalBattles: loser.totalBattles + 1
          },
          { where: { id: loser.id } }
        )
      ]);
    }

    await battle.save();
    
    // Get updated battle with user data
    const updatedBattle = await Battle.findByPk(battleId, {
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username', 'avatar', 'title'] },
        { model: User, as: 'player2', attributes: ['id', 'username', 'avatar', 'title'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ]
    });

    res.json({ 
      battle: updatedBattle,
      message: '턴이 처리되었습니다.'
    });
  } catch (error) {
    console.error('Battle turn error:', error);
    res.status(500).json({ error: '턴을 처리하는 중 오류가 발생했습니다.' });
  }
});

// Get user's battle history
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const battles = await Battle.findAndCountAll({
      where: {
        [Op.or]: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        status: 'completed'
      },
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'player2', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ battles });
  } catch (error) {
    console.error('Battle history error:', error);
    res.status(500).json({ error: '대결 기록을 가져오는 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
