-- inab database initialization
-- This file runs automatically when the PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'inab database initialized successfully';
END $$;
