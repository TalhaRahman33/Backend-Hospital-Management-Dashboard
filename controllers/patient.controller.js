const { Sequelize } = require("sequelize");
const definePatientModel = require("../models/tenant/Patient");
const { Hospital, UserHospital } = require("../models/main");

require("dotenv").config();

// Function to get hospital database connection
const getHospitalDatabase = async (hospitalId) => {
  try {
    const hospital = await Hospital.findByPk(hospitalId);

    if (!hospital) {
      throw new Error("Hospital not found");
    }

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

    return tenantDatabase;
  } catch (error) {
    console.error("Failed to connect to hospital database:", error);
    throw error;
  }
};

// Function to get patient model for a hospital
const getPatientModel = async (hospitalId) => {
  const tenantDatabase = await getHospitalDatabase(hospitalId);
  const Patient = definePatientModel(tenantDatabase);
  return { Patient, tenantDatabase };
};

// Function to get user's hospital ID
const getUserHospitalId = async (userId) => {
  const userHospital = await UserHospital.findOne({
    where: {
      userId,
      isActive: true,
    },
  });

  if (!userHospital) {
    throw new Error("User not assigned to any hospital");
  }

  return userHospital.hospitalId;
};

const generateVisitNumber = async (hospitalId) => {
  const { Patient, tenantDatabase } = await getPatientModel(hospitalId);
  let visitNumber;
  let exists = true;

  while (exists) {
    visitNumber = String(Math.floor(10000000 + Math.random() * 90000000));

    const patient = await Patient.findOne({
      where: { visitNumber },
    });

    exists = Boolean(patient);
  }

  await tenantDatabase.close();
  return visitNumber;
};

// =====================================================
// CREATE PATIENT
// POST /api/patients
// =====================================================

const createPatient = async (req, res) => {
  let tenantDatabase = null;

  try {
    const {
      name,
      cnic,
      gender,
      purposeOfVisit,
    } = req.body;

    // Validate input
    if (!name || !cnic || !gender || !purposeOfVisit) {
      return res.status(400).json({
        success: false,
        message: "name, cnic, gender and purposeOfVisit are required",
      });
    }

    // Get user's hospital
    const hospitalId = await getUserHospitalId(req.user.userId);

    // Get database connection
    const { Patient, tenantDatabase: db } = await getPatientModel(hospitalId);
    tenantDatabase = db;

    // Generate visit number
    const visitNumber = await generateVisitNumber(hospitalId);

    // Create patient
    const patient = await Patient.create({
      visitNumber,
      name,
      cnic,
      gender,
      purposeOfVisit,
    });

    await tenantDatabase.close();

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Create patient error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create patient",
    });
  }
};

// =====================================================
// GET ALL PATIENTS
// GET /api/patients
// =====================================================

const getAllPatients = async (req, res) => {
  let tenantDatabase = null;

  try {
    // Get user's hospital
    const hospitalId = await getUserHospitalId(req.user.userId);

    // Get database connection
    const { Patient, tenantDatabase: db } = await getPatientModel(hospitalId);
    tenantDatabase = db;

    const patients = await Patient.findAll({
      order: [["createdAt", "DESC"]],
    });

    await tenantDatabase.close();

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Get patients error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get patients",
    });
  }
};

// =====================================================
// GET PATIENT BY ID
// GET /api/patients/:id
// =====================================================

const getPatientById = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { id } = req.params;

    // Get user's hospital
    const hospitalId = await getUserHospitalId(req.user.userId);

    // Get database connection
    const { Patient, tenantDatabase: db } = await getPatientModel(hospitalId);
    tenantDatabase = db;

    const patient = await Patient.findByPk(id);

    await tenantDatabase.close();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Get patient by id error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get patient",
    });
  }
};

// =====================================================
// GET PATIENT BY VISIT NUMBER
// GET /api/patients/visit/:visitNumber
// =====================================================

const getPatientByVisitNumber = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { visitNumber } = req.params;

    // Get user's hospital
    const hospitalId = await getUserHospitalId(req.user.userId);

    // Get database connection
    const { Patient, tenantDatabase: db } = await getPatientModel(hospitalId);
    tenantDatabase = db;

    const patient = await Patient.findOne({
      where: { visitNumber },
    });

    await tenantDatabase.close();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Get patient by visit number error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get patient",
    });
  }
};

// =====================================================
// UPDATE PATIENT
// PUT /api/patients/:id
// =====================================================

const updatePatient = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { id } = req.params;
    const {
      name,
      cnic,
      gender,
      purposeOfVisit,
    } = req.body;

    // Get user's hospital
    const hospitalId = await getUserHospitalId(req.user.userId);

    // Get database connection
    const { Patient, tenantDatabase: db } = await getPatientModel(hospitalId);
    tenantDatabase = db;

    const patient = await Patient.findByPk(id);

    if (!patient) {
      await tenantDatabase.close();
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    await patient.update({
      name: name ?? patient.name,
      cnic: cnic ?? patient.cnic,
      gender: gender ?? patient.gender,
      purposeOfVisit: purposeOfVisit ?? patient.purposeOfVisit,
    });

    await tenantDatabase.close();

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Update patient error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update patient",
    });
  }
};

// =====================================================
// DELETE PATIENT
// DELETE /api/patients/:id
// =====================================================

const deletePatient = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { id } = req.params;

    // Get user's hospital
    const hospitalId = await getUserHospitalId(req.user.userId);

    // Get database connection
    const { Patient, tenantDatabase: db } = await getPatientModel(hospitalId);
    tenantDatabase = db;

    const patient = await Patient.findByPk(id);

    if (!patient) {
      await tenantDatabase.close();
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    await patient.destroy();

    await tenantDatabase.close();

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Delete patient error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete patient",
    });
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  getPatientByVisitNumber,
  updatePatient,
  deletePatient,
};
