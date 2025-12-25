const express = require('express');
const { Op } = require('sequelize');
const { User, Weapon, Battle } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'username', 'avatar', 'title', 'bio', 
        'battleRating', 'wins', 'losses', 'draws',
        'totalBattles', 'winStreak', 'maxWinStreak',
        'createdAt'
      ],
      include: [
        {
          model: Weapon,
          as: 'Weapons',
          attributes: ['id', 'name', 'level', 'enhancement', 'isEquipped'],
          where: { isEquipped: true },
          required: false,
          limit: 1
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // Get recent battles
    const recentBattles = await Battle.findAll({
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
        { model: User, as: 'winner', attributes: ['id'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    res.json({
      profile: user,
      recentBattles
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: '프로필을 불러오는 중 오류가 발생했습니다.' });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { avatar, title, bio } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (avatar) updates.avatar = avatar;
    if (title) updates.title = title;
    if (bio !== undefined) updates.bio = bio;

    await User.update(updates, {
      where: { id: userId },
      fields: ['avatar', 'title', 'bio']
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'avatar', 'title', 'bio']
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '프로필을 업데이트하는 중 오류가 발생했습니다.' });
  }
});

// Get rankings
router.get('/rankings', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: [
        'id', 'username', 'avatar', 'title', 
        'battleRating', 'wins', 'losses'
      ],
      order: [['battleRating', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add rank based on battle rating
    const usersWithRank = users.map((user, index) => ({
      rank: offset + index + 1,
      ...user.toJSON()
    }));

    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      users: usersWithRank
    });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ error: '랭킹을 불러오는 중 오류가 발생했습니다.' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: '검색어는 2글자 이상이어야 합니다.' });
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        username: {
          [Op.like]: `%${query}%`
        }
      },
      attributes: ['id', 'username', 'avatar', 'title', 'battleRating'],
      order: [['battleRating', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: '사용자 검색 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
