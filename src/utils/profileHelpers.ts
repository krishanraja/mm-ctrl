/**
 * Profile Helpers - Centralized Profile Management
 * 
 * Purpose: Provides anti-fragile profile lookup and creation with email+name matching,
 * upsert logic, safe defaults, and explicit error handling.
 * 
 * Key Features:
 * - Email + name matching (case-insensitive, normalized)
 * - Upsert logic to prevent duplicates
 * - Safe defaults for missing fields
 * - Explicit error handling with context
 * - Support for both user_id-based and email+name-based matching
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProfileLookupResult {
  success: boolean;
  profileId: string | null;
  isNew: boolean;
  errors: string[];
  fallbacksUsed: string[];
}

export interface ProfileData {
  email: string;
  name: string | null;
  userId?: string | null;
  role?: string | null;
  company?: string | null;
  companySize?: string | null;
  primaryFocus?: string | null;
}

/**
 * Normalizes email for matching (lowercase, trim)
 */
function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Normalizes name for matching (lowercase, trim, remove extra spaces)
 */
function normalizeName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Generates safe default email for anonymous users
 */
function generateSafeEmail(userId: string | null): string {
  if (userId) {
    return `anon+${userId}@anon.local`;
  }
  return `anon+${Date.now()}@anon.local`;
}

/**
 * Generates safe default name
 */
function generateSafeName(): string {
  return 'Anonymous User';
}

/**
 * Looks up or creates a profile with email+name matching
 * 
 * Strategy:
 * 1. If user_id provided, try lookup by user_id first (most reliable)
 * 2. If email+name provided, try matching (case-insensitive, normalized)
 * 3. If not found, create new profile with upsert logic
 * 4. Always return safe defaults for missing fields
 */
