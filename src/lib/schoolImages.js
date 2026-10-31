import { getSupabase } from "@/lib/supabaseClient";

export const SCHOOL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SCHOOL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const BUCKET = "school-images";
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function uploadSchoolCover(schoolId, file) {
  if (!SCHOOL_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG or WebP image.");
  }
  if (file.size > SCHOOL_IMAGE_MAX_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const storage = getSupabase().storage.from(BUCKET);
  const path = `${schoolId}/cover-${Date.now()}.${EXTENSIONS[file.type]}`;
  const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("school image upload failed", error);
    throw new Error("Could not upload the photo. Please try again.");
  }
  return storage.getPublicUrl(path).data.publicUrl;
}
