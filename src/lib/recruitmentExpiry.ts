import { supabase } from "@/integrations/supabase/client";

const ACTIVE_APPLICATION_STATUSES = ["submitted"];

export const isPastDeadline = (value?: string | null) => {
  if (!value) return false;
  const deadline = new Date(value);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
};

export const syncExpiredRecruitment = async () => {
  const nowIso = new Date().toISOString();

  const { data: expiredJobs } = await supabase
    .from("job_vacancies")
    .select("id")
    .eq("status", "active")
    .not("closes_at", "is", null)
    .lt("closes_at", nowIso);

  const expiredJobIds = (expiredJobs || []).map((job: any) => job.id).filter(Boolean);
  if (expiredJobIds.length === 0) return { expiredJobIds };

  await supabase
    .from("job_vacancies")
    .update({ status: "closed" })
    .in("id", expiredJobIds);

  await supabase
    .from("job_applications")
    .update({ status: "expired", status_updated_at: nowIso })
    .in("vacancy_id", expiredJobIds)
    .in("status", ACTIVE_APPLICATION_STATUSES);

  return { expiredJobIds };
};
