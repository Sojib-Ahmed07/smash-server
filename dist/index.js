import "dotenv/config";
import express from "express";
const app = express();
const port = Number(process.env.PORT) || 3000;
app.get("/", (req, res) => {
    return res.send("Hello World");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
