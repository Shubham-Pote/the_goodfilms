import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

// Set up routes under /api
app.use("/api", routes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add a simple health check route for the root URL
app.get("/", (req, res) => {
  res.json({ message: "The Good Films API is up and running!" });
});

export default app;
