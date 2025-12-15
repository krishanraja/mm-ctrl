-- Fix security warnings from previous migration

-- Fix search_path for new functions
ALTER FUNCTION generate_referral_code(UUID, TEXT) SET search_path = public;
ALTER FUNCTION track_referral_conversion(TEXT, UUID, TEXT, TEXT) SET search_path = public;

-- The RLS policies are already enabled in previous migration, this should resolve the warnings