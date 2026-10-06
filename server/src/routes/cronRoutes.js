import { Router } from "express";
import { sendAppointmentReminders } from "../services/reminderService.js";
import { ok, fail } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Call this every minute from a free external pinger (e.g. cron-job.org) or Vercel Cron (Pro).
// Auth: "Authorization: Bearer <CRON_SECRET>" (Vercel Cron sends this automatically) or ?key=<CRON_SECRET>.
router.get("/reminders", asyncHandler(async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail(res, "CRON_SECRET is not configured", 503);
  const provided = (req.headers.authorization || "").replace("Bearer ", "") || req.query.key;
  if (provided !== secret) return fail(res, "Unauthorized", 401);
  const sent = await sendAppointmentReminders();
  return ok(res, { sent }, "Reminder check complete");
}));

export default router;
