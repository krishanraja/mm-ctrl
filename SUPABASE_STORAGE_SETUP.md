# Supabase Storage Setup Guide

## Overview

Supabase Storage has been integrated for PDF exports and voice recordings. This provides persistent storage and easy access to generated files.

## Required Storage Buckets

Create the following buckets in Supabase Dashboard:

### 1. `assessments` Bucket
- **Purpose**: Store PDF exports of assessment reports
- **Public**: Yes (for easy access to PDFs)
- **File size limit**: 10MB
- **Allowed MIME types**: `application/pdf`

### 2. `voice-recordings` Bucket (Optional)
- **Purpose**: Store voice recordings if user consents
- **Public**: No (private, user-specific)
- **File size limit**: 50MB
- **Allowed MIME types**: `audio/webm`, `audio/mpeg`, `audio/wav`

## Setup Instructions

### 1. Create Storage Buckets

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg)
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create `assessments` bucket:
   - Name: `assessments`
   - Public: ✅ Yes
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf`
5. Create `voice-recordings` bucket (optional):
   - Name: `voice-recordings`
   - Public: ❌ No
   - File size limit: 50MB
   - Allowed MIME types: `audio/webm`, `audio/mpeg`, `audio/wav`

### 2. Set Up Storage Policies

#### For `assessments` bucket (Public):

```sql
-- Allow authenticated users to upload PDFs
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assessments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to PDFs
CREATE POLICY "Public can read PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assessments');
```

#### For `voice-recordings` bucket (Private):

```sql
-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own recordings
CREATE POLICY "Users can read their own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Verify Integration

After setup:

1. **Test PDF Export**:
   - Complete an assessment
   - Click "Export PDF"
   - Check Supabase Storage → `assessments` bucket
   - Verify PDF was uploaded

2. **Test Voice Recording** (if implemented):
   - Record a voice response
   - Check Supabase Storage → `voice-recordings` bucket
   - Verify audio file was uploaded (if user consented)

## File Structure

### PDFs
```
assessments/
  {assessmentId}/
    AI-Leadership-Benchmark-{LeaderName}-{Date}.pdf
```

### Voice Recordings
```
voice-recordings/
  {sessionId}/
    {moduleType}-{sessionId}-{timestamp}.webm
```

## Usage in Code

### Upload PDF
```typescript
import { uploadPDFToStorage } from '@/utils/supabaseStorage';

const result = await uploadPDFToStorage(pdfBlob, assessmentId, leaderName);
if (result.success) {
  console.log('PDF URL:', result.url);
}
```

### Upload Voice Recording
```typescript
import { uploadVoiceRecordingToStorage } from '@/utils/supabaseStorage';

const result = await uploadVoiceRecordingToStorage(audioBlob, sessionId, 'compass');
if (result.success) {
  console.log('Recording path:', result.path);
}
```

## Benefits

- ✅ **Persistent Storage**: PDFs and recordings are saved permanently
- ✅ **Easy Access**: Public URLs for PDFs, secure access for recordings
- ✅ **Scalable**: Supabase handles storage scaling automatically
- ✅ **Backup**: Files are automatically backed up by Supabase

## Troubleshooting

### "Bucket not found" error
- Verify buckets are created in Supabase Dashboard
- Check bucket names match exactly: `assessments` and `voice-recordings`

### "Permission denied" error
- Check storage policies are set up correctly
- Verify user is authenticated (for private buckets)
- Check RLS policies allow the operation

### Upload fails silently
- Check file size limits
- Verify MIME types are allowed
- Check browser console for detailed errors
