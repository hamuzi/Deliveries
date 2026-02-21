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

async function updateStatus(id, nextStatus, user) {
  const delivery = await Delivery.findById(id, user);
  const groups = user.groups || [];

  if (!delivery) {
    throw new AppError("Delivery not found OR different business", 404);
  }

  const validStatuses = Object.values(STATUSES);
  if (!validStatuses.includes(nextStatus)) {
    throw new AppError("Invalid status value", 400);
  }

  const allowed = ALLOWED_TRANSITIONS[delivery.status] || new Set();
  if (!allowed.has(nextStatus)) {
    throw new AppError("Invalid status transition", 409);
  }

  const isAdmin = groups.includes("ADMIN");
  const isBusiness = groups.includes("BUSINESS");
  const isDriver = groups.includes("DRIVER");

  if (!isAdmin) {
    if (isBusiness) {
      if (!(delivery.status === STATUSES.CREATED &&
          (nextStatus === STATUSES.READY_FOR_PICKUP ||
            nextStatus === STATUSES.CANCELLED))) {
        throw new AppError("Business cannot perform this transition", 403);
      }
    }

    if (isDriver) {
      if (nextStatus === STATUSES.CANCELLED) {
        throw new AppError("Drivers cannot cancel deliveries", 403);
      }

      const driverAllowed = {
        [STATUSES.ASSIGNED]: [STATUSES.PICKED_UP],
        [STATUSES.PICKED_UP]: [STATUSES.ON_THE_WAY],
        [STATUSES.ON_THE_WAY]: [STATUSES.DELIVERED],
      };

      const allowedNext = driverAllowed[delivery.status] || [];
      if (!allowedNext.includes(nextStatus)) {
        throw new AppError("Driver cannot perform this transition", 403);
      }
    }
  }
  return await Delivery.updateStatus(id, nextStatus, user);
}

module.exports = {
    updateStatus
};
