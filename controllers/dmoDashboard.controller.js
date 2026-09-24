const { Sequelize } = require("sequelize");
const definePatientModel = require("../models/tenant/Patient");
const defineInPatientModel = require("../models/tenant/InPatient");
const defineDischargedPatientModel = require("../models/tenant/DischargedPatient");
const { Hospital, UserHospital } = require("../models/main");

require("dotenv").config();

const getTenantCounts = async (hospital) => {
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

  try {
    await tenantDatabase.authenticate();

    const Patient = definePatientModel(tenantDatabase);
    const InPatient = defineInPatientModel(tenantDatabase);
    const DischargedPatient = defineDischargedPatientModel(tenantDatabase);

    const [patients, inPatients, dischargedPatients] = await Promise.all([
      Patient.count(),
      InPatient.count({ where: { status: "ADMITTED" } }),
      DischargedPatient.count(),
    ]);

    return {
      patients,
      inPatients,
      dischargedPatients,
    };
  } finally {
    await tenantDatabase.close();
  }
};

const getAssignedHospitals = async (userId, hospitalId = null) => {
  const where = {
    userId,
    isActive: true,
  };

  if (hospitalId !== null) {
    where.hospitalId = hospitalId;
  }

  const assignments = await UserHospital.findAll({
    where,
    include: [
      {
        model: Hospital,
        as: "hospital",
        where: { status: "ACTIVE" },
        attributes: ["id", "name", "code", "city", "databaseName"],
      },
    ],
    order: [[{ model: Hospital, as: "hospital" }, "name", "ASC"]],
  });

  return assignments.map((assignment) => assignment.hospital);
};

const addCounts = async (hospital) => ({
  id: hospital.id,
  name: hospital.name,
  code: hospital.code,
  city: hospital.city,
  ...(await getTenantCounts(hospital)),
});

const getDmoDashboard = async (req, res) => {
  try {
    const hospitals = await getAssignedHospitals(req.user.userId);
    const hospitalSummaries = await Promise.all(hospitals.map(addCounts));

    const totals = hospitalSummaries.reduce(
      (summary, hospital) => ({
        patients: summary.patients + hospital.patients,
        inPatients: summary.inPatients + hospital.inPatients,
        dischargedPatients:
          summary.dischargedPatients + hospital.dischargedPatients,
      }),
      { patients: 0, inPatients: 0, dischargedPatients: 0 }
    );

    return res.status(200).json({
      success: true,
      totals,
      hospitals: hospitalSummaries,
    });
  } catch (error) {
    console.error("Get DMO dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load DMO dashboard",
    });
  }
};

const getDmoHospitalDashboard = async (req, res) => {
  try {
    const hospitalId = Number(req.params.hospitalId);

    if (!Number.isInteger(hospitalId) || hospitalId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID",
      });
    }

    const [hospital] = await getAssignedHospitals(req.user.userId, hospitalId);

    if (!hospital) {
      return res.status(403).json({
        success: false,
        message: "This hospital is not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      hospital: await addCounts(hospital),
    });
  } catch (error) {
    console.error("Get DMO hospital dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load hospital dashboard",
    });
  }
};

module.exports = { getDmoDashboard, getDmoHospitalDashboard };