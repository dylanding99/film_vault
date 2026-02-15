-- Migration 007: Add city and country columns to photos table
-- These fields will cache the location information from geocoding

-- Add city column for storing location city name
ALTER TABLE photos ADD COLUMN city TEXT;

-- Add country column for storing location country name
ALTER TABLE photos ADD COLUMN country TEXT;
