-- Add 'server' to app_role enum (this must be committed separately)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'server';