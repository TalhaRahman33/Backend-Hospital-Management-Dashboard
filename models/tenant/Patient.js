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

      visitNumber: {
        type: DataTypes.STRING(8),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[0-9]{8}$/,
        },
      },

      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      cnic: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      gender: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      purposeOfVisit: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "patients",
      timestamps: true,
    }
  );
};

module.exports = definePatientModel;