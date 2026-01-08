-- Enable UUID extension if we want to use UUIDs later, but Serial is fine for now
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clinics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medics (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  specialization VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  medic_id INTEGER REFERENCES medics(id) ON DELETE SET NULL, 
  full_name VARCHAR(255) NOT NULL,
  dob DATE,
  gender VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS charts (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teeth (
  id SERIAL PRIMARY KEY,
  chart_id INTEGER REFERENCES charts(id) ON DELETE CASCADE,
  iso_number INTEGER NOT NULL,
  is_missing BOOLEAN DEFAULT FALSE,
  to_be_extracted BOOLEAN DEFAULT FALSE,
  
  -- Complex nested structures stored as JSONB
  endodontic_data JSONB DEFAULT '{}',
  periodontal_data JSONB DEFAULT '{}',
  pathology_data JSONB DEFAULT '{}',
  restoration_data JSONB DEFAULT '{}',
  
  UNIQUE(chart_id, iso_number)
);

CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  results JSONB, -- The raw output from ML
  uploaded_at TIMESTAMP DEFAULT NOW()
);
