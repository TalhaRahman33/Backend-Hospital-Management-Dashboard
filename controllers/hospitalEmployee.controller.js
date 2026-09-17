const { Hospital, UserHospital } = require("../models/main");
const defineHospitalEmployeeModel = require("../models/tenant/HospitalEmployee");
const { Sequelize } = require("sequelize");

const getHospitalDatabase = async (hospitalId) => {
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

  return { tenantDatabase, hospital };
};

const getUserHospitalContext = async (userId) => {
  const userHospital = await UserHospital.findOne({
    where: {
      userId,
      isActive: true,
    },
    include: [
      {
        model: Hospital,
        as: "hospital",
      },
    ],
  });

  if (!userHospital) {
    throw new Error("User not assigned to any hospital");
  }

  return userHospital.hospital;
};

const getEmployeeModel = async (hospitalId) => {
  const { tenantDatabase } = await getHospitalDatabase(hospitalId);
  defineHospitalEmployeeModel(tenantDatabase);
  const HospitalEmployee = tenantDatabase.model("HospitalEmployee");
  return { HospitalEmployee, tenantDatabase };
};

const createHospitalEmployee = async (req, res) => {
  let tenantDatabase = null;

  try {
    const hospital = await getUserHospitalContext(req.user.userId);

    const {
      employeeName,
      designation,
      department,
      qualification,
      pmcNo,
      contactNo,
      status,
    } = req.body;

    if (
      !employeeName ||
      !designation ||
      !department ||
      !qualification ||
      !pmcNo ||
      !contactNo
    ) {
      return res.status(400).json({
        success: false,
        message:
          "employeeName, designation, department, qualification, pmcNo, and contactNo are required",
      });
    }

    const { HospitalEmployee, tenantDatabase: db } = await getEmployeeModel(hospital.id);
    tenantDatabase = db;

    const employee = await HospitalEmployee.create({
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      employeeName,
      designation,
      department,
      qualification,
      pmcNo,
      contactNo,
      status: status || "ACTIVE",
    });

    await tenantDatabase.close();

    return res.status(201).json({
      success: true,
      message: "Hospital employee created successfully",
      employee,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Create hospital employee error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create hospital employee",
    });
  }
};

const getHospitalEmployees = async (req, res) => {
  let tenantDatabase = null;

  try {
    const hospital = await getUserHospitalContext(req.user.userId);
    const { HospitalEmployee, tenantDatabase: db } = await getEmployeeModel(hospital.id);
    tenantDatabase = db;

    const employees = await HospitalEmployee.findAll({
      order: [["createdAt", "DESC"]],
    });

    await tenantDatabase.close();

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Get hospital employees error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch hospital employees",
    });
  }
};

const getHospitalEmployeeById = async (req, res) => {
  let tenantDatabase = null;

  try {
    const hospital = await getUserHospitalContext(req.user.userId);
    const { HospitalEmployee, tenantDatabase: db } = await getEmployeeModel(hospital.id);
    tenantDatabase = db;

    const employee = await HospitalEmployee.findByPk(req.params.id);

    await tenantDatabase.close();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Hospital employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Get hospital employee by id error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch hospital employee",
    });
  }
};

const updateHospitalEmployee = async (req, res) => {
  let tenantDatabase = null;

  try {
    const hospital = await getUserHospitalContext(req.user.userId);
    const { HospitalEmployee, tenantDatabase: db } = await getEmployeeModel(hospital.id);
    tenantDatabase = db;

    const employee = await HospitalEmployee.findByPk(req.params.id);

    if (!employee) {
      await tenantDatabase.close();
      return res.status(404).json({
        success: false,
        message: "Hospital employee not found",
      });
    }

    const updatableFields = [
      "employeeName",
      "designation",
      "department",
      "qualification",
      "pmcNo",
      "contactNo",
      "status",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    });

    if (req.body.hospitalName) {
      employee.hospitalName = req.body.hospitalName;
    }

    await employee.save();
    await tenantDatabase.close();

    return res.status(200).json({
      success: true,
      message: "Hospital employee updated successfully",
      employee,
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Update hospital employee error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update hospital employee",
    });
  }
};

const deleteHospitalEmployee = async (req, res) => {
  let tenantDatabase = null;

  try {
    const hospital = await getUserHospitalContext(req.user.userId);
    const { HospitalEmployee, tenantDatabase: db } = await getEmployeeModel(hospital.id);
    tenantDatabase = db;

    const employee = await HospitalEmployee.findByPk(req.params.id);

    if (!employee) {
      await tenantDatabase.close();
      return res.status(404).json({
        success: false,
        message: "Hospital employee not found",
      });
    }

    await employee.destroy();
    await tenantDatabase.close();

    return res.status(200).json({
      success: true,
      message: "Hospital employee deleted successfully",
    });
  } catch (error) {
    if (tenantDatabase) {
      await tenantDatabase.close().catch(() => {});
    }

    console.error("Delete hospital employee error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete hospital employee",
    });
  }
};

module.exports = {
  createHospitalEmployee,
  getHospitalEmployees,
  getHospitalEmployeeById,
  updateHospitalEmployee,
  deleteHospitalEmployee,
};
