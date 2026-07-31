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


app.use(
  "/api/users",
  userRoutes
);

app.use("/api/hospitals", hospitalRoutes);

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