export async function lookupOrCreateProfile(
  profileData: ProfileData
): Promise<ProfileLookupResult> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];
  let profileId: string | null = null;
  let isNew = false;

  try {
    // Normalize inputs
    const normalizedEmail = normalizeEmail(profileData.email);
    const normalizedName = normalizeName(profileData.name);
    const userId = profileData.userId || null;

    // Validate we have at least email or user_id
    if (!normalizedEmail && !userId) {
      errors.push('Either email or userId must be provided');
      return {
        success: false,
        profileId: null,
        isNew: false,
        errors,
        fallbacksUsed
      };
    }

    // Strategy 1: If user_id provided, lookup by user_id first (most reliable)
    if (userId) {
      const { data: existingByUserId, error: userIdError } = await supabase
        .from('leaders')
        .select('id, email, name')
        .eq('user_id', userId)
        .maybeSingle();

      if (userIdError) {
        console.warn('⚠️ Lookup by user_id failed:', userIdError.message);
        // Continue to email+name matching
      } else if (existingByUserId) {
        profileId = existingByUserId.id;
        isNew = false;
        console.log('✅ Found profile by user_id:', profileId);
        
        // Update email/name if provided and different
        const needsUpdate = 
          (normalizedEmail && existingByUserId.email?.toLowerCase() !== normalizedEmail) ||
          (normalizedName && normalizeName(existingByUserId.name) !== normalizedName);

        if (needsUpdate) {
          const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
          };
          if (normalizedEmail) updateData.email = normalizedEmail;
          if (normalizedName) updateData.name = profileData.name; // Keep original casing

          const { error: updateError } = await supabase
            .from('leaders')
            .update(updateData)
            .eq('id', profileId);

          if (updateError) {
            console.warn('⚠️ Failed to update profile:', updateError.message);
            errors.push(`Update failed: ${updateError.message}`);
          }
        }

        return {
          success: true,
          profileId,
          isNew: false,
          errors,
          fallbacksUsed
        };
      }
    }

    // Strategy 2: If email provided, try matching by email+name
    if (normalizedEmail && !profileId) {
      // First try exact email match
      const { data: existingByEmail, error: emailError } = await supabase
        .from('leaders')
        .select('id, email, name, user_id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (emailError) {
        console.warn('⚠️ Lookup by email failed:', emailError.message);
        errors.push(`Email lookup error: ${emailError.message}`);
      } else if (existingByEmail) {
        // Found by email - check if name matches (if provided)
        const existingNameNormalized = normalizeName(existingByEmail.name);
        
        if (!normalizedName || existingNameNormalized === normalizedName) {
          // Name matches or not provided - use this profile
          profileId = existingByEmail.id;
          isNew = false;
          console.log('✅ Found profile by email:', profileId);

          // Update name if provided and different
          if (normalizedName && existingNameNormalized !== normalizedName) {
            const { error: updateError } = await supabase
              .from('leaders')
              .update({ 
                name: profileData.name,
                updated_at: new Date().toISOString()
              })
              .eq('id', profileId);

            if (updateError) {
              console.warn('⚠️ Failed to update name:', updateError.message);
            }
          }

          // Update user_id if provided and not set
          if (userId && !existingByEmail.user_id) {
            const { error: updateError } = await supabase
              .from('leaders')
              .update({ 
                user_id: userId,
                updated_at: new Date().toISOString()
              })
              .eq('id', profileId);

            if (updateError) {
              console.warn('⚠️ Failed to update user_id:', updateError.message);
            }
          }

          return {
            success: true,
            profileId,
            isNew: false,
            errors,
            fallbacksUsed
          };
        } else {
          // Email matches but name doesn't - could be different person
          // For now, we'll create a new profile (could be enhanced with fuzzy matching)
          console.log('⚠️ Email matches but name differs - will create new profile');
        }
      }
    }

    // Strategy 3: Create new profile (not found by any method)
    if (!profileId) {
      // Prepare safe defaults
      const safeEmail = normalizedEmail || generateSafeEmail(userId);
      const safeName = profileData.name || generateSafeName();
      
      if (!normalizedEmail) {
        fallbacksUsed.push('email');
      }
      if (!profileData.name) {
        fallbacksUsed.push('name');
      }

      // Use upsert to handle race conditions
      const insertData = {
        email: safeEmail,
        name: safeName,
        user_id: userId,
        role: profileData.role || null,
        company: profileData.company || null,
        company_size_band: profileData.companySize || null,
        primary_focus: profileData.primaryFocus || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try insert first
      const { data: newProfile, error: insertError } = await supabase
        .from('leaders')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        // If insert failed due to unique constraint, try to get existing
        if (insertError.code === '23505' || insertError.message.includes('unique')) {
          console.log('⚠️ Insert failed due to unique constraint, trying to find existing...');
          
          // Try to find by email
          const { data: existingProfile } = await supabase
            .from('leaders')
            .select('id')
            .eq('email', safeEmail)
            .maybeSingle();

          if (existingProfile) {
            profileId = existingProfile.id;
            isNew = false;
            console.log('✅ Found existing profile after conflict:', profileId);
          } else {
            // Try to find by user_id if provided
            if (userId) {
              const { data: existingByUserId } = await supabase
                .from('leaders')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

              if (existingByUserId) {
                profileId = existingByUserId.id;
                isNew = false;
                console.log('✅ Found existing profile by user_id after conflict:', profileId);
              }
            }
          }

          if (!profileId) {
            errors.push(`Failed to create profile: ${insertError.message}`);
            return {
              success: false,
              profileId: null,
              isNew: false,
              errors,
              fallbacksUsed
            };
          }
        } else {
          errors.push(`Failed to create profile: ${insertError.message}`);
          return {
            success: false,
            profileId: null,
            isNew: false,
            errors,
            fallbacksUsed
          };
        }
      } else if (newProfile) {
        profileId = newProfile.id;
        isNew = true;
        console.log('✅ Created new profile:', profileId);
      } else {
        errors.push('Failed to create profile: No data returned');
        return {
          success: false,
          profileId: null,
          isNew: false,
          errors,
          fallbacksUsed
        };
      }
    }

    return {
      success: true,
      profileId,
      isNew,
      errors,
      fallbacksUsed
    };
  } catch (error: any) {
    console.error('❌ Error in lookupOrCreateProfile:', error);
    errors.push(`Unexpected error: ${error.message || String(error)}`);
    return {
      success: false,
      profileId: null,
      isNew: false,
      errors,
      fallbacksUsed
    };
  }
}

/**
 * Validates profile data and returns safe defaults
 */
export function validateProfileData(input: unknown): {
  valid: boolean;
  data: ProfileData;
  errors: string[];
} {
  const errors: string[] = [];
  const inputObj = input as Record<string, unknown> | null | undefined;

  const data: ProfileData = {
    email: '',
    name: null,
    userId: null,
    role: null,
    company: null,
    companySize: null,
    primaryFocus: null
  };

  // Validate email
  if (typeof inputObj?.email === 'string' && inputObj.email.trim().length > 0) {
    const email = normalizeEmail(inputObj.email);
    if (email.includes('@')) {
      data.email = email;
    } else {
      errors.push('Invalid email format');
    }
  } else {
    errors.push('Email is required');
  }

  // Validate name (optional)
  if (typeof inputObj?.name === 'string' && inputObj.name.trim().length > 0) {
    data.name = inputObj.name.trim();
  }

  // Validate userId (optional)
  if (typeof inputObj?.userId === 'string' && inputObj.userId.trim().length > 0) {
    data.userId = inputObj.userId.trim();
  }

  // Optional fields
  if (typeof inputObj?.role === 'string') data.role = inputObj.role.trim();
  if (typeof inputObj?.company === 'string') data.company = inputObj.company.trim();
  if (typeof inputObj?.companySize === 'string') data.companySize = inputObj.companySize.trim();
  if (typeof inputObj?.primaryFocus === 'string') data.primaryFocus = inputObj.primaryFocus.trim();

  return {
    valid: errors.length === 0,
    data,
    errors
  };
}
