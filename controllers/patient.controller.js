const { tenantDatabase } = require("../config/tenantDatabase");
const definePatientModel = require("../models/tenant/Patient");

const Patient = definePatientModel(tenantDatabase);

const generateVisitNumber = async () => {
  let visitNumber;
  let exists = true;

  while (exists) {
    visitNumber = String(Math.floor(10000000 + Math.random() * 90000000));

    const patient = await Patient.findOne({
      where: { visitNumber },
    });

    exists = Boolean(patient);
  }

  return visitNumber;
};

// =====================================================
// CREATE PATIENT
// POST /api/patients
// =====================================================

const createPatient = async (req, res) => {
  try {
    const {
      name,
      cnic,
      gender,
      purposeOfVisit,
    } = req.body;

    if (!name || !cnic || !gender || !purposeOfVisit) {
      return res.status(400).json({
        success: false,
        message:
          "name, cnic, gender and purposeOfVisit are required",
      });
    }

    const visitNumber = await generateVisitNumber();

    const patient = await Patient.create({
      visitNumber,
      name,
      cnic,
      gender,
      purposeOfVisit,
    });

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    console.error("Create patient error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
    });
  }
};

// =====================================================
// GET ALL PATIENTS
// GET /api/patients
// =====================================================

const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Get patients error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get patients",
    });
  }
};

// =====================================================
// GET PATIENT BY ID
// GET /api/patients/:id
// =====================================================

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id);

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
    console.error("Get patient by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get patient",
    });
  }
};

// =====================================================
// GET PATIENT BY VISIT NUMBER
// GET /api/patients/visit/:visitNumber
// =====================================================

const getPatientByVisitNumber = async (req, res) => {
  try {
    const { visitNumber } = req.params;

    const patient = await Patient.findOne({
      where: { visitNumber },
    });

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
    console.error("Get patient by visit number error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get patient",
    });
  }
};

// =====================================================
// UPDATE PATIENT
// PUT /api/patients/:id
// =====================================================

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      cnic,
      gender,
      purposeOfVisit,
    } = req.body;

    const patient = await Patient.findByPk(id);

    if (!patient) {
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

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    console.error("Update patient error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
};

// =====================================================
// DELETE PATIENT
// DELETE /api/patients/:id
// =====================================================

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    await patient.destroy();

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Delete patient error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete patient",
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
