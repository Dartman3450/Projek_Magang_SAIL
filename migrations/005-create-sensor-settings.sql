-- Migration: Create sensor_settings table for cross-device sync
-- Purpose: Store tank configuration (dimensions, shape, etc.) in database
-- so all devices can access the same settings

CREATE TABLE IF NOT EXISTS sensor_settings (
  id SERIAL PRIMARY KEY,
  
  -- Sensor identification
  fixed_id VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'slurry_1', 's1_treat_water', 'diesel'
  key VARCHAR(10),                         -- e.g., 's1', 's5', 'p1'
  name VARCHAR(255) NOT NULL,              -- Display name: "TREAT WATER 1", "Solar", etc.
  
  -- Physical configuration
  shape VARCHAR(20) DEFAULT 'persegi',     -- 'persegi' or 'silinder'
  orientasi VARCHAR(20) DEFAULT 'vertikal', -- 'vertikal' or 'horizontal'
  
  -- Dimensions (in meters for formula compatibility)
  tinggi NUMERIC(8,3),       -- Height in m
  panjang NUMERIC(8,3),      -- Length in m (for horizontal tanks)
  lebar NUMERIC(8,3),        -- Width in m (for rectangular tanks)
  diameter NUMERIC(8,3),     -- Diameter in m (for cylindrical tanks)
  
  -- Sensor calibration
  sensor_zero_cm NUMERIC(8,2) DEFAULT 0,  -- Zero point in cm
  
  -- Alert thresholds (percentage)
  warn_pct INT DEFAULT 40,   -- Warning threshold
  crit_pct INT DEFAULT 15,   -- Critical threshold
  
  -- Meta
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  settings_data JSONB,       -- Extra settings as JSON (future-proof)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT sensor_shape_check CHECK (shape IN ('persegi', 'silinder')),
  CONSTRAINT sensor_orientasi_check CHECK (orientasi IN ('vertikal', 'horizontal'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sensor_settings_fixed_id ON sensor_settings(fixed_id);
CREATE INDEX IF NOT EXISTS idx_sensor_settings_key ON sensor_settings(key);
CREATE INDEX IF NOT EXISTS idx_sensor_settings_active ON sensor_settings(is_active);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sensor_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sensor_settings_timestamp ON sensor_settings;
CREATE TRIGGER trigger_sensor_settings_timestamp
BEFORE UPDATE ON sensor_settings
FOR EACH ROW
EXECUTE FUNCTION update_sensor_settings_timestamp();
