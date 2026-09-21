const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const definePatientModel = require("../models/tenant/Patient");
const defineInPatientModel = require("../models/tenant/InPatient");
const defineDischargedPatientModel = require("../models/tenant/DischargedPatient");
const { Hospital, UserHospital } = require("../models/main");

require("dotenv").config();

const getInPatientContext = async (userId) => {
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
    InPatient: defineInPatientModel(tenantDatabase),
    DischargedPatient: defineDischargedPatientModel(tenantDatabase),
    tenantDatabase,
  };
};

const getInPatients = async (req, res) => {
  let tenantDatabase = null;

  try {
    const status = req.query.status || "ADMITTED";
    if (!["ADMITTED", "DISCHARGED", "ALL"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid inpatient status" });
    }

    const { Patient, InPatient, tenantDatabase: db } = await getInPatientContext(
      req.user.userId
    );
    tenantDatabase = db;

    const where = status === "ALL" ? {} : { status };
    const inPatients = await InPatient.findAll({
      where,
      order: [["admittedAt", "DESC"]],
    });
    const patientIds = inPatients.map((inPatient) => inPatient.patientId);
    const patients = patientIds.length
      ? await Patient.findAll({ where: { id: { [Op.in]: patientIds } } })
      : [];
    const patientsById = new Map(patients.map((patient) => [patient.id, patient]));

    const results = inPatients.map((inPatient) => ({
      ...inPatient.toJSON(),
      patient: patientsById.get(inPatient.patientId) || null,
    }));

    await tenantDatabase.close();
    return res.status(200).json({ success: true, count: results.length, inPatients: results });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Get inpatients error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch inpatients" });
  }
};

const dischargeInPatient = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { dischargeNotes } = req.body;
    const { Patient, InPatient, DischargedPatient, tenantDatabase: db } = await getInPatientContext(
      req.user.userId
    );
    tenantDatabase = db;
    const inPatient = await InPatient.findByPk(req.params.id);

    if (!inPatient) {
      await tenantDatabase.close();
      return res.status(404).json({ success: false, message: "Inpatient record not found" });
    }
    if (inPatient.status === "DISCHARGED") {
      await tenantDatabase.close();
      return res.status(400).json({ success: false, message: "Patient is already discharged" });
    }

    const transaction = await tenantDatabase.transaction();
    try {
      await inPatient.update(
        { status: "DISCHARGED", dischargedAt: new Date(), dischargeNotes: dischargeNotes || null },
        { transaction }
      );
      await DischargedPatient.create(
        {
          patientId: inPatient.patientId,
          inPatientId: inPatient.id,
          visitNumber: inPatient.visitNumber,
          admittedAt: inPatient.admittedAt,
          dischargedAt: inPatient.dischargedAt,
          dischargeNotes: inPatient.dischargeNotes,
        },
        { transaction }
      );
      await Patient.update(
        { status: "DISCHARGED" },
        { where: { id: inPatient.patientId }, transaction }
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await tenantDatabase.close();
    return res.status(200).json({ success: true, message: "Patient discharged successfully", inPatient });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Discharge inpatient error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to discharge patient" });
  }
};

module.exports = { getInPatients, dischargeInPatient };