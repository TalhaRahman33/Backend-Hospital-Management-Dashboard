const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const {
  mainDatabase,
  connectMainDatabase,
} = require("./config/mainDatabase");


// Load Models
require("./models/main");


// Routes
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const hospitalRoutes = require("./routes/hospital.routes");
const patientRoutes = require("./routes/patient.routes");
const hospitalEmployeeRoutes = require("./routes/hospitalEmployee.routes");
const checkupRoutes = require("./routes/checkup.routes");
const inPatientRoutes = require("./routes/inPatient.routes");
const dischargedPatientRoutes = require("./routes/dischargedPatient.routes");
const authMiddleware = require("./middleware/auth.middleware");
const { migrateTenantDatabases } = require("./services/hospital/migrateTenantDatabases.service");


const app = express();


// =====================
// Middlewares
// =====================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);


app.use(express.json());


app.use(
  express.urlencoded({
    extended: true,
  })
);


app.use(cookieParser());



// =====================
// Routes
// =====================

app.use(
  "/api/auth",
  authRoutes
);

app.use("/api", (req, res, next) => {
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/verify-otp",
    "/api/auth/resend-otp",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ];

  if (publicRoutes.includes(req.path)) {
    return next();
  }

  return authMiddleware(req, res, next);
});

app.use(
  "/api/users",
  userRoutes
);

app.use("/api/hospitals", hospitalRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/hospital-employees", hospitalEmployeeRoutes);
app.use("/api/checkups", checkupRoutes);
app.use("/api/inpatients", inPatientRoutes);
app.use("/api/discharged-patients", dischargedPatientRoutes);

// Health check

app.get("/", (req,res)=>{
  res.json({
    success:true,
    message:"Hospital Management API Running"
  });
});



// =====================
// Server Start
// =====================

const PORT = process.env.PORT || 5000;


const startServer = async () => {

  try {

    await connectMainDatabase();


    await mainDatabase.sync({
      alter:false
    });


    console.log(
      "Main database tables synchronized successfully"
    );

    await migrateTenantDatabases();


    app.listen(PORT,()=>{

      console.log(
        `Server running on port ${PORT}`
      );

    });


  } catch(error){

    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);

  }

};


startServer();