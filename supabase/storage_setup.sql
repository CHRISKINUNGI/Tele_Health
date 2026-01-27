-- RUN THIS IN SUPABASE SQL EDITOR TO CREATE THE STORAGE BUCKET
-- This cannot be done via standard SQL in some cases, so follow these steps:

-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name it: medical-documents
-- 4. Keep it PRIVATE (not public)
-- 5. Add these policies for the 'medical-documents' bucket:

/*
-- Policy: Doctors can upload for any patient
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
USING (bucket_id = 'medical-documents' AND auth.role() = 'authenticated');

-- Policy: Users can view their own files or files for their patients
SELECT FROM storage.objects
USING (
  bucket_id = 'medical-documents' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE doctor_id = auth.uid() 
      AND patient_id::text = (storage.foldername(name))[1]
    )
  )
);
*/

-- NOTE: If you are using the Storage API, the policies above are just conceptual.
-- Use the Supabase Dashboard UI to set up policies for the 'medical-documents' bucket.
