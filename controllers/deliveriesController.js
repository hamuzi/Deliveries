const Delivery = require("../models/delivery");
const deliveryService = require("../services/deliveryService");

const STATUSES = {
  CREATED: "CREATED",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  ON_THE_WAY: "ON_THE_WAY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

// create delivery
async function createDelivery(req, res){
    const {name, phone, address} = req.body;

    // existing validations 
    if(!name)
        return res.status(400).json({err: "name is missing"})
    if(!phone)
        return res.status(400).json({err: "phone is missing"})
    if(!address)
        return res.status(400).json({err: "address is missing"})
    
    // type validation 
    if(typeof name !== "string" || typeof phone !== "string" || typeof address !== "string")
        return res.status(400).json({err: "detail type must be string"})

    // space validation 
    const nameS = req.body.name.trim();
    const phoneS = req.body.phone.trim();
    const addressS = req.body.address.trim();

    if (nameS === "" || phoneS === "" || addressS === "")
        return res.status(400).json({ err: "content in one field or more is empty"})

    // phone validation 
    const phoneNormalized = phoneS.replace(/\D/g, "");

    if (phoneNormalized.length < 9 || phoneNormalized.length > 10)
        return res.status(400).json({ err: "phone length need to be 9-10 digits."})

    // appling the delivery detail

    const created = await Delivery.create({
    name: nameS,
    phone: phoneNormalized,
    address: addressS,
});

return res.status(201).json(created);
}

// update delivery status
async function updateDeliveryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body;

    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({ error: "id must be a positive integer." });
    }

    const updated = await deliveryService.updateStatus(idNum, nextStatus);
    return res.json(updated);

  } catch (error) {
    next(error);
  }
}

// get all deliveries information
async  function getAll(req, res) {
    const deliveries = await Delivery.listAll();
    res.json(deliveries);
}

// assign delivery to driver
async function assignDelivery(req, res) {
    try{
        const { id } = req.params; // delivery id
        const { driverId } = req.body; // driver id

        const idNum = Number(id); // convert string into int 
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ error: "id must be a positive integer." });
        }

        const driverIdNum = Number(driverId);
        if (!Number.isInteger(driverIdNum) || driverIdNum <= 0) {
            return res.status(400).json({ error: "driverId must be a positive integer." });
        }
        
        const delivery = await Delivery.findById(idNum);
        if (!delivery) {
            return res.status(404).json({ error: "this id is not exist." });
        }
        if (delivery.status !== STATUSES.READY_FOR_PICKUP) {
            return res.status(409).json({error: "delivery must be READY_FOR_PICKUP to be assigned.",currentStatus: delivery.status,});
        }

        const updated = await Delivery.assignDriver(idNum, driverIdNum);
        if (!updated) 
            return res.status(404).json({ error: "this id is not exist." });
        return res.json(updated);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "server error" });
        }
}

// getting all available deliveries for drivers assignments 
async function getAvailable(req, res) {
  try {
    const deliveries = await Delivery.findAvailable();
    return res.json(deliveries);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
}

// get some delivery by driver id
async function getByDriver(req, res) {
  try {
    const { driverId } = req.params;
    const driverIdNum = Number(driverId);

    if (!Number.isInteger(driverIdNum) || driverIdNum <= 0) {
      return res.status(400).json({
        error: "driverId must be a positive integer."
      });
    }

    const deliveries = await Delivery.findByDriver(driverIdNum);
    return res.json(deliveries);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "server error"
    });
  }
}

// update delivery status by id's from driver and delivery both
async function updateDriverDeliveryStatus(req, res, next) {
  try {
    const { driverId, id } = req.params;
    const { status: nextStatus } = req.body;

    const driverIdNum = Number(driverId);
    const idNum = Number(id);

    if (!Number.isInteger(driverIdNum) || driverIdNum <= 0) {
      return res.status(400).json({ error: "driverId must be a positive integer." });
    }

    if (!Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({ error: "id must be a positive integer." });
    }

    const updated = await deliveryService.updateDriverStatus(idNum, driverIdNum, nextStatus);
    return res.json(updated);

  } catch (error) {
    next(error);
  }
}

module.exports = {
    createDelivery,
    updateDeliveryStatus,
    getAll,
    assignDelivery,
    getAvailable,
    getByDriver,
    updateDriverDeliveryStatus
} ;