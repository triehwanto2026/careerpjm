import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

// Fetch all jobs (for public pages)
export const useActiveJobs = () => {
  return useQuery({
    queryKey: ["jobs", "active"],
    queryFn: async () => {
      await syncExpiredRecruitment();
      const { data, error } = await supabase
        .from("job_vacancies")
        .select("*")
        .eq("status", "active")
        .or(`closes_at.is.null,closes_at.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

// Fetch all jobs for admin (including draft and closed)
export const useJobs = () => {
  return useQuery({
    queryKey: ["jobs", "all"],
    queryFn: async () => {
      await syncExpiredRecruitment();
      const { data, error } = await supabase
        .from("job_vacancies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

// Create a new job
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobData: any) => {
      const { data, error } = await supabase
        .from("job_vacancies")
        .insert(jobData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

// Update an existing job
export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...jobData }: any) => {
      const { data, error } = await supabase
        .from("job_vacancies")
        .update(jobData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

// Delete a job
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_vacancies")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};
