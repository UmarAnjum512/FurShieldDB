import "dotenv/config";
import mongoose from "mongoose";
import app, { corsMiddleware } from "../src/app.js";
import { connectDB } from "../src/config/db.js";

// Vercel serverless functions can reuse a "warm" container between calls,
// so we cache the DB connection instead of reconnecting on every request.
let connectionPromise = null;

export default async function handler(req, res) {
  if (mongoose.connection.readyState === 0) {
    if (!connectionPromise) {
      connectionPromise = connectDB().catch((err) => {
        connectionPromise = null;
        throw err;
      });
    }
    try {
      await connectionPromise;
    } catch (err) {
      console.error("DB connection failed:", err.message);
      // Run CORS first so the browser shows the real error instead of a confusing CORS failure.
      return corsMiddleware(req, res, () =>
        res.status(500).json({
          success: false,
          message: "Database connection failed",
          reason: err.message,
        })
      );
    }
  }

  return app(req, res);
}