const { Hospital } = require("../models/main");

const {
  createHospitalDatabase,
} = require("../services/hospital/createHospitalDatabase.service");

// =====================================================
// CREATE HOSPITAL
// POST /api/hospitals
// =====================================================

const createHospital = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      city,
      phone,
      email,
    } = req.body;

    if (!name || !code || !address || !city) {
      return res.status(400).json({
        success: false,
        message: "Name, code, address and city are required",
      });
    }

    const existingHospital = await Hospital.findOne({
      where: { code },
    });

    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: "Hospital code already exists",
      });
    }

    const databaseName = `hospital_${code}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");

    await createHospitalDatabase(databaseName);

    const hospital = await Hospital.create({
      name,
      code,
      address,
      city,
      phone: phone || null,
      email: email || null,
      databaseName,
      status: "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      hospital,
    });
  } catch (error) {
    console.error("Create hospital error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create hospital",
    });
  }
};

// =====================================================
// GET ALL HOSPITALS
// GET /api/hospitals
// =====================================================

const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error("Get hospitals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get hospitals",
    });
  }
};

// =====================================================
// GET SINGLE HOSPITAL
// GET /api/hospitals/:id
// =====================================================

const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findByPk(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.status(200).json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error("Get hospital error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get hospital",
    });
  }
};

// =====================================================
// UPDATE HOSPITAL
// PUT /api/hospitals/:id
// =====================================================

const updateHospital = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      code,
      address,
      city,
      phone,
      email,
      status,
    } = req.body;

    const hospital = await Hospital.findByPk(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // If code is being changed
    if (code && code !== hospital.code) {
      const existingHospital = await Hospital.findOne({
        where: { code },
      });

      if (existingHospital) {
        return res.status(409).json({
          success: false,
          message: "Hospital code already exists",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "Hospital code cannot be changed because it is linked to the tenant database",
      });
    }

    await hospital.update({
      name: name ?? hospital.name,
      address: address ?? hospital.address,
      city: city ?? hospital.city,
      phone: phone ?? hospital.phone,
      email: email ?? hospital.email,
      status: status ?? hospital.status,
    });

    return res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
      hospital,
    });
  } catch (error) {
    console.error("Update hospital error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update hospital",
    });
  }
};

// =====================================================
// DELETE HOSPITAL
// DELETE /api/hospitals/:id
// =====================================================

const deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findByPk(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    /*
     * IMPORTANT:
     *
     * We are NOT deleting the tenant database.
     *
     * Only the hospital record in the main DB
     * is deleted.
     */

    await hospital.destroy();

    return res.status(200).json({
      success: true,
      message: "Hospital deleted successfully",
    });
  } catch (error) {
    console.error("Delete hospital error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete hospital",
    });
  }
};

module.exports = {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
};