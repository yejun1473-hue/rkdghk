const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

// Legacy authentication middleware (for backward compatibility)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다.' });
    }
    res.status(500).json({ error: '인증 중 오류가 발생했습니다.' });
  }
};

const checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '이 작업을 수행할 권한이 없습니다.' });
    }

    next();
  };
};

// Simple middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    
    try {
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Weapon,
            as: 'weapons',
            order: [['level', 'DESC']],
            limit: 1
          }
        ]
      });
      
      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('User lookup error:', error);
      res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
    }
  });
};

// Middleware to check if user has admin role
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  checkRole,
  isAuthenticated,
  isAdmin
};
