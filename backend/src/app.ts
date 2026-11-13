import express from "express";
import cors from "cors";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler.middleware";

const app = express();

// Middleware
app.use(
  cors({
    origin: [env.CORS_ORIGIN],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Yoga Studio API is running" });
});

app.use(errorHandler);

export default app;
