const express = require('express');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Check attendance
router.post('/', authenticateToken, async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if already checked in today
    const lastCheckIn = await User.findOne({
      where: {
        id: userId,
        lastCheckIn: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      transaction
    });
    
    if (lastCheckIn) {
      await transaction.rollback();
      return res.status(400).json({ error: '오늘은 이미 출석체크를 하셨습니다.' });
    }
    
    // Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const user = await User.findByPk(userId, { transaction });
    let { checkInStreak } = user;
    
    // Check if this is a consecutive day
    if (user.lastCheckInDate) {
      const lastCheckInDate = new Date(user.lastCheckInDate);
      lastCheckInDate.setHours(0, 0, 0, 0);
      
      if (lastCheckInDate.getTime() === yesterday.getTime()) {
        // Consecutive day
        checkInStreak += 1;
      } else if (lastCheckInDate.getTime() < yesterday.getTime()) {
        // Not consecutive, reset streak
        checkInStreak = 1;
      }
    } else {
      // First time checking in
      checkInStreak = 1;
    }
    
    // Calculate rewards based on streak
    let rewardGold = 1000; // Base reward
    let rewardChoco = 0;
    
    // Bonus for streaks
    if (checkInStreak >= 7) {
      rewardGold += 3000; // Weekly bonus
      if (checkInStreak % 30 === 0) {
        rewardGold += 10000; // Monthly bonus
        rewardChoco += 1;
      }
    }
    
    // Update user's attendance and rewards
    await User.update(
      {
        lastCheckIn: new Date(),
        lastCheckInDate: today,
        checkInStreak,
        gold: user.gold + rewardGold,
        choco: user.choco + rewardChoco
      },
      { where: { id: userId }, transaction }
    );
    
    await transaction.commit();
    
    res.json({
      message: '출석체크가 완료되었습니다!',
      rewards: {
        gold: rewardGold,
        choco: rewardChoco,
        streak: checkInStreak
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Attendance check error:', error);
    res.status(500).json({ error: '출석체크 중 오류가 발생했습니다.' });
  }
});

// Get attendance status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'checkInStreak', 'lastCheckIn']
    });
    
    const checkedInToday = user.lastCheckIn && 
      user.lastCheckIn >= today && 
      user.lastCheckIn < tomorrow;
    
    res.json({
      checkedInToday,
      currentStreak: user.checkInStreak,
      lastCheckIn: user.lastCheckIn
    });
    
  } catch (error) {
    console.error('Get attendance status error:', error);
    res.status(500).json({ error: '출석 상태를 불러오는 중 오류가 발생했습니다.' });
  }
});

// Get monthly attendance calendar
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;
    
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    
    // Get all check-ins for the month
    const checkIns = await User.findAll({
      where: {
        id: userId,
        lastCheckIn: {
          [Op.gte]: firstDay,
          [Op.lte]: new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999)
        }
      },
      attributes: ['lastCheckIn'],
      raw: true
    });
    
    // Create a set of dates for easy lookup
    const checkedDates = new Set(
      checkIns.map(checkIn => {
        const date = new Date(checkIn.lastCheckIn);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
    );
    
    // Generate calendar data
    const calendar = [];
    const currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      calendar.push({
        date: dateStr,
        day: currentDate.getDate(),
        dayOfWeek: currentDate.getDay(),
        checked: checkedDates.has(dateStr)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      year: targetDate.getFullYear(),
      month: targetDate.getMonth() + 1,
      calendar
    });
    
  } catch (error) {
    console.error('Get attendance calendar error:', error);
    res.status(500).json({ error: '출석 달력을 불러오는 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
