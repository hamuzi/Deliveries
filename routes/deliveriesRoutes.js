const express = require("express");
const router = express.Router();
const deliveriesController  = require("../controllers/deliveriesController");
const {requireAuth} = require("../services/requireAuth");
const Role = require("../services/roles");

router.use(requireAuth);

router.post("/",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.BUSINESS), deliveriesController.createDelivery);

router.get("/",Role.requireAnyRole(Role.Roles.ADMIN), deliveriesController.getAll);

router.get("/available",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.DRIVER), deliveriesController.getAvailable);

router.patch("/:id/status",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.BUSINESS), deliveriesController.updateDeliveryStatus); 

router.patch("/:id/assign",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.DRIVER), deliveriesController.assignDelivery);

router.get("/drivers/:driverId/deliveries",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.DRIVER), deliveriesController.getByDriver);

router.patch("/drivers/:driverId/deliveries/:id/status",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.DRIVER),deliveriesController.updateDriverDeliveryStatus);

module.exports = router;
