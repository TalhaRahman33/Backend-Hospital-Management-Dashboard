const { DataTypes } = require("sequelize");

const defineDischargedPatientModel = (sequelize) => {
  return sequelize.define(
    "DischargedPatient",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      inPatientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      visitNumber: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },

      admittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      dischargedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      dischargeNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "dischargedpatients",
      timestamps: true,
      indexes: [
        { fields: ["patientId"] },
        { fields: ["dischargedAt"] },
        { fields: ["visitNumber"] },
      ],
    }
  );
};

module.exports = defineDischargedPatientModel;