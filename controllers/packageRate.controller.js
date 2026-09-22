const { Sequelize } = require("sequelize");
const { Hospital, UserHospital } = require("../models/main");
const definePackageRateModel = require("../models/tenant/PackageRate");

require("dotenv").config();

const getPackageRateContext = async (userId) => {
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
  const PackageRate = definePackageRateModel(tenantDatabase);

  return { PackageRate, tenantDatabase };
};

const validatePackageRateInput = ({ lineOfTreatment, treatment, price }) => {
  if (
    typeof lineOfTreatment !== "string" ||
    !lineOfTreatment.trim() ||
    typeof treatment !== "string" ||
    !treatment.trim() ||
    price === undefined ||
    price === null ||
    price === ""
  ) {
    return "lineOfTreatment, treatment, and price are required";
  }

  if (Number.isNaN(Number(price)) || Number(price) < 0) {
    return "price must be a non-negative number";
  }

  return null;
};

const createPackageRate = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { lineOfTreatment, treatment, price } = req.body;
    const validationError = validatePackageRateInput(req.body);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const context = await getPackageRateContext(req.user.userId);
    tenantDatabase = context.tenantDatabase;

    const packageRate = await context.PackageRate.create({
      lineOfTreatment: lineOfTreatment.trim(),
      treatment: treatment.trim(),
      price,
    });

    await tenantDatabase.close();
    return res.status(201).json({
      success: true,
      message: "Package rate created successfully",
      packageRate,
    });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Create package rate error:", error);
    return res.status(error.name === "SequelizeUniqueConstraintError" ? 409 : 500).json({
      success: false,
      message: error.name === "SequelizeUniqueConstraintError"
        ? "A package rate already exists for this treatment"
        : error.message || "Failed to create package rate",
    });
  }
};

const getPackageRates = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { PackageRate, tenantDatabase: db } = await getPackageRateContext(req.user.userId);
    tenantDatabase = db;
    const where = req.query.lineOfTreatment
      ? { lineOfTreatment: req.query.lineOfTreatment }
      : undefined;
    const packageRates = await PackageRate.findAll({
      where,
      order: [["lineOfTreatment", "ASC"], ["treatment", "ASC"]],
    });

    await tenantDatabase.close();
    return res.status(200).json({ success: true, count: packageRates.length, packageRates });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Get package rates error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch package rates" });
  }
};

const getPackageRateById = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { PackageRate, tenantDatabase: db } = await getPackageRateContext(req.user.userId);
    tenantDatabase = db;
    const packageRate = await PackageRate.findByPk(req.params.id);

    await tenantDatabase.close();
    if (!packageRate) {
      return res.status(404).json({ success: false, message: "Package rate not found" });
    }

    return res.status(200).json({ success: true, packageRate });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Get package rate error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch package rate" });
  }
};

const updatePackageRate = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { PackageRate, tenantDatabase: db } = await getPackageRateContext(req.user.userId);
    tenantDatabase = db;
    const packageRate = await PackageRate.findByPk(req.params.id);

    if (!packageRate) {
      await tenantDatabase.close();
      return res.status(404).json({ success: false, message: "Package rate not found" });
    }

    const changes = ["lineOfTreatment", "treatment", "price"];
    changes.forEach((field) => {
      if (req.body[field] !== undefined) packageRate[field] = req.body[field];
    });

    const validationError = validatePackageRateInput(packageRate);
    if (validationError) {
      await tenantDatabase.close();
      return res.status(400).json({ success: false, message: validationError });
    }

    packageRate.lineOfTreatment = packageRate.lineOfTreatment.trim();
    packageRate.treatment = packageRate.treatment.trim();
    await packageRate.save();
    await tenantDatabase.close();

    return res.status(200).json({ success: true, message: "Package rate updated successfully", packageRate });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Update package rate error:", error);
    return res.status(error.name === "SequelizeUniqueConstraintError" ? 409 : 500).json({
      success: false,
      message: error.name === "SequelizeUniqueConstraintError"
        ? "A package rate already exists for this treatment"
        : error.message || "Failed to update package rate",
    });
  }
};

const deletePackageRate = async (req, res) => {
  let tenantDatabase = null;

  try {
    const { PackageRate, tenantDatabase: db } = await getPackageRateContext(req.user.userId);
    tenantDatabase = db;
    const packageRate = await PackageRate.findByPk(req.params.id);

    if (!packageRate) {
      await tenantDatabase.close();
      return res.status(404).json({ success: false, message: "Package rate not found" });
    }

    await packageRate.destroy();
    await tenantDatabase.close();
    return res.status(200).json({ success: true, message: "Package rate deleted successfully" });
  } catch (error) {
    if (tenantDatabase) await tenantDatabase.close().catch(() => {});
    console.error("Delete package rate error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete package rate" });
  }
};

module.exports = {
  createPackageRate,
  getPackageRates,
  getPackageRateById,
  updatePackageRate,
  deletePackageRate,
};