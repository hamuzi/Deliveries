const Delivery = require("../models/delivery");
const deliveryService = require("../services/deliveryService");
const DeliveryEvent = require("../models/deliveryEvent");

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
    }, req.user);   

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

    const updated = await deliveryService.updateStatus(idNum, nextStatus, req.user);
    return res.json(updated);

  } catch (error) {
    next(error);
  }
}

// get all deliveries information
async  function getAll(req, res) {
    const deliveries = await Delivery.listAll(req.user);
    res.json(deliveries);
}

// assign delivery to driver
async function assignDelivery(req, res) {
    try{
        const { id } = req.params; // delivery id

        const idNum = Number(id); // convert string into int 
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ error: "id must be a positive integer." });
        }

        const updated = await Delivery.assignDriver(idNum, req.user);
        if (!updated) 
            return res.status(404).json({ error: "no available orders (only for drivers)." });
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

async function getDeliveryEvents(req, res, next) {
  try {
    const deliveryId = Number(req.params.id);
    if (Number.isNaN(deliveryId)) 
        return res.status(400).json({ error: "Invalid delivery id" });

    const delivery = await Delivery.findById(deliveryId, req.user);
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    const { limit, cursor } = req.query;

    const result = await DeliveryEvent.listByDeliveryId(deliveryId, { limit, cursor });

    return res.json({
      deliveryId,
      events: result.events,
      nextCursor: result.nextCursor
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
    createDelivery,
    updateDeliveryStatus,
    getAll,
    assignDelivery,
    getAvailable,
    getDeliveryEvents
} ;