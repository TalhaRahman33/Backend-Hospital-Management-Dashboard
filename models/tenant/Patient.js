const { DataTypes } = require("sequelize");

const definePatientModel = (sequelize) => {
  return sequelize.define(
    "Patient",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
    },
    {
      tableName: "patients",
      timestamps: true,
    }
  );
};

module.exports = definePatientModel;