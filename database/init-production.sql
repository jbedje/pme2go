-- PME2GO Production Database Initialization Script
-- This script sets up the production database with proper security and constraints

-- Create database and user (if not exists)
DO $$
BEGIN
    -- Create application user for API
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'pme2go_api') THEN
        CREATE USER pme2go_api WITH ENCRYPTED PASSWORD 'secure_api_password_here';
    END IF;
    
    -- Create read-only user for monitoring
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'pme2go_readonly') THEN
        CREATE USER pme2go_readonly WITH ENCRYPTED PASSWORD 'readonly_password_here';
    END IF;
    
    -- Create backup user
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'pme2go_backup') THEN
        CREATE USER pme2go_backup WITH ENCRYPTED PASSWORD 'backup_password_here';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE pme2go TO pme2go_api, pme2go_readonly, pme2go_backup;
GRANT USAGE ON SCHEMA public TO pme2go_api, pme2go_readonly, pme2go_backup;

-- API user permissions (full access to tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pme2go_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pme2go_api;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pme2go_api;

-- Read-only user permissions (monitoring)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pme2go_readonly;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO pme2go_readonly;

-- Backup user permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pme2go_backup;

-- Set default permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pme2go_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO pme2go_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO pme2go_readonly, pme2go_backup;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configure database for production
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Performance settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Security settings
ALTER SYSTEM SET ssl = 'on';
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET log_failed_login_attempts = 'on';
ALTER SYSTEM SET log_statement = 'mod';

-- Logging settings
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET logging_collector = 'on';
ALTER SYSTEM SET log_directory = '/var/log/postgresql';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_rotation_age = '1d';
ALTER SYSTEM SET log_rotation_size = '100MB';
ALTER SYSTEM SET log_min_duration_statement = '1000ms';

-- Apply settings (requires restart)
SELECT pg_reload_conf();

-- Create monitoring views
CREATE OR REPLACE VIEW monitoring.database_stats AS
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public';

CREATE OR REPLACE VIEW monitoring.table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

CREATE OR REPLACE VIEW monitoring.slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 20;

-- Grant access to monitoring views
GRANT SELECT ON ALL TABLES IN SCHEMA monitoring TO pme2go_readonly;

-- Create indexes for performance (if not already created)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_skills ON user_profiles USING gin(skills);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_location ON user_profiles(city, country);

-- Update table statistics
ANALYZE;

-- Log initialization
INSERT INTO system_logs (level, message, context, metadata) 
VALUES ('info', 'Production database initialized successfully', 'DATABASE', '{"version": "1.0", "timestamp": "' || NOW() || '"}');

COMMIT;