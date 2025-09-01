-- Initialize SprintSync database
-- This script runs when the database container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create initial database structure will be handled by Prisma migrations
-- This file can be extended with any additional database setup needed

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'SprintSync database initialized at %', NOW();
END $$;
