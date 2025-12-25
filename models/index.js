const { Sequelize } = require('sequelize');
const User = require('./User');
const Weapon = require('./Weapon');
const EnhancementAttempt = require('./EnhancementAttempt');
const Battle = require('./Battle');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

const models = {
  User: User(sequelize),
  Weapon: Weapon(sequelize),
  EnhancementAttempt: EnhancementAttempt(sequelize),
  Battle: Battle(sequelize),
  sequelize,
  Sequelize
};

// Set up associations
models.User.hasMany(models.Weapon, { foreignKey: 'userId' });
models.Weapon.belongsTo(models.User, { foreignKey: 'userId' });

models.User.hasMany(models.EnhancementAttempt, { foreignKey: 'userId' });
models.EnhancementAttempt.belongsTo(models.User, { foreignKey: 'userId' });

// Battle associations
models.User.hasMany(models.Battle, { as: 'battlesAsPlayer1', foreignKey: 'player1Id' });
models.User.hasMany(models.Battle, { as: 'battlesAsPlayer2', foreignKey: 'player2Id' });
models.User.hasMany(models.Battle, { as: 'battlesWon', foreignKey: 'winnerId' });

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
