const { DataTypes } = require("sequelize");
const { mainDatabase } = require("../../config/mainDatabase");

const LoginOTP = mainDatabase.define(
  "LoginOTP",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    otpHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "login_otps",
    timestamps: true,
  }
);

module.exports = LoginOTP;