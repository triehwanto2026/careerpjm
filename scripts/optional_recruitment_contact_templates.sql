-- Optional: run this in Supabase SQL editor only if recruitment contact templates
-- need to be shared across admins/devices instead of saved in each browser.

create table if not exists public.recruitment_contact_templates (
  id uuid primary key default gen_random_uuid(),
  status text not null unique,
  template text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_recruitment_contact_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_recruitment_contact_templates_updated_at
on public.recruitment_contact_templates;

create trigger set_recruitment_contact_templates_updated_at
before update on public.recruitment_contact_templates
for each row
execute function public.set_recruitment_contact_templates_updated_at();

alter table public.recruitment_contact_templates enable row level security;

drop policy if exists "Admins can manage recruitment contact templates"
on public.recruitment_contact_templates;

create policy "Admins can manage recruitment contact templates"
on public.recruitment_contact_templates
for all
using (true)
with check (true);

insert into public.recruitment_contact_templates (status, template)
values
  (
    'psychology_test',
    'Yth. {nama},

Terima kasih atas lamaran Anda untuk posisi {posisi}. Kami mengundang Anda untuk mengikuti tahap Tes Psikologi. Mohon konfirmasi ketersediaan Anda agar kami dapat mengirimkan detail jadwal dan akses tes.

Terima kasih.'
  ),
  (
    'hr_interview',
    'Yth. {nama},

Terima kasih atas partisipasi Anda dalam proses rekrutmen posisi {posisi}. Kami mengundang Anda untuk mengikuti tahap {tahap}. Mohon konfirmasi ketersediaan jadwal Anda untuk proses interview.

Terima kasih.'
  ),
  (
    'user_interview',
    'Yth. {nama},

Terima kasih atas partisipasi Anda dalam proses rekrutmen posisi {posisi}. Kami mengundang Anda untuk mengikuti tahap {tahap}. Mohon konfirmasi ketersediaan jadwal Anda untuk proses interview.

Terima kasih.'
  )
on conflict (status) do nothing;
