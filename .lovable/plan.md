# Security Refactor Plan

Your app has 24 security findings rooted in one architectural problem: most of the app talks to the database as the anonymous (`anon`) role, including admin login, test login, and all admin CRUD. Plaintext passwords, admin password hashes, NIK/NPWP, medical history, and test answer keys are currently readable by anyone with your project's anon key.

Fixing this properly means rebuilding the auth foundations. I'm proposing 5 phases so we can ship + test each one before the next, instead of breaking everything at once.

## Phase 1 — Admin auth migration

Move admin login from the custom `admin_users` table to Supabase Auth.

- Create `app_role` enum (`super_admin`, `admin`, `hr`, `recruiter`) and `user_roles` table linked to `auth.users`.
- Create `has_role(user_id, role)` security-definer function (search_path locked).
- Build a one-time migration edge function that, for each row in `admin_users`, creates a Supabase Auth user (email + a temporary password the admin must reset) and inserts the matching `user_roles` row.
- Rewrite `AdminLogin.tsx` to call `supabase.auth.signInWithPassword`.
- Rewrite `AdminLayout` / route guards to check session + `has_role`.
- Keep `admin_users` table for now as a read-only reference, but remove all anon policies.

## Phase 2 — Test login + session edge functions

Stop letting the browser read `activation_codes` and write `test_sessions` / `test_results` directly.

- New edge function `test-login`: validates code + password server-side using service role, returns a short-lived signed session token (JWT we sign with a secret) plus candidate metadata. No more anon SELECT on `activation_codes`.
- New edge function `test-session`: handles start/heartbeat/save-answer/submit. Validates the signed session token on every call.
- New edge function `test-submit-result`: writes to `test_results` and `test_answers` with service role after validating the token.
- Rewrite `TestLogin.tsx`, `TestPage.tsx`, and related hooks to call these functions instead of querying tables directly.
- Hash activation-code passwords with bcrypt in the DB migration (drop plaintext column).

## Phase 3 — RLS lockdown on data tables

With Phases 1–2 in place, drop every `anon` policy on:

- `activation_codes`, `admin_users`, `admin_roles`, `app_settings`
- `candidates`, `candidate_profiles`, `candidate_documents`, `candidate_family_members`, `candidate_education_*`, `candidate_certifications`, `candidate_languages`, `candidate_informal_education`, `candidate_work_experience`
- `job_applications`
- `test_sessions`, `test_results`, `test_answers`, `test_result_details`
- `test_instruments`, `test_questions`, `test_question_options`

Replace with:
- Candidate self-service tables: `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE.
- Admin-managed tables (candidates, codes, results, jobs, settings): `has_role(auth.uid(), 'admin')` (or `super_admin`).
- Public-facing tables (jobs list, public app_settings): explicit narrow `SELECT` policy with `is_public = true` or similar.
- `app_settings`: anon SELECT only when `is_public = true`; writes require admin role.
- `test_result_details`: scope to owner candidate + admin only (fixes the "any authenticated user" finding).

Add explicit `GRANT` statements (`anon` only where a public-read policy exists; `authenticated` where policies use `auth.uid()`; `service_role` everywhere).

## Phase 4 — Storage lockdown

- `candidate-documents` bucket: remove the "Anon admin can read all" policy. Add `auth.uid()::text = (storage.foldername(name))[1]` for SELECT/INSERT/UPDATE/DELETE so each candidate can only touch their own folder. Add a separate admin-role SELECT policy.
- `candidate-photos` bucket: add ownership check (`auth.uid()::text = (storage.foldername(name))[1]`) on INSERT/UPDATE/DELETE; keep public read since it's a public bucket.
- `test-images` bucket: restrict INSERT/UPDATE/DELETE to `has_role(auth.uid(), 'admin')`; keep public read.
- Update `photoUpload.ts` and document-upload code to put files inside an `auth.uid()/...` prefix.

## Phase 5 — Function hardening + cleanup

- Add `SET search_path = public` to every existing function missing it (`update_status_updated_at`, `get_application_status_flow`, `update_updated_at_column`).
- `REVOKE EXECUTE ... FROM anon, authenticated` on `admin_list_users`, `admin_reset_candidate_password`, `admin_activate_candidate_login`, `admin_delete_candidate_account`. These should only run via edge functions using service role.
- Move `get_application_status_flow` out of the API or accept it as intentionally public.
- Enable HIBP password protection (`password_hibp_enabled: true`).
- Make `candidate-photos` non-listable (drop broad SELECT, replace with per-file SELECT) to address the public-bucket-listing warning, or accept the finding and document it in security memory.
- Update `mem://security-memory` and mark findings as fixed in the scanner.

## What I need from you before I start

Two decisions that change the migration:

1. **Existing admin accounts** — when I migrate them into Supabase Auth, what email/password do you want me to use? Options:
   - (a) Use each admin's existing `email` and a temp password `ChangeMe123!`, force reset on first login.
   - (b) You'll give me a single super-admin email and we discard the old `admin_users` rows.

2. **Existing activation codes** — current passwords are plaintext. I can either:
   - (a) Bcrypt-hash them in place (existing codes keep working).
   - (b) Invalidate them all and you regenerate codes from the admin panel after the migration.

## Risks

- This touches ~30+ files. Each phase will be a noticeable change in chat. After each phase I'll verify the affected flows still work before moving on.
- Phase 1 will log every admin out; they'll need to use the temporary password and reset.
- Phase 2 will require any in-progress test sessions to be restarted.
- Existing candidate-uploaded files will need a path migration in Phase 4 (their files currently aren't in an `auth.uid()/` prefix).

Approve this plan and answer the two questions above, and I'll start with Phase 1.