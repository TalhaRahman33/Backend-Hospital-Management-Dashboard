const { DataTypes } = require("sequelize");

const defineHospitalEmployeeModel = (sequelize) => {
  return sequelize.define(
    "HospitalEmployee",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      hospitalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      hospitalName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      employeeName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      designation: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      department: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      qualification: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      pmcNo: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      contactNo: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "ON_LEAVE"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
    },
    {
      tableName: "hospital_employees",
      timestamps: true,
    }
  );
};

module.exports = defineHospitalEmployeeModel;
