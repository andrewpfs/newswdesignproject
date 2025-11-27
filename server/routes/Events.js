const express = require("express")
const router = express.Router()
const {Events} = require("../models")

router.get("/", async (req,res) => {
    const listOfEvents = await Events.findAll()
});
router.post("/", async (req,res) => {
    const event = req.body
    await Events.create(event);
});

module.exports=router