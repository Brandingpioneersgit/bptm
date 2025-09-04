-- Migration: create_employees_table
-- Source: 01_create_employees_table.sql
-- Timestamp: 20240102000200

-- =====================================================
-- EMPLOYEES TABLE - Complete Schema with Sample Data
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the employees table with proper constraints and sample data

-- Drop existing table if you need to recreate it
-- DROP TABLE IF EXISTS public.employees CASCADE;

-- This migration is skipped as employees table is created in the optimized schema migration
-- All employees table functionality is consolidated in 20240102000100_optimized_employees_schema.sql

-- This migration file is intentionally minimal as the employees table
-- is fully handled in 20240102000100_optimized_employees_schema.sql
-- This file exists only to maintain proper migration sequence numbering

-- No operations needed - all employees functionality is in the optimized schema