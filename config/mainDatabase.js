const { Sequelize } = require("sequelize");
require("dotenv").config();

const mainDatabase = new Sequelize(
  process.env.MAIN_DB_NAME,
  process.env.MAIN_DB_USER,
  process.env.MAIN_DB_PASSWORD,
  {
    host: process.env.MAIN_DB_HOST,
    port: process.env.MAIN_DB_PORT,
    dialect: "mysql",
    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectMainDatabase = async () => {
  try {
    await mainDatabase.authenticate();

    console.log("Main database connected successfully");
  } catch (error) {
    console.error("Main database connection failed:", error.message);

    process.exit(1);
  }
};

module.exports = {
  mainDatabase,
  connectMainDatabase,
};