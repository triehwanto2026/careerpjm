import { supabase } from "@/integrations/supabase/client";

/** Upload a File to candidate-photos bucket and return public URL. */
export const uploadCandidatePhoto = async (file: File, fileNameHint = "photo"): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${fileNameHint}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("candidate-photos").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) {
    console.error("Upload error", error);
    return null;
  }

  const { data } = supabase.storage.from("candidate-photos").getPublicUrl(path);
  const publicUrl = data?.publicUrl || null;
  if (!publicUrl) {
    console.warn("Failed to obtain public URL for uploaded candidate photo.");
    return null;
  }

  try {
    const response = await fetch(publicUrl, { method: "HEAD" });
    if (!response.ok) {
      console.warn("Uploaded candidate photo public URL is not accessible", response.status);
      return null;
    }
    return publicUrl;
  } catch (e) {
    console.warn("Candidate photo public URL verification failed", e);
    return null;
  }
};

/** Upload a base64 dataURL (e.g. from canvas.toDataURL) and return a public URL.
 * If storage upload fails or the public URL is not accessible, return the original
 * data URL fallback so the screenshot remains displayable in the result view.
 */
export const uploadDataUrlAsPhoto = async (dataUrl: string, fileNameHint = "snap"): Promise<string | null> => {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${fileNameHint}.jpg`, { type: blob.type || "image/jpeg" });
    const fileUrl = await uploadCandidatePhoto(file, fileNameHint);
    return fileUrl || dataUrl;
  } catch (e) {
    console.error("dataUrl upload failed", e);
    return dataUrl;
  }
};
