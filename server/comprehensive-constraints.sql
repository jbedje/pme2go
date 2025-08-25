-- Comprehensive Database Constraints for PME2GO
-- This migration adds advanced constraints, validations, and security measures

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE COMPREHENSIVE CONSTRAINTS
-- Add check constraints for data validation
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_type_valid 
    CHECK (type IN ('PME/Startup', 'Expert/Consultant', 'Mentor', 'Investisseur', 'Incubateur'));

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_name_length 
    CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_phone_format 
    CHECK (phone IS NULL OR phone ~ '^[\+]?[0-9\s\-\(\)]{10,20}$');

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_password_hash_length 
    CHECK (LENGTH(password_hash) >= 20);

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_account_status_valid 
    CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification', 'deleted'));

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_failed_attempts_range 
    CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 10);

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_bio_length 
    CHECK (bio IS NULL OR LENGTH(bio) <= 5000);

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_locked_until_future 
    CHECK (locked_until IS NULL OR locked_until > NOW());

-- Add constraint to ensure role is set for admin/super_admin users
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_users_admin_role_valid 
    CHECK (role IS NULL OR role IN ('admin', 'super_admin', 'moderator'));

-- 2. OPPORTUNITIES TABLE COMPREHENSIVE CONSTRAINTS
ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_title_length 
    CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200);

ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_description_length 
    CHECK (LENGTH(description) >= 20 AND LENGTH(description) <= 10000);

ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_type_valid 
    CHECK (type IN ('funding', 'partnership', 'mentoring', 'job', 'internship', 'collaboration', 'investment'));

ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_status_valid 
    CHECK (status IN ('open', 'closed', 'draft', 'expired', 'filled'));

ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_budget_positive 
    CHECK (budget IS NULL OR budget >= 0);

ALTER TABLE opportunities ADD CONSTRAINT IF NOT EXISTS chk_opportunities_expires_future 
    CHECK (expires_at IS NULL OR expires_at > created_at);

-- Ensure author_id references valid user UUID
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS fk_opportunities_author_uuid;
ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_author_uuid 
    FOREIGN KEY (author_id) REFERENCES users(uuid) ON DELETE CASCADE 
    DEFERRABLE INITIALLY DEFERRED;

-- 3. MESSAGES TABLE COMPREHENSIVE CONSTRAINTS
ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_messages_content_length 
    CHECK (LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 50000);

ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_messages_type_valid 
    CHECK (message_type IN ('text', 'image', 'file', 'video', 'audio', 'link'));

ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_messages_read_after_created 
    CHECK (read_at IS NULL OR read_at >= created_at);

ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_messages_deleted_after_created 
    CHECK (deleted_at IS NULL OR deleted_at >= created_at);

-- 4. NOTIFICATIONS TABLE COMPREHENSIVE CONSTRAINTS
ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS chk_notifications_title_length 
    CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 255);

ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS chk_notifications_content_length 
    CHECK (content IS NULL OR LENGTH(content) <= 5000);

ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS chk_notifications_type_valid 
    CHECK (type IN ('message', 'application', 'connection', 'event', 'system', 'welcome', 'security', 'reminder'));

ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS chk_notifications_read_after_created 
    CHECK (read_at IS NULL OR read_at >= created_at);

ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS chk_notifications_expires_future 
    CHECK (expires_at IS NULL OR expires_at > created_at);

ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS chk_notifications_action_url_format 
    CHECK (action_url IS NULL OR action_url ~ '^https?://|^/');

-- 5. USER_CONNECTIONS TABLE COMPREHENSIVE CONSTRAINTS
ALTER TABLE user_connections ADD CONSTRAINT IF NOT EXISTS chk_connections_type_valid 
    CHECK (connection_type IN ('favorite', 'connection', 'blocked', 'following'));

ALTER TABLE user_connections ADD CONSTRAINT IF NOT EXISTS chk_connections_status_valid 
    CHECK (status IN ('active', 'pending', 'declined', 'blocked'));

-- Prevent circular blocking relationships
CREATE OR REPLACE FUNCTION prevent_mutual_blocking() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.connection_type = 'blocked' THEN
        -- Check if the other user has blocked this user
        IF EXISTS (
            SELECT 1 FROM user_connections 
            WHERE user_id = NEW.connected_user_id 
            AND connected_user_id = NEW.user_id 
            AND connection_type = 'blocked' 
            AND status = 'active'
        ) THEN
            RAISE EXCEPTION 'Cannot create mutual blocking relationship';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_mutual_blocking_trigger ON user_connections;
