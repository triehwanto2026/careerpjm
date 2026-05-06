# Fix Storage Bucket Settings via UI

Karena SQL membutuhkan owner permission, lakukan via Supabase Dashboard UI:

## Step 1: Cek Bucket Settings
1. Buka https://app.supabase.com
2. Pilih project Anda
3. Klik menu **Storage** (di sidebar kiri)
4. Klik bucket **test-images**
5. Klik tab **Settings**
6. Pastikan **Public bucket** = **ON**

## Step 2: Set RLS Policies via UI
1. Di bucket **test-images**, klik tab **Policies**
2. Tambahkan policy baru dengan klik **New Policy**:

### Policy 1: Public Read
- **Policy name**: `Public Read`
- **Allowed operation**: `SELECT`
- **Target roles**: `anon, authenticated`
- **Policy definition**: `true`

### Policy 2: Authenticated Upload
- **Policy name**: `Auth Upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**: `true`

### Policy 3: Authenticated Delete
- **Policy name**: `Auth Delete`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**: `true`

## Step 3: Test Image URL
Coba buka URL gambar langsung di browser baru:
```
https://vsmsgyupvtvzhzpzeota.supabase.co/storage/v1/object/public/test-images/q117-soal-1778036036979-r38qkb.png
```

Jika gambar muncul = storage sudah benar.

## Step 4: Refresh Aplikasi
1. Hard refresh: `Ctrl + F5` (Windows) atau `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Login ulang ke aplikasi
