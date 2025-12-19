/**
 * Supabase Storage Utilities
 * 
 * Handles file uploads to Supabase Storage buckets
 */

import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

/**
 * Upload PDF to Supabase Storage
 * @param pdfBlob PDF file as Blob
 * @param assessmentId Assessment ID for file naming
 * @param leaderName Leader name for file naming
 * @returns Upload result with path and public URL
 */
export async function uploadPDFToStorage(
  pdfBlob: Blob,
  assessmentId: string,
  leaderName: string
): Promise<UploadResult> {
  try {
    const fileName = `AI-Leadership-Benchmark-${leaderName.replace(/\s+/g, '-')}-${assessmentId.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = `pdfs/${assessmentId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('assessments')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('PDF upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('assessments')
      .getPublicUrl(filePath);

    return {
      success: true,
      path: filePath,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('PDF upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload voice recording to Supabase Storage (if user consented)
 * @param audioBlob Audio file as Blob
 * @param sessionId Session ID for file naming
 * @param moduleType Module type (compass, roi, etc.)
 * @returns Upload result with path
 */
export async function uploadVoiceRecordingToStorage(
  audioBlob: Blob,
  sessionId: string,
  moduleType: string
): Promise<UploadResult> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${moduleType}-${sessionId.substring(0, 8)}-${timestamp}.webm`;
    const filePath = `voice-recordings/${sessionId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('voice-recordings')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (error) {
      console.error('Voice recording upload error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      path: filePath,
    };
  } catch (error) {
    console.error('Voice recording upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get public URL for a stored file
 * @param bucket Bucket name
 * @param path File path
 * @returns Public URL
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from storage
 * @param bucket Bucket name
 * @param path File path
 * @returns Success status
 */
export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('Delete from storage error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Delete from storage exception:', error);
    return false;
  }
}


