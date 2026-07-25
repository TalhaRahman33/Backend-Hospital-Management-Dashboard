const { DataTypes } = require("sequelize");
const { mainDatabase } = require("../../config/mainDatabase");

const UserHospital = mainDatabase.define(
  "UserHospital",
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

    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    unassignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "user_hospitals",
    timestamps: true,
  }
);

module.exports = UserHospital;