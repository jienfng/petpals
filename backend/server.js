import cors from "cors";
import express from "express";

const app = express();
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("PetPals Backend is running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
