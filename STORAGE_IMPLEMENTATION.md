# Supabase Storage Implementation Guide

## Overview

Supabase Storage is now available for file storage needs. Use cases include:
- PDF export storage
- Voice recording storage
- User uploads
- Cached AI-generated content
- Document attachments

## Storage Buckets

### Recommended Bucket Structure

1. **`pdf-exports`** (public)
   - Assessment PDF reports
   - Public access for easy sharing

2. **`voice-recordings`** (private)
   - User voice assessment recordings
   - Requires authentication

3. **`user-uploads`** (private)
   - User-uploaded files
   - Requires authentication

4. **`cache`** (private)
   - Cached AI responses
   - Service role only

## Setup

### 1. Create Buckets in Supabase Dashboard

1. Go to Supabase Dashboard → Storage
2. Create buckets as needed:
   - `pdf-exports` (public)
   - `voice-recordings` (private)
   - `user-uploads` (private)
   - `cache` (private)

### 2. Set Storage Policies (RLS)

Storage buckets use RLS policies similar to database tables.

**Example: Public PDF exports**
```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdf-exports');

-- Allow service role to upload
CREATE POLICY "Service role upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdf-exports');
```

**Example: Private user uploads**
```sql
-- Users can only access their own files
CREATE POLICY "Users can access own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Usage Examples

### Upload PDF Export

```typescript
import { uploadFile } from '@/supabase/functions/_shared/storage-utils';

const pdfBlob = await generatePDF(assessmentData);

const result = await uploadFile(supabase, {
  bucket: 'pdf-exports',
  path: `assessments/${assessmentId}.pdf`,
  file: pdfBlob,
  contentType: 'application/pdf',
  cacheControl: '3600',
});

if (result.success) {
  console.log('PDF uploaded:', result.publicUrl);
}
```

### Store Voice Recording

```typescript
const audioBlob = await recordAudio();

const result = await uploadFile(supabase, {
  bucket: 'voice-recordings',
  path: `${userId}/${assessmentId}.webm`,
  file: audioBlob,
  contentType: 'audio/webm',
});

if (result.success) {
  // Store path in database
  await supabase
    .from('voice_recordings')
    .insert({ assessment_id: assessmentId, path: result.path });
}
```

## Migration

To enable storage for existing features:

1. **PDF Exports**: Update PDF generation to store in `pdf-exports` bucket
2. **Voice Recordings**: Store recordings in `voice-recordings` bucket
3. **Caching**: Use `cache` bucket for large cached responses

## Storage Limits

- Free tier: 1 GB storage, 2 GB bandwidth/month
- Pro tier: 100 GB storage, 200 GB bandwidth/month

Monitor usage in Supabase Dashboard → Storage → Usage

## Best Practices

1. **Use appropriate buckets**: Separate public and private content
2. **Set RLS policies**: Restrict access appropriately
3. **Clean up old files**: Implement cleanup jobs for expired content
4. **Optimize file sizes**: Compress images, use efficient formats
5. **Use CDN**: Supabase Storage includes CDN for fast delivery


