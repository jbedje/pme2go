-- Enhanced database schema for PME2GO with security improvements
-- Run this to update the existing database structure

-- Add new columns to users table for security
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Update users table to ensure password_hash column exists and is properly sized
ALTER TABLE users 
ALTER COLUMN password_hash TYPE VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_industry ON users(industry);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Create messages table with proper relationships
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,
    
    CONSTRAINT messages_sender_receiver_check CHECK (sender_id != receiver_id)
);

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    action_url VARCHAR(500),
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NULL
);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Create connections/favorites table
CREATE TABLE IF NOT EXISTS user_connections (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    connection_type VARCHAR(50) DEFAULT 'favorite', -- 'favorite', 'connection', 'blocked'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'declined'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, connected_user_id, connection_type),
    CONSTRAINT connections_self_check CHECK (user_id != connected_user_id)
);

-- Add indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON user_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_connections_status ON user_connections(status);

-- Create user sessions table for token management (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP NULL
);

-- Add indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at ON user_sessions(revoked_at);

-- Enhance opportunities table with better relationships and indexes
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add foreign key constraint for opportunities author
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_opportunities_author'
    ) THEN
        -- First, let's check if we can add the constraint
        -- Update author_id to use UUID format if needed
        UPDATE opportunities 
        SET author_id = users.uuid::text 
        FROM users 
        WHERE opportunities.author_id = users.id::text 
        AND opportunities.author_id IS NOT NULL;
        
        -- Add the foreign key constraint
        ALTER TABLE opportunities 
        ADD CONSTRAINT fk_opportunities_author 
        FOREIGN KEY (author_id) REFERENCES users(uuid) ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_author_id ON opportunities(author_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_industry ON opportunities(industry);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_expires_at ON opportunities(expires_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_active ON opportunities(is_active);

-- Enhance events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS max_attendees INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add indexes for events
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- Create application/interest tracking table
CREATE TABLE IF NOT EXISTS opportunity_applications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(uuid) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
    cover_letter TEXT,
    application_data JSONB,
    applied_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(opportunity_id, applicant_id)
);

-- Add indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON opportunity_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON opportunity_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON opportunity_applications(applied_at);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(uuid) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
    registration_data JSONB,
    registered_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(event_id, participant_id)
);

-- Add indexes for event registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_participant_id ON event_registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Add trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at 
    BEFORE UPDATE ON opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats_view AS
SELECT 
    u.uuid as user_id,
    u.name,
    u.type,
    COUNT(DISTINCT uc1.connected_user_id) FILTER (WHERE uc1.connection_type = 'connection' AND uc1.status = 'active') as connections_count,
    COUNT(DISTINCT uc2.connected_user_id) FILTER (WHERE uc2.connection_type = 'favorite') as favorites_count,
    COUNT(DISTINCT o.uuid) as opportunities_created,
    COUNT(DISTINCT oa.uuid) as opportunities_applied,
    COUNT(DISTINCT er.uuid) as events_registered,
    COUNT(DISTINCT m.uuid) FILTER (WHERE m.sender_id = u.uuid) as messages_sent,
    COUNT(DISTINCT m2.uuid) FILTER (WHERE m2.receiver_id = u.uuid) as messages_received,
    u.created_at as member_since
FROM users u
LEFT JOIN user_connections uc1 ON u.uuid = uc1.user_id
LEFT JOIN user_connections uc2 ON u.uuid = uc2.user_id
LEFT JOIN opportunities o ON u.uuid = o.author_id::uuid
LEFT JOIN opportunity_applications oa ON u.uuid = oa.applicant_id
LEFT JOIN event_registrations er ON u.uuid = er.participant_id
LEFT JOIN messages m ON u.uuid = m.sender_id
LEFT JOIN messages m2 ON u.uuid = m2.receiver_id
GROUP BY u.uuid, u.name, u.type, u.created_at;

-- Update existing user records to have proper password hashes if they don't already
-- This is a one-time operation for demo data
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewRuddmnX4P1wgYu' -- password: 'password123'
WHERE password_hash = 'demo_password_hash' OR password_hash IS NULL OR LENGTH(password_hash) < 20;

-- Add some sample notifications for existing users
INSERT INTO notifications (user_id, type, title, content)
SELECT 
    uuid,
    'welcome',
    'Bienvenue sur PME2GO !',
    'Votre compte a été créé avec succès. Explorez la plateforme et connectez-vous avec d''autres entrepreneurs.'
FROM users 
WHERE NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE notifications.user_id = users.uuid 
    AND notifications.type = 'welcome'
);

-- Create some sample connections between users
INSERT INTO user_connections (user_id, connected_user_id, connection_type)
SELECT 
    u1.uuid,
    u2.uuid,
    'favorite'
FROM users u1
CROSS JOIN users u2
WHERE u1.uuid != u2.uuid
AND u1.type = 'PME/Startup'
AND u2.type IN ('Expert/Consultant', 'Mentor', 'Investisseur')
AND NOT EXISTS (
    SELECT 1 FROM user_connections 
    WHERE user_id = u1.uuid AND connected_user_id = u2.uuid
)
LIMIT 10; -- Limit to avoid creating too many connections

COMMIT;