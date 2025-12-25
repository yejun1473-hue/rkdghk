const { Sequelize } = require('sequelize');
const User = require('./User');
const Weapon = require('./Weapon');
const EnhancementAttempt = require('./EnhancementAttempt');
const Battle = require('./Battle');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sword_enhancement', {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false
  }
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
