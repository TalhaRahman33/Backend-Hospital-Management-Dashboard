const { DataTypes } = require("sequelize");
const { mainDatabase } = require("../../config/mainDatabase");

const Role = mainDatabase.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.ENUM(
        "SUPER_ADMIN",
        "PMO",
        "DMO",
        "HFO",
        "DOCTOR"
      ),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "roles",
    timestamps: true,
  }
);

module.exports = Role;