const Delivery = require("../models/delivery");

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
async function updateDeliveryStatus(req, res) {
    const { id } = req.params;
    const { status: nextStatus } = req.body;

    // (מומלץ) ולידציה בסיסית על id כי ב-DB הוא מספר
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({ error: "id must be a positive integer." });
    }

    const delivery = await Delivery.findById(idNum);
    if (!delivery) return res.status(404).json({ error: "this id is not exist." });

    const allowed = ALLOWED_TRANSITIONS[delivery.status] || new Set();
    if (!allowed.has(nextStatus)) {
      return res.status(409).json({ error: "invalid transition." });
    }

    const updated = await Delivery.updateStatus(idNum, nextStatus);
    return res.json(updated);
  } 

async  function getAll(req, res) {
    const deliveries = await Delivery.listAll();
    res.json(deliveries);
  }

module.exports = {
    createDelivery,
    updateDeliveryStatus,
    getAll
} ;