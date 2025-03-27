import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
// import {matchScores} from "./routes/matchScores.js";
import matchScores from "./routes/matchScores.js";
import helmet from "helmet";
// import {MatchScore} from "../Frontend/src/components/Dashboard/CurrentMatches/MatchScore.jsx";


dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Add your frontend and backend URLs
    methods: "GET,POST,PUT,DELETE",
    credentials: true, // Allow cookies and auth headers
  })
);
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
  })
);

// Connect to MongoDB

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Erfan:ERFAN123AALAM@erfan.1vy9lat.mongodb.net/Enrolledusers?retryWrites=true&w=majority&appName=Erfan";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Define Routes
app.use("/auth", authRoutes);
app.use("/matches", matchRoutes);
app.use("/match-scores", matchScores)

// Root Route
app.get("/", (req, res) => {
  res.send("Cricket Betting App API is running...");
});

// Start the Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