CREATE TRIGGER prevent_mutual_blocking_trigger
    BEFORE INSERT OR UPDATE ON user_connections
    FOR EACH ROW EXECUTE FUNCTION prevent_mutual_blocking();

-- 6. USER_SESSIONS TABLE COMPREHENSIVE CONSTRAINTS
ALTER TABLE user_sessions ADD CONSTRAINT IF NOT EXISTS chk_sessions_token_length 
    CHECK (LENGTH(refresh_token_hash) >= 20);

ALTER TABLE user_sessions ADD CONSTRAINT IF NOT EXISTS chk_sessions_expires_future 
    CHECK (expires_at > created_at);

ALTER TABLE user_sessions ADD CONSTRAINT IF NOT EXISTS chk_sessions_last_used_valid 
    CHECK (last_used_at >= created_at);

ALTER TABLE user_sessions ADD CONSTRAINT IF NOT EXISTS chk_sessions_revoked_after_created 
    CHECK (revoked_at IS NULL OR revoked_at >= created_at);

-- 7. OPPORTUNITY_APPLICATIONS TABLE COMPREHENSIVE CONSTRAINTS
ALTER TABLE opportunity_applications ADD CONSTRAINT IF NOT EXISTS chk_applications_status_valid 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'shortlisted'));

ALTER TABLE opportunity_applications ADD CONSTRAINT IF NOT EXISTS chk_applications_cover_letter_length 
    CHECK (cover_letter IS NULL OR LENGTH(cover_letter) <= 5000);

ALTER TABLE opportunity_applications ADD CONSTRAINT IF NOT EXISTS chk_applications_updated_after_applied 
    CHECK (updated_at >= applied_at);

-- 8. EVENT_REGISTRATIONS TABLE COMPREHENSIVE CONSTRAINTS  
ALTER TABLE event_registrations ADD CONSTRAINT IF NOT EXISTS chk_event_registrations_status_valid 
    CHECK (status IN ('registered', 'attended', 'cancelled', 'no_show', 'waitlisted'));

ALTER TABLE event_registrations ADD CONSTRAINT IF NOT EXISTS chk_event_registrations_updated_after_registered 
    CHECK (updated_at >= registered_at);

-- 9. EVENTS TABLE COMPREHENSIVE CONSTRAINTS
ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS chk_events_title_length 
    CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 200);

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS chk_events_description_length 
    CHECK (description IS NULL OR LENGTH(description) <= 10000);

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS chk_events_max_attendees_positive 
    CHECK (max_attendees IS NULL OR max_attendees > 0);

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS chk_events_date_future 
    CHECK (event_date >= created_at);

-- 10. CREATE AUDIT LOG TABLE FOR TRACKING CHANGES
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(uuid) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON audit_log(changed_by);

-- 11. CREATE GENERIC AUDIT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, 
        record_id, 
        operation, 
        old_values, 
        new_values,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.uuid, OLD.uuid),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_opportunities ON opportunities;
CREATE TRIGGER audit_opportunities AFTER INSERT OR UPDATE OR DELETE ON opportunities 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_connections ON user_connections;
CREATE TRIGGER audit_user_connections AFTER INSERT OR UPDATE OR DELETE ON user_connections 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 12. CREATE SYSTEM SETTINGS TABLE WITH CONSTRAINTS
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_settings_key_format CHECK (key ~ '^[a-z][a-z0-9_]*$'),
    CONSTRAINT chk_settings_key_length CHECK (LENGTH(key) >= 3 AND LENGTH(key) <= 100)
);

-- Add trigger for system_settings updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
    ('maintenance_mode', '{"enabled": false, "message": "System under maintenance"}', 'Maintenance mode configuration'),
    ('user_registration', '{"enabled": true, "require_verification": true}', 'User registration settings'),
    ('rate_limits', '{"auth_attempts": 5, "general_requests": 100, "window_minutes": 15}', 'Rate limiting configuration'),
    ('notifications', '{"email_enabled": true, "push_enabled": false}', 'Notification preferences'),
    ('file_uploads', '{"max_size_mb": 10, "allowed_types": ["jpg", "png", "pdf", "doc", "docx"]}', 'File upload restrictions')
ON CONFLICT (key) DO NOTHING;

-- 13. CREATE SECURITY POLICIES FOR ROW LEVEL SECURITY (RLS)
-- Enable RLS on sensitive tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for messages (users can only see their own messages)
CREATE POLICY messages_policy ON messages
    USING (sender_id = current_setting('app.current_user_id')::UUID 
           OR receiver_id = current_setting('app.current_user_id')::UUID);

