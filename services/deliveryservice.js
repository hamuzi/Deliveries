const Delivery = require("../models/delivery");
const AppError = require("./appError");

const STATUSES = {
  CREATED: "CREATED",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  ON_THE_WAY: "ON_THE_WAY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

const ALLOWED_TRANSITIONS = {
  [STATUSES.CREATED]: new Set([STATUSES.READY_FOR_PICKUP, STATUSES.CANCELLED]),
  [STATUSES.READY_FOR_PICKUP]: new Set([STATUSES.ASSIGNED, STATUSES.CANCELLED]),
  [STATUSES.ASSIGNED]: new Set([STATUSES.PICKED_UP, STATUSES.CANCELLED]),
  [STATUSES.PICKED_UP]: new Set([STATUSES.ON_THE_WAY]),
  [STATUSES.ON_THE_WAY]: new Set([STATUSES.DELIVERED]),
  [STATUSES.DELIVERED]: new Set([]),
  [STATUSES.CANCELLED]: new Set([]),
};

async function updateStatus(id, nextStatus) {
  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw new AppError("Delivery not found", 404);
  }

  const validStatuses = Object.values(STATUSES);
  if (!validStatuses.includes(nextStatus)) {
    throw new AppError("Invalid status value", 400);
  }

  const allowed = ALLOWED_TRANSITIONS[delivery.status] || new Set();
  if (!allowed.has(nextStatus)) {
    throw new AppError("Invalid status transition", 409);
  }

  return await Delivery.updateStatus(id, nextStatus);
}

async function updateDriverStatus(id, driverId, nextStatus) {
  const delivery = await Delivery.findByIdAndDriver(id, driverId);
  if (!delivery) {
    throw new AppError("Delivery not found or not assigned to this driver", 404);
  }
  
  const validStatuses = Object.values(STATUSES);
  if (!validStatuses.includes(nextStatus)) {
    throw new AppError("Invalid status value", 400);
  }

  const allowed = ALLOWED_TRANSITIONS[delivery.status] || new Set();
  if (!allowed.has(nextStatus)) {
    throw new AppError("Invalid status transition", 409);
  }

  return await Delivery.updateStatus(id, nextStatus);
}

module.exports = {
    updateStatus,
    updateDriverStatus
};
