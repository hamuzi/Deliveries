const express = require("express");
const router = express.Router();
const deliveriesController  = require("../controllers/deliveriesController");
const {requireAuth} = require("../services/requireAuth");
const Role = require("../services/roles");

router.use(requireAuth);

router.post("/",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.BUSINESS), deliveriesController.createDelivery);

router.get("/",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.BUSINESS,Role.Roles.DRIVER), deliveriesController.getAll);

router.get("/available",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.DRIVER), deliveriesController.getAvailable);

router.patch("/:id/status",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.BUSINESS,Role.Roles.DRIVER), deliveriesController.updateDeliveryStatus); 

router.patch("/:id/assign",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.DRIVER), deliveriesController.assignDelivery);

router.get("/:id/events",Role.requireAnyRole(Role.Roles.ADMIN,Role.Roles.BUSINESS,Role.Roles.DRIVER), deliveriesController.getDeliveryEvents);

module.exports = router;
