import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.js";
import { ok, fail } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendMail } from "../utils/mailer.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

export const register = asyncHandler(async (req, res) => {
  const { role = "owner", name, email, password, contactNumber, address, specialization, experienceYears, shelterName, contactPerson } = req.body;

  if (role === "admin") return fail(res, "Admin accounts cannot be self-registered", 403);
  if (!name || !email || !password) return fail(res, "Name, email and password are required", 422);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return fail(res, "An account with this email already exists", 409);

  const user = await User.create({
    role, name, email, password, contactNumber, address,
    specialization, experienceYears, shelterName, contactPerson,
  });

  const token = signToken(user._id);
  return ok(res, { user: sanitizeUser(user), token }, "Registration successful", 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "Email and password are required", 422);

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return fail(res, "Invalid email or password", 401);
  }
  if (!user.isActive) return fail(res, "This account has been suspended", 403);

  const token = signToken(user._id);
  return ok(res, { user: sanitizeUser(user), token }, "Login successful");
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user }, "Current user");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  // Always respond the same way to avoid leaking which emails are registered
  if (!user) return ok(res, {}, "If that email exists, a reset link has been sent");

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
  const resetLink = `${clientUrl}/reset-password/${resetToken}`;
  const mailSent = await sendMail({
    to: user.email,
    subject: "Reset your FurShield password",
    text: `Hi ${user.name},\n\nUse this link to reset your password (valid for 1 hour):\n${resetLink}\n\nIf you did not request this, ignore this email.`,
  });

  // The token is only returned in development when no SMTP is configured,
  // so it is never exposed in production.
  const exposeToken = !mailSent && process.env.NODE_ENV !== "production";
  return ok(res, exposeToken ? { resetToken } : {}, "If that email exists, a reset link has been sent");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 8) return fail(res, "New password must be at least 8 characters", 422);

  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) return fail(res, "Reset token is invalid or has expired", 400);

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return ok(res, {}, "Password has been reset successfully");
});
