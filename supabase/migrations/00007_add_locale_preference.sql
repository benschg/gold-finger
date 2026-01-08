-- ============================================
-- ADD LOCALE PREFERENCE TO PROFILES
-- ============================================
-- Adds locale column for i18n user preferences
-- NULL means "use client default (localStorage/browser)"

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT NULL
CHECK (locale IS NULL OR locale IN ('en', 'de', 'pt', 'kn'));

COMMENT ON COLUMN public.profiles.locale IS 'User language preference. NULL = use client default';
