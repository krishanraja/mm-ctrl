/**
 * Supabase Storage Utilities
 * Helper functions for file storage operations
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File | Blob | ArrayBuffer | Uint8Array;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 * 
 * @param supabase Supabase client (with service role key for public buckets, or user auth for private)
 * @param options Upload configuration
 * @returns Upload result with public URL if successful
 */
export async function uploadFile(
  supabase: any,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    const { bucket, path, file, contentType, cacheControl, upsert = false } = options;

    // Convert file to appropriate format
    let fileData: Blob | ArrayBuffer | Uint8Array;
    if (file instanceof File || file instanceof Blob) {
      fileData = file;
    } else if (file instanceof ArrayBuffer) {
      fileData = new Uint8Array(file);
    } else {
      fileData = file;
    }

    const uploadOptions: any = {
      cacheControl: cacheControl || '3600',
      upsert,
    };

    if (contentType) {
      uploadOptions.contentType = contentType;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileData, uploadOptions);

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Storage upload exception:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  supabase: any,
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(supabase: any, bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * List files in a storage bucket path
 */
export async function listFiles(
  supabase: any,
  bucket: string,
  path?: string,
  limit?: number
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: limit || 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Storage list error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      files: data || [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Ensure storage bucket exists (creates if it doesn't)
 * Requires service role key
 */
export async function ensureBucket(
  supabase: any,
  bucketName: string,
  isPublic: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      return {
        success: false,
        error: listError.message,
      };
    }

    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (bucketExists) {
      return { success: true };
    }

    // Create bucket
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 52428800, // 50MB default
    });

    if (createError) {
      console.error('Bucket creation error:', createError);
      return {
        success: false,
        error: createError.message,
      };
    }

    console.log(`✅ Created storage bucket: ${bucketName}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}


