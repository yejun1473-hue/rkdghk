const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Weapon = sequelize.define('Weapon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 20
      }
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_hidden'
    },
    baseName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'base_name'
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      field: 'image_url'
    }
  }, {
    tableName: 'weapons',
    timestamps: true,
    underscored: true,
    getterMethods: {
      fullName() {
        return `${this.name} +${this.level}`;
      },
      sellPrice() {
        const basePrices = [
          10, 30, 90, 250, 1000, 2500, 10000, 25000, 37500, 85500,
          100000, 300000, 500500, 1600500, 2750000, 4050500, 6500500, 10973000, 50082000, 1000000000
        ];
        const price = this.level > 0 ? basePrices[this.level - 1] : 0;
        return this.isHidden ? price * 4 : price;
      }
    }
  });

  Weapon.associate = (models) => {
    Weapon.belongsTo(models.User, { foreignKey: 'userId' });
    Weapon.hasMany(models.EnhancementAttempt, { foreignKey: 'weaponId' });
  };

  return Weapon;
};
