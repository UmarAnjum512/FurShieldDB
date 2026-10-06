import { ok, fail } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { v2 as cloudinary } from "cloudinary";

const cloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Returns a signed payload so the browser uploads straight to Cloudinary.
// This avoids Vercel's ~4.5MB request-body limit and the read-only/ephemeral filesystem.
export const getUploadSignature = asyncHandler(async (req, res) => {
  if (!cloudinaryConfigured()) {
    return fail(res, "Cloudinary is not configured", 503);
  }
  const kind = ["image", "video", "document"].includes(req.query.kind) ? req.query.kind : "image";
  const folder = `furshield/${kind}s`;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET
  );
  return ok(
    res,
    {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
      resourceType: kind === "video" ? "video" : kind === "document" ? "auto" : "image",
    },
    "Upload signature created"
  );
});

const baseUrl = (req) => `${req.protocol}://${req.get("host")}`;

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, "No image file received", 400);
  const url = `${baseUrl(req)}/uploads/images/${req.file.filename}`;
  return ok(res, { url }, "Image uploaded successfully", 201);
});

export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, "No video file received", 400);
  const url = `${baseUrl(req)}/uploads/videos/${req.file.filename}`;
  return ok(res, { url }, "Video uploaded successfully", 201);
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, "No document file received", 400);
  const url = `${baseUrl(req)}/uploads/documents/${req.file.filename}`;
  return ok(res, { url, fileType: req.file.mimetype }, "Document uploaded successfully", 201);
});
