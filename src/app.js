const express = require("express");
const residentRoutes = require("./routes/residentRoutes");

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "No Wrong Door API is running"
    });
});

app.use("/api", residentRoutes);

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});