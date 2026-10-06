import axios from "axios";
import { api } from "./api.js";

const FIELD = { image: "image", video: "video", document: "document" };

/**
 * Uploads a file and returns its public URL.
 * 1) Preferred: signed direct upload to Cloudinary (works on Vercel, no size limit issues).
 * 2) Fallback (local dev without Cloudinary): upload through the Express server.
 */
export async function uploadFile(file, kind = "image") {
  let sig = null;
  try {
    const { data } = await api.get("/uploads/signature", { params: { kind } });
    sig = data.data;
  } catch (err) {
    if (err.response?.status !== 503) throw err; // 503 = Cloudinary not configured
  }

  if (sig) {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", sig.timestamp);
    form.append("folder", sig.folder);
    form.append("signature", sig.signature);
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`,
      form
    );
    return data.secure_url;
  }

  const form = new FormData();
  form.append(FIELD[kind], file);
  const { data } = await api.post(`/uploads/${kind}`, form);
  return data.data.url;
}
