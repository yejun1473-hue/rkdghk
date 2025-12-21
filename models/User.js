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
    lastCheckIn: {
      type: DataTypes.DATE,
      field: 'last_check_in'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
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
