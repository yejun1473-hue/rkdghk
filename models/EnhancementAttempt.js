const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnhancementAttempt = sequelize.define('EnhancementAttempt', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    weaponId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'weapon_id',
      references: {
        model: 'weapons',
        key: 'id'
      }
    },
    levelBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'level_before'
    },
    levelAfter: {
      type: DataTypes.INTEGER,
      field: 'level_after'
    },
    goldSpent: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'gold_spent'
    },
    result: {
      type: DataTypes.ENUM('success', 'maintain', 'destroy'),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    weaponName: {
      type: DataTypes.STRING,
      field: 'weapon_name'
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_hidden'
    }
  }, {
    tableName: 'enhancement_attempts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
        name: 'idx_enhancement_attempts_user_id'
      },
      {
        fields: ['weapon_id'],
        name: 'idx_enhancement_attempts_weapon_id'
      },
      {
        fields: ['timestamp'],
        name: 'idx_enhancement_attempts_timestamp'
      },
      {
        fields: ['result'],
        name: 'idx_enhancement_attempts_result'
      },
      {
        fields: ['level_after'],
        name: 'idx_enhancement_attempts_level_after'
      }
    ]
  });

  // Class methods
  EnhancementAttempt.associate = (models) => {
    EnhancementAttempt.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    EnhancementAttempt.belongsTo(models.Weapon, {
      foreignKey: 'weaponId',
      as: 'weapon',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  EnhancementAttempt.prototype.getEnhancementStats = async function() {
    const stats = await EnhancementAttempt.findAll({
      where: { userId: this.userId },
      attributes: [
        'result',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['result']
    });
    
    return stats.reduce((acc, stat) => {
      acc[stat.result] = parseInt(stat.get('count'), 10);
      return acc;
    }, { success: 0, maintain: 0, destroy: 0 });
  };

  // Get recent attempts for a user
  EnhancementAttempt.getRecentAttempts = async function(userId, limit = 10) {
    return await this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: sequelize.models.Weapon,
          as: 'weapon',
          attributes: ['id', 'name', 'level', 'isHidden']
        }
      ]
    });
  };

  // Get global high scores
  EnhancementAttempt.getGlobalHighScores = async function(limit = 10) {
    return await this.findAll({
      where: { 
        result: 'success',
        levelAfter: { [sequelize.Op.gt]: 10 } // Only show high-level enhancements
      },
      order: [['levelAfter', 'DESC']],
      limit,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'role']
        },
        {
          model: sequelize.models.Weapon,
          as: 'weapon',
          attributes: ['id', 'name', 'level', 'isHidden']
        }
      ]
    });
  };

  // Get user's highest enhancement level
  EnhancementAttempt.getUserHighestLevel = async function(userId) {
    const result = await this.findOne({
      where: { 
        userId,
        result: 'success'
      },
      order: [['levelAfter', 'DESC']],
      attributes: [
        [sequelize.fn('MAX', sequelize.col('level_after')), 'highestLevel']
      ],
      raw: true
    });
    
    return result ? result.highestLevel || 0 : 0;
  };

  // Get total gold spent by user
  EnhancementAttempt.getTotalGoldSpent = async function(userId) {
    const result = await this.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('gold_spent')), 'totalGoldSpent']
      ],
      raw: true
    });
    
    return parseInt(result?.totalGoldSpent || 0, 10);
  };

  EnhancementAttempt.associate = (models) => {
    EnhancementAttempt.belongsTo(models.User, { foreignKey: 'userId' });
    EnhancementAttempt.belongsTo(models.Weapon, { foreignKey: 'weaponId' });
  };

  return EnhancementAttempt;
};
