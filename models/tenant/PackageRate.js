const { DataTypes } = require("sequelize");

const definePackageRateModel = (sequelize) => {
  return sequelize.define(
    "PackageRate",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      lineOfTreatment: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      treatment: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
    },
    {
      tableName: "package_rates",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["lineOfTreatment", "treatment"],
        },
      ],
    }
  );
};

module.exports = definePackageRateModel;