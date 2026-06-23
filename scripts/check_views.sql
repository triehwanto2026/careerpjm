-- Cek view yang mungkin membatasi jumlah soal
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
AND (definition ILIKE '%test_questions%' OR definition ILIKE '%limit%')
ORDER BY viewname;
