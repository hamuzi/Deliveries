const express = require("express");
const router = express.Router();
const deliveriesController  = require("../controllers/deliveriesController");

router.post("/", deliveriesController.createDelivery);

router.get("/", deliveriesController.getAll);

router.get("/available", deliveriesController.getAvailable);

router.patch("/:id/status", deliveriesController.updateDeliveryStatus); 

router.patch("/:id/assign", deliveriesController.assignDelivery);

router.get("/drivers/:driverId/deliveries", deliveriesController.getByDriver);

router.patch("/drivers/:driverId/deliveries/:id/status",deliveriesController.updateDriverDeliveryStatus);

module.exports = router;
