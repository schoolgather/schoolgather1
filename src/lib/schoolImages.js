import { getSupabase } from "@/lib/supabaseClient";

export const SCHOOL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SCHOOL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const BUCKET = "school-images";
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const schoolImageUrl = (path) => getSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export function validateSchoolImage(file) {
  if (!SCHOOL_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG or WebP image.");
  }
  if (file.size > SCHOOL_IMAGE_MAX_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }
}

export async function uploadSchoolImage(schoolId, file, label) {
  validateSchoolImage(file);
  const path = `${schoolId}/${label}-${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error } = await getSupabase()
    .storage.from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("school image upload failed", error);
    throw new Error("Could not upload the photo. Please try again.");
  }
  return path;
}

export async function removeSchoolImage(path) {
  const { error } = await getSupabase().storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("school image removal failed", error);
    throw new Error("Could not remove the photo. Please try again.");
  }
}
