const { DataTypes } = require("sequelize");

const defineInPatientModel = (sequelize) => {
  return sequelize.define(
    "InPatient",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },

      visitNumber: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("ADMITTED", "DISCHARGED"),
        allowNull: false,
        defaultValue: "ADMITTED",
      },

      admissionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      roomNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      bedNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      admittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      dischargedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      dischargeNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "inpatients",
      timestamps: true,
      indexes: [
        { fields: ["status", "admittedAt"] },
        { fields: ["patientId", "status"] },
      ],
    }
  );
};

module.exports = defineInPatientModel;