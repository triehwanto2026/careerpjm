import { supabase } from "@/integrations/supabase/client";

const SUPABASE_STORAGE_URL_RE = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;

export function parseSupabaseStorageUrl(url: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(SUPABASE_STORAGE_URL_RE);
    if (!match) return null;
    return {
      bucket: match[1],
      path: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

export async function resolveStorageUrl(url: string) {
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return url;

  if (parsed.bucket === "candidate-documents") {
    const { data, error } = await supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, 300);
    if (error) {
      console.error("Failed to create signed URL for storage object", error);
      return url;
    }
    return data?.signedUrl || url;
  }

  return url;
}
