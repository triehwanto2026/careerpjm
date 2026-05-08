
Implementasi dibagi menjadi 3 bagian besar. Saya akan kerjakan berurutan agar tidak saling memblokir.

---

## Bagian 1 — Print Hasil Personality Plus & DISC

Buat layout cetak A4 portrait dengan 2 halaman:
- **Halaman 1 (Hasil)**: Identitas kandidat, ringkasan skor per dimensi, grafik bar, dominan profil, interpretasi singkat.
- **Halaman 2 (Lembar Jawaban)**: Tabel jawaban per nomor (untuk DISC: kolom Most & Least; untuk PP: pilihan + temperamen).

Lokasi: tombol "Print" baru di `src/pages/admin/Results.tsx` saat membuka detail PP/DISC. Style cetak via `@media print` + `print-color-adjust: exact`, page-break antar lembar.

---

## Bagian 2 — Portal Kandidat (auth email + password mandiri)

### Database
- Aktifkan Supabase Auth email/password (signup mandiri).
- Tabel baru:
  - `candidate_profiles` (user_id, fullname, birth_date, gender, address, phone, education, experience, skills, photo_url, dst.) — RLS: kandidat hanya akses miliknya sendiri.
  - `candidate_documents` (user_id, type: cv/ktp/foto/ijazah/transkrip, file_url, uploaded_at) — RLS sama.
  - `job_vacancies` (title, department, location, description, requirements, status, posted_by, closes_at) — public read aktif, admin CUD.
  - `job_applications` (user_id, vacancy_id, status: submitted/screening/test/interview/offered/rejected, notes, applied_at) — kandidat read/insert miliknya, admin full.
- Storage bucket baru `candidate-documents` (private) + RLS by user folder.
- Trigger auto-create row `candidate_profiles` saat signup.

### Halaman kandidat (route baru `/candidate/*`)
- `/candidate/login` & `/candidate/register` — email + password (Google opsional default).
- `/candidate/profile` — biodata + upload CV, KTP, foto formal, ijazah, transkrip.
- `/candidate/jobs` — list lowongan aktif + tombol "Lamar".
- `/candidate/applications` — daftar lamaran dengan status timeline (auto-update dari admin).
- `/candidate/tests` — daftar paket tes (dari activation_codes yang ditugaskan ke email-nya) + link mulai tes.
- Layout sidebar khusus kandidat (terpisah dari admin).

### Auth
- Halaman registrasi standar (email, password, nama). `emailRedirectTo: window.location.origin/candidate/profile`.
- Auto-confirm email **tidak** diaktifkan (kandidat harus verifikasi).

---

## Bagian 3 — Admin: Lowongan, Rekrutmen, Kandidat Otomatis

Halaman admin baru:
- `/admin/jobs` — CRUD lowongan (judul, deskripsi, requirement, status open/closed).
- `/admin/recruitment` — kanban/tabel lamaran per lowongan, ubah status, assign paket tes (auto-generate activation code untuk email kandidat).
- `/admin/candidates` (revamp) — sumber data dari `candidate_profiles` + `candidate_documents`, tampilkan CV lengkap, riwayat tes, riwayat lamaran. Lama (manual entry) tetap bisa diakses.

Sidebar admin ditambah menu: **Lowongan**, **Rekrutmen**.

---

## Detail teknis singkat

- React Router: tambah grup route `/candidate/*` dengan `CandidateLayout` + `RequireCandidateAuth`.
- Activation code lama tetap berfungsi untuk legacy candidates; kandidat baru otomatis terhubung via `email = auth.user().email`.
- Supabase migration dijalankan dalam 1 batch (skema + RLS + storage + trigger).
- Print PP/DISC pakai komponen `PrintablePPReport.tsx` & `PrintableDISCReport.tsx` yang dibuka di tab baru lalu `window.print()`.

---

## Urutan kerja yang akan saya lakukan

1. Migration database (semua tabel + RLS + storage + trigger).
2. Print hasil PP & DISC (paling kecil, langsung kelihatan).
3. Portal kandidat (auth + 5 halaman).
4. Modul admin (lowongan + rekrutmen + revamp kandidat).

Setujui rencana ini untuk saya mulai eksekusi?
