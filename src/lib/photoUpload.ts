import { supabase } from "@/integrations/supabase/client";

/** Upload a File to candidate-photos bucket and return public URL. */
export const uploadCandidatePhoto = async (file: File, fileNameHint = "photo"): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${fileNameHint}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("candidate-photos").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) { console.error("Upload error", error); return null; }
  const { data } = supabase.storage.from("candidate-photos").getPublicUrl(path);
  return data.publicUrl;
};

/** Upload a base64 dataURL (e.g. from canvas.toDataURL) and return public URL. */
export const uploadDataUrlAsPhoto = async (dataUrl: string, fileNameHint = "snap"): Promise<string | null> => {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${fileNameHint}.jpg`, { type: blob.type || "image/jpeg" });
    return await uploadCandidatePhoto(file, fileNameHint);
  } catch (e) {
    console.error("dataUrl upload failed", e);
    return null;
  }
};
