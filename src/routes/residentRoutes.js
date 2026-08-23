const express = require("express");
const { getUnifiedData } = require("../services/residentService");

const router = express.Router();

router.get("/residents", async (req, res) => {
    const data = await getUnifiedData();

    res.json(data);
});

module.exports = router;