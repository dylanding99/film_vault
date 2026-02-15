-- Migration 008: Add location columns to rolls table
-- These fields will store roll-level location information

-- Add city column for storing location city name
ALTER TABLE rolls ADD COLUMN city TEXT;

-- Add country column for storing location country name
ALTER TABLE rolls ADD COLUMN country TEXT;

-- Add latitude column for storing GPS latitude
ALTER TABLE rolls ADD COLUMN lat REAL;

-- Add longitude column for storing GPS longitude
ALTER TABLE rolls ADD COLUMN lon REAL;
