const { Sequelize } = require('sequelize');
const User = require('./User');
const Weapon = require('./Weapon');
const EnhancementAttempt = require('./EnhancementAttempt');

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
  sequelize,
  Sequelize
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
