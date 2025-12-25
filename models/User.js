const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    personalKey: {
      type: DataTypes.CHAR(8),
      unique: true,
      allowNull: false,
      field: 'personal_key'
    },
    role: {
      type: DataTypes.ENUM('player', 'beta_tester', 'gm'),
      defaultValue: 'player'
    },
    gold: {
      type: DataTypes.BIGINT,
      defaultValue: 10000  // Starting gold
    },
    choco: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    money: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Battle statistics
    battleRating: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      field: 'battle_rating'
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Profile fields
    avatar: {
      type: DataTypes.STRING(255),
      defaultValue: 'default-avatar.png'
    },
    title: {
      type: DataTypes.STRING(100),
      defaultValue: '초보 모험가'
    },
    bio: {
      type: DataTypes.TEXT,
      defaultValue: '안녕하세요! 새로운 모험가입니다.'
    },
    // Attendance
    lastCheckIn: {
      type: DataTypes.DATE,
      field: 'last_check_in'
    },
    checkInStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'check_in_streak'
    },
    lastCheckInDate: {
      type: DataTypes.DATEONLY,
      field: 'last_check_in_date'
    },
    // Additional stats
    totalBattles: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_battles'
    },
    winStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'win_streak'
    },
    maxWinStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'max_win_streak'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    defaultScope: {
      attributes: {
        exclude: ['password', 'personalKey']
      }
    },
    scopes: {
      withSensitiveData: {
        attributes: { include: ['personalKey'] }
      },
      forRanking: {
        attributes: ['id', 'username', 'battleRating', 'wins', 'losses', 'avatar', 'title'],
        order: [['battleRating', 'DESC']],
        limit: 100
      }
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.personalKey) {
          const salt = await bcrypt.genSalt(10);
          user.personalKey = await bcrypt.hash(user.personalKey, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('personalKey')) {
          const salt = await bcrypt.genSalt(10);
          user.personalKey = await bcrypt.hash(user.personalKey, salt);
        }
      }
    }
  });

  User.prototype.verifyPersonalKey = async function(personalKey) {
    return await bcrypt.compare(personalKey, this.personalKey);
  };

  User.associate = (models) => {
    User.hasMany(models.Weapon, { foreignKey: 'userId' });
    User.hasMany(models.EnhancementAttempt, { foreignKey: 'userId' });
  };

  return User;
};
