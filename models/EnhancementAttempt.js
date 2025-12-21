const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnhancementAttempt = sequelize.define('EnhancementAttempt', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      }
    ]
  });

  EnhancementAttempt.associate = (models) => {
    EnhancementAttempt.belongsTo(models.User, { foreignKey: 'userId' });
    EnhancementAttempt.belongsTo(models.Weapon, { foreignKey: 'weaponId' });
  };

  return EnhancementAttempt;
};
