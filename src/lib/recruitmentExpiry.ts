import { supabase } from "@/integrations/supabase/client";

export const ACTIVE_APPLICATION_STATUSES = [
  "submitted",
  "applied",
  "screening",
  "test",
  "psychology_test",
  "interview",
  "hr_interview",
  "user_interview",
  "offered",
  "offer",
];

export const isPastDeadline = (value?: string | null) => {
  if (!value) return false;
  const deadline = new Date(value);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
};

export const syncExpiredRecruitment = async () => {
  const nowIso = new Date().toISOString();
  const inactiveProcessThresholdIso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiredJobs } = await supabase
    .from("job_vacancies")
    .select("id")
    .eq("status", "active")
    .not("closes_at", "is", null)
    .lt("closes_at", nowIso);

  const expiredJobIds = (expiredJobs || []).map((job: any) => job.id).filter(Boolean);
  if (expiredJobIds.length > 0) {
    await supabase
      .from("job_vacancies")
      .update({ status: "closed" })
      .in("id", expiredJobIds);

    await supabase
      .from("job_applications")
      .update({ status: "expired", status_updated_at: nowIso })
      .in("vacancy_id", expiredJobIds)
      .in("status", ACTIVE_APPLICATION_STATUSES);
  }

  await supabase
    .from("job_applications")
    .update({
      status: "rejected",
      status_updated_at: nowIso,
      admin_notes: "Ditolak otomatis karena tidak ada proses lanjut selama 60 hari.",
    } as any)
    .in("status", ACTIVE_APPLICATION_STATUSES)
    .or(`status_updated_at.lt.${inactiveProcessThresholdIso},and(status_updated_at.is.null,applied_at.lt.${inactiveProcessThresholdIso})`);

  return { expiredJobIds };
};
