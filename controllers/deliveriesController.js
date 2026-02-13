function createDelivery(req, res){
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

    const newDelivery = {
        id: Date.now().toString(),
        status: "CREATED",
        name: nameS,
        phone: phoneNormalized,
        address: addressS,
    };
    return res.status(201).json(newDelivery);
}

module.exports = {createDelivery} ;