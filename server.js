const express = require("express");
const healthRouter = require("./routes/healthrouter");
const deliveriesRouter = require("./routes/deliveriesRoutes");


const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use("/deliveries", deliveriesRouter);

app.listen(3000, () => {
  console.log("server started successfully");
});
