const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Currency = sequelize.define('Currency', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    gold: {
      type: DataTypes.BIGINT,
      defaultValue: 10000, // Starting gold: 10,000G
      allowNull: false
    },
    choco: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Starting choco: 0C
      allowNull: false
    },
    money: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Starting money: 0M
      allowNull: false
    }
  }, {
    tableName: 'currencies',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id']
      }
    ]
  });

  // Class methods
  Currency.associate = (models) => {
    Currency.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  // Instance methods
  Currency.prototype.addGold = async function(amount) {
    if (amount < 0 && this.gold < Math.abs(amount)) {
      throw new Error('Insufficient gold');
    }
    this.gold += amount;
    return this.save();
  };

  Currency.prototype.addChoco = async function(amount) {
    if (amount < 0 && this.choco < Math.abs(amount)) {
      throw new Error('Insufficient choco');
    }
    this.choco += amount;
    return this.save();
  };

  Currency.prototype.addMoney = async function(amount) {
    if (amount < 0 && this.money < Math.abs(amount)) {
      throw new Error('Insufficient money');
    }
    this.money += amount;
    return this.save();
  };

  // Convert between currencies
  Currency.convertGoldToChoco = async function(userId, goldAmount) {
    const currency = await this.findOne({ where: { userId } });
    if (!currency) {
      throw new Error('Currency account not found');
    }
    
    const chocoAmount = Math.floor(goldAmount / 120000);
    if (chocoAmount < 1) {
      throw new Error('Minimum conversion is 120,000G to 1C');
    }
    
    const goldNeeded = chocoAmount * 120000;
    if (currency.gold < goldNeeded) {
      throw new Error('Not enough gold for conversion');
    }
    
    await currency.addGold(-goldNeeded);
    await currency.addChoco(chocoAmount);
    
    return {
      gold: currency.gold,
      choco: currency.choco,
      money: currency.money
    };
  };

  Currency.convertChocoToMoney = async function(userId, chocoAmount) {
    const currency = await this.findOne({ where: { userId } });
    if (!currency) {
      throw new Error('Currency account not found');
    }
    
    if (currency.choco < chocoAmount) {
      throw new Error('Not enough choco');
    }
    
    const moneyAmount = Math.floor(chocoAmount / 120);
    if (moneyAmount < 1) {
      throw new Error('Minimum conversion is 120C to 1M');
    }
    
    const chocoNeeded = moneyAmount * 120;
    
    await currency.addChoco(-chocoNeeded);
    await currency.addMoney(moneyAmount);
    
    return {
      gold: currency.gold,
      choco: currency.choco,
      money: currency.money
    };
  };

  return Currency;
};