-- Create policies for notifications (users can only see their own notifications)
CREATE POLICY notifications_policy ON notifications
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Create policies for user_connections (users can see connections they're part of)
CREATE POLICY connections_policy ON user_connections
    USING (user_id = current_setting('app.current_user_id')::UUID 
           OR connected_user_id = current_setting('app.current_user_id')::UUID);

-- 14. CREATE INDEXES FOR PERFORMANCE AND CONSTRAINTS
-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_users_active_email ON users(email) WHERE account_status = 'active';
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON opportunities(created_at, type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_future ON events(event_date) WHERE event_date > NOW() AND is_active = true;

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_pending ON opportunity_applications(opportunity_id, status) WHERE status = 'pending';

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_info ON user_sessions USING GIN (device_info);
CREATE INDEX IF NOT EXISTS idx_opportunity_applications_data ON opportunity_applications USING GIN (application_data);
CREATE INDEX IF NOT EXISTS idx_event_registrations_data ON event_registrations USING GIN (registration_data);
CREATE INDEX IF NOT EXISTS idx_system_settings_value ON system_settings USING GIN (value);

-- 15. CREATE FUNCTIONS FOR DATA VALIDATION AND CLEANUP
-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR revoked_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO audit_log (table_name, record_id, operation, new_values, changed_at)
    VALUES ('user_sessions', gen_random_uuid(), 'CLEANUP', 
            json_build_object('deleted_sessions', deleted_count), NOW());
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (keep last 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_log 
    WHERE changed_at < NOW() - INTERVAL '6 months';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and fix data inconsistencies
CREATE OR REPLACE FUNCTION validate_data_integrity() RETURNS TABLE(
    table_name TEXT, 
    issue_type TEXT, 
    issue_count INTEGER, 
    fixed_count INTEGER
) AS $$
BEGIN
    -- Check for users without proper email format (this should be caught by constraints)
    RETURN QUERY
    SELECT 'users'::TEXT, 'invalid_email'::TEXT, 
           COUNT(*)::INTEGER, 0::INTEGER
    FROM users 
    WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    -- Check for orphaned messages (shouldn't happen with FK constraints)
    RETURN QUERY
    SELECT 'messages'::TEXT, 'orphaned_messages'::TEXT,
           COUNT(*)::INTEGER, 0::INTEGER
    FROM messages m
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.uuid = m.sender_id)
       OR NOT EXISTS (SELECT 1 FROM users u WHERE u.uuid = m.receiver_id);
    
    -- Check for applications to non-existent opportunities
    RETURN QUERY
    SELECT 'opportunity_applications'::TEXT, 'orphaned_applications'::TEXT,
           COUNT(*)::INTEGER, 0::INTEGER
    FROM opportunity_applications oa
    WHERE NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.uuid = oa.opportunity_id);
END;
$$ LANGUAGE plpgsql;

-- 16. CREATE PERFORMANCE MONITORING VIEW
CREATE OR REPLACE VIEW system_performance_view AS
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE account_status = 'active') as active_records,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::INTEGER as avg_age_days
FROM users
UNION ALL
SELECT 
    'opportunities',
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
    COUNT(*) FILTER (WHERE is_active = true),
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::INTEGER
FROM opportunities
UNION ALL
SELECT 
    'messages',
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
    COUNT(*) FILTER (WHERE read_at IS NOT NULL),
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::INTEGER
FROM messages;

-- 17. GRANT APPROPRIATE PERMISSIONS
-- Create application role for backend services
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pme2go_app') THEN
        CREATE ROLE pme2go_app LOGIN PASSWORD 'secure_app_password_2024!';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE postgres TO pme2go_app;
GRANT USAGE ON SCHEMA public TO pme2go_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pme2go_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pme2go_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pme2go_app;

-- Create read-only role for analytics/reporting
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pme2go_readonly') THEN
        CREATE ROLE pme2go_readonly LOGIN PASSWORD 'readonly_password_2024!';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO pme2go_readonly;
GRANT USAGE ON SCHEMA public TO pme2go_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pme2go_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO pme2go_readonly;

-- Revoke sensitive permissions from readonly role
REVOKE SELECT ON audit_log FROM pme2go_readonly;
REVOKE SELECT ON user_sessions FROM pme2go_readonly;

COMMIT;

-- Display constraint summary
SELECT 
    constraint_name, 
    table_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
ORDER BY table_name, constraint_type;