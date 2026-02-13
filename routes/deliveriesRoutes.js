const express = require("express");
const router = express.Router();
const { createDelivery } = require("../controllers/deliveriesController");

router.post("/", createDelivery);

module.exports = router;
