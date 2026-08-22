const express = require("express");

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
    res.json({
        message: "No Wrong Door API is running"
    });
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});