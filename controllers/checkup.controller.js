const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const definePatientModel = require("../models/tenant/Patient");
const defineCheckupModel = require("../models/tenant/Checkup");
const { Hospital, UserHospital } = require("../models/main");

require("dotenv").config();

const getUserHospital = async (userId) => {
  const assignment = await UserHospital.findOne({
    where: { userId, isActive: true },
    include: [{ model: Hospital, as: "hospital" }],
  });

  if (!assignment || !assignment.hospital) {
    throw new Error("User not assigned to any hospital");
  }

  return assignment.hospital;
};

const getCheckupContext = async (userId) => {
  const hospital = await getUserHospital(userId);
  const tenantDatabase = new Sequelize(
    hospital.databaseName,
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
  const Patient = definePatientModel(tenantDatabase);
  const Checkup = defineCheckupModel(tenantDatabase);
  await tenantDatabase.sync({ alter: true });

  return { Patient, Checkup, tenantDatabase };
};

const createCheckup = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { patientId, symptoms } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
      });
    }

    const { Patient, Checkup, tenantDatabase: db } = await getCheckupContext(
      req.user.userId
    );
    tenantDatabase = db;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      await tenantDatabase.close();
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const existingCheckup = await Checkup.findOne({
      where: {
        patientId,
        status: { [Op.in]: ["WAITING", "IN_PROGRESS"] },
      },
    });

    if (existingCheckup) {
      await tenantDatabase.close();
      return res.status(409).json({
        success: false,
        message: "Patient already has an active checkup",
        checkup: existingCheckup,
      });
    }

    const checkup = await Checkup.create({
      patientId: patient.id,
      visitNumber: patient.visitNumber,
      symptoms: symptoms || null,
      createdBy: req.user.userId,
    });

    await tenantDatabase.close();
    return res.status(201).json({
      success: true,
      message: "Patient added to checkup queue",
      checkup,
      patient,
    });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Create checkup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create checkup",
    });
  }
};

const getCheckups = async (req, res) => {
  let tenantDatabase = null;

  try {
    const status = req.query.status || "WAITING";
    const validStatuses = ["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid checkup status" });
    }

    const { Patient, Checkup, tenantDatabase: db } = await getCheckupContext(
      req.user.userId
    );
    tenantDatabase = db;
    const checkups = await Checkup.findAll({
      where: { status },
      order: [["createdAt", "ASC"]],
    });

    const patientIds = checkups.map((checkup) => checkup.patientId);
    const patients = patientIds.length
      ? await Patient.findAll({ where: { id: { [Op.in]: patientIds } } })
      : [];
    const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
    const results = checkups.map((checkup) => ({
      ...checkup.toJSON(),
      patient: patientsById.get(checkup.patientId) || null,
    }));

    await tenantDatabase.close();
    return res.status(200).json({ success: true, count: results.length, checkups: results });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Get checkups error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch checkups",
    });
  }
};

const getCheckupById = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { Patient, Checkup, tenantDatabase: db } = await getCheckupContext(
      req.user.userId
    );
    tenantDatabase = db;
    const checkup = await Checkup.findByPk(req.params.id);

    if (!checkup) {
      await tenantDatabase.close();
      return res.status(404).json({ success: false, message: "Checkup not found" });
    }

    const patient = await Patient.findByPk(checkup.patientId);
    await tenantDatabase.close();
    return res.status(200).json({ success: true, checkup, patient });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Get checkup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch checkup",
    });
  }
};

const updateCheckup = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { status, doctorId, symptoms, diagnosis, prescription, notes } = req.body;
    const { Checkup, tenantDatabase: db } = await getCheckupContext(req.user.userId);
    tenantDatabase = db;
    const checkup = await Checkup.findByPk(req.params.id);

    if (!checkup) {
      await tenantDatabase.close();
      return res.status(404).json({ success: false, message: "Checkup not found" });
    }

    const allowedTransitions = {
      WAITING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };
    const validStatuses = Object.keys(allowedTransitions);

    if (status && !validStatuses.includes(status)) {
      await tenantDatabase.close();
      return res.status(400).json({ success: false, message: "Invalid checkup status" });
    }

    if (status && status !== checkup.status && !allowedTransitions[checkup.status].includes(status)) {
      await tenantDatabase.close();
      return res.status(400).json({
        success: false,
        message: `Cannot change checkup status from ${checkup.status} to ${status}`,
      });
    }

    const changes = { doctorId, symptoms, diagnosis, prescription, notes };
    Object.keys(changes).forEach((field) => {
      if (changes[field] !== undefined) checkup[field] = changes[field];
    });

    if (status && status !== checkup.status) {
      checkup.status = status;
      if (status === "IN_PROGRESS") checkup.startedAt = new Date();
      if (status === "COMPLETED") checkup.completedAt = new Date();
    }

    await checkup.save();
    await tenantDatabase.close();
    return res.status(200).json({
      success: true,
      message: "Checkup updated successfully",
      checkup,
    });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Update checkup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update checkup",
    });
  }
};

module.exports = {
  createCheckup,
  getCheckups,
  getCheckupById,
  updateCheckup,
};