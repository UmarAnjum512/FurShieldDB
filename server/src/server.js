import dns from "node:dns";

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startAppointmentReminderScheduler } from "./services/reminderService.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`FurShield API running on port ${PORT}`);
      startAppointmentReminderScheduler();
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();