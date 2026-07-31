const { Sequelize } = require("sequelize");
const definePatientModel = require("../../models/tenant/Patient");

require("dotenv").config();

const createHospitalDatabase = async (databaseName) => {
  let adminConnection;

  try {
    // --------------------------------
    // 1. Connect to MySQL server
    // --------------------------------

    adminConnection = new Sequelize(
      "",
      process.env.MAIN_DB_USER,
      process.env.MAIN_DB_PASSWORD,
      {
        host: process.env.MAIN_DB_HOST,
        port: process.env.MAIN_DB_PORT,
        dialect: "mysql",
        logging: false,
      }
    );

    await adminConnection.authenticate();

    // --------------------------------
    // 2. Create database
    // --------------------------------

    await adminConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\``
    );

    console.log(
      `Database created: ${databaseName}`
    );

    await adminConnection.close();

    // --------------------------------
    // 3. Connect to new database
    // --------------------------------

    const tenantDatabase = new Sequelize(
      databaseName,
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

    // --------------------------------
    // 4. Register tenant models
    // --------------------------------

    definePatientModel(tenantDatabase);

    // --------------------------------
    // 5. Create tenant tables
    // --------------------------------

    await tenantDatabase.sync();

    console.log(
      `Tenant tables created for: ${databaseName}`
    );

    await tenantDatabase.close();

    return true;
  } catch (error) {
    if (adminConnection) {
      await adminConnection.close().catch(() => {});
    }

    console.error(
      "Hospital database creation failed:",
      error.message
    );

    throw error;
  }
};

module.exports = {
  createHospitalDatabase,
};