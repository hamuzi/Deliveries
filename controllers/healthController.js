function getHealth(req,res) {
    console.log("Healthy.");
    res.json({ ok: true });
}

module.exports = { getHealth };
