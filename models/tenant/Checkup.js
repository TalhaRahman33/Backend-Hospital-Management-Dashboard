const { DataTypes } = require("sequelize");

const defineCheckupModel = (sequelize) => {
  return sequelize.define(
    "Checkup",
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

      visitNumber: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "WAITING",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED"
        ),
        allowNull: false,
        defaultValue: "WAITING",
      },

      doctorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      symptoms: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      diagnosis: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      prescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "checkups",
      timestamps: true,
      indexes: [
        { fields: ["patientId", "status"] },
        { fields: ["status", "createdAt"] },
      ],
    }
  );
};

module.exports = defineCheckupModel;