const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Battle = sequelize.define('Battle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    player1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      field: 'player1_id'
    },
    player2Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      field: 'player2_id'
    },
    winnerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      field: 'winner_id'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    battleLog: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('battleLog');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('battleLog', JSON.stringify(value));
      },
      field: 'battle_log'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'battles',
    timestamps: true,
    underscored: true
  });

  Battle.associate = (models) => {
    Battle.belongsTo(models.User, { as: 'player1', foreignKey: 'player1Id' });
    Battle.belongsTo(models.User, { as: 'player2', foreignKey: 'player2Id' });
    Battle.belongsTo(models.User, { as: 'winner', foreignKey: 'winnerId' });
  };

  return Battle;
};
