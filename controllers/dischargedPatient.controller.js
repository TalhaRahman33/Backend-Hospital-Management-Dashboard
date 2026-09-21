const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const definePatientModel = require("../models/tenant/Patient");
const defineDischargedPatientModel = require("../models/tenant/DischargedPatient");
const { Hospital, UserHospital } = require("../models/main");

require("dotenv").config();

const getDischargedPatientContext = async (userId) => {
  const assignment = await UserHospital.findOne({
    where: { userId, isActive: true },
    include: [{ model: Hospital, as: "hospital" }],
  });

  if (!assignment || !assignment.hospital) {
    throw new Error("User not assigned to any hospital");
  }

  const tenantDatabase = new Sequelize(
    assignment.hospital.databaseName,
    process.env.MAIN_DB_USER,
    process.env.MAIN_DB_PASSWORD,
    {
      host: process.env.MAIN_DB_HOST,
      port: process.env.MAIN_DB_PORT,
      dialect: "mysql",
      logging: false,
    }
  );

  await tenantDatabase.authenticate();
  return {
    Patient: definePatientModel(tenantDatabase),
    DischargedPatient: defineDischargedPatientModel(tenantDatabase),
    tenantDatabase,
  };
};

const getDischargedPatients = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { Patient, DischargedPatient, tenantDatabase: db } =
      await getDischargedPatientContext(req.user.userId);
    tenantDatabase = db;

    const dischargedPatients = await DischargedPatient.findAll({
      order: [["dischargedAt", "DESC"]],
    });
    const patientIds = dischargedPatients.map((record) => record.patientId);
    const patients = patientIds.length
      ? await Patient.findAll({ where: { id: { [Op.in]: patientIds } } })
      : [];
    const patientsById = new Map(patients.map((patient) => [patient.id, patient]));

    const results = dischargedPatients.map((record) => ({
      ...record.toJSON(),
      patient: patientsById.get(record.patientId) || null,
    }));

    await tenantDatabase.close();
    return res.status(200).json({
      success: true,
      count: results.length,
      dischargedPatients: results,
    });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Get discharged patients error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch discharged patients",
    });
  }
};

module.exports = { getDischargedPatients };