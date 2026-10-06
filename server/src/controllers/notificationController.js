import { Notification } from "../models/Notification.js";
import { ok, fail } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendAppointmentReminders } from "../services/reminderService.js";

// Serverless functions cannot run setInterval, so reminders are also checked
// whenever someone loads notifications (throttled to once a minute).
let lastReminderCheck = 0;
async function maybeRunReminders() {
  if (Date.now() - lastReminderCheck < 60 * 1000) return;
  lastReminderCheck = Date.now();
  try { await sendAppointmentReminders(); } catch (err) { console.error("Reminder check failed:", err.message); }
}

export const listNotifications = asyncHandler(async (req, res) => {
  await maybeRunReminders();
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return ok(res, { notifications, unreadCount }, "Notifications fetched");
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true }
  );
  if (!notification) return fail(res, "Notification not found", 404);
  return ok(res, { notification }, "Notification marked as read");
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return ok(res, {}, "All notifications marked as read");
});
