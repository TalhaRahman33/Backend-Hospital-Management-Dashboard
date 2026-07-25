const express = require("express");

const {
  mainDatabase,
  connectMainDatabase,
} = require("./config/mainDatabase");

// This loads the models and relationships
require("./models/main");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to database
    await connectMainDatabase();

    // 2. Create tables from Sequelize models
    await mainDatabase.sync();

    console.log("Main database tables synchronized successfully");

    // 3. Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
  }
};

startServer();