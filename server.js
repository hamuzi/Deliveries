require("dotenv").config(); // for DB
const express = require("express");
const healthRouter = require("./routes/healthrouter");
const deliveriesRouter = require("./routes/deliveriesRoutes");

const app = express();
app.use(express.json());

const pool = require("./db/pool");

pool.query("SELECT NOW() as now")
  .then((r) => console.log("DB connected:", r.rows[0]))
  .catch((e) => console.error("DB connection error:", e));

app.use('/health', healthRouter);
app.use("/deliveries", deliveriesRouter);
app.use((err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({error: err.message || "server error"});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server started successfully on ${PORT}`);
});

