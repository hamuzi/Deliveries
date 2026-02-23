require("dotenv").config();
const express = require("express");

const healthRouter = require("./routes/healthRoutes");
const deliveriesRouter = require("./routes/deliveriesRoutes");
const authRouter = require("./routes/authRoutes");

const pool = require("./db/pool");

const app = express();
app.use(express.json());

pool.query("SELECT NOW() as now")
  .then((r) => console.log("DB connected:", r.rows[0]))
  .catch((e) => console.error("DB connection error:", e));

app.use("/", authRouter); 
app.use("/health", healthRouter);
app.use("/deliveries", deliveriesRouter);


app.use((err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || "server error" });
});

module.exports = app;
