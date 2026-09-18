const { Sequelize } = require("sequelize");
const definePatientModel = require("../../models/tenant/Patient");
const defineInPatientModel = require("../../models/tenant/InPatient");
const { Hospital } = require("../../models/main");

require("dotenv").config();

const migrateTenantDatabases = async () => {
  const hospitals = await Hospital.findAll({ where: { status: "ACTIVE" } });

  for (const hospital of hospitals) {
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

      // Do not use sync({ alter: true }) here. Repeated Sequelize ALTER operations
      // can keep adding MySQL indexes until the 64-key limit is reached.
      const [statusColumn] = await tenantDatabase.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'patients'
           AND COLUMN_NAME = 'status'`
      );

      if (statusColumn.length === 0) {
        await tenantDatabase.query(
          `ALTER TABLE patients
           ADD COLUMN status ENUM('REGISTERED', 'CHECKUP', 'INPATIENT', 'DISCHARGED')
           NOT NULL DEFAULT 'REGISTERED' AFTER purposeOfVisit`
        );
      }

      // Creates only missing tables; it does not alter existing tables or indexes.
      await InPatient.sync();
      console.log(`Tenant tables synchronized for: ${hospital.databaseName}`);
    } finally {
      await tenantDatabase.close();
    }
  }
};

module.exports = { migrateTenantDatabases };