import { Router } from "express";
import { uploadImage, uploadVideo, uploadDocument, getUploadSignature } from "../controllers/uploadController.js";
import { uploadImageMiddleware, uploadVideoMiddleware, uploadDocumentMiddleware } from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import { fail } from "../utils/ApiResponse.js";

const router = Router();

// Any authenticated user can upload media for their own records (pet photos,
// product photos if admin, adoption listing photos/videos if shelter). The
// controllers that consume these URLs still enforce their own role checks.
router.use(protect);

// Preferred (production / Vercel): browser uploads directly to Cloudinary using this signature.
router.get("/signature", getUploadSignature);

// Local-development fallback: the routes below write to disk, which is read-only /
// temporary on Vercel, so they are disabled there.
router.use((req, res, next) => {
  if (process.env.VERCEL) {
    return fail(res, "Server-side file upload is disabled on Vercel. Configure Cloudinary.", 503);
  }
  next();
});

router.post("/image", (req, res, next) => {
  uploadImageMiddleware(req, res, (err) => {
    if (err) return fail(res, err.message || "Image upload failed", 400);
    next();
  });
}, uploadImage);

router.post("/video", (req, res, next) => {
  uploadVideoMiddleware(req, res, (err) => {
    if (err) return fail(res, err.message || "Video upload failed", 400);
    next();
  });
}, uploadVideo);

router.post("/document", (req, res, next) => {
  uploadDocumentMiddleware(req, res, (err) => {
    if (err) return fail(res, err.message || "Document upload failed", 400);
    next();
  });
}, uploadDocument);

export default router;
