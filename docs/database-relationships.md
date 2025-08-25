# PME2GO Database Relationships Documentation

## Overview
This document describes the database schema and foreign key relationships implemented in the PME2GO platform for data integrity and referential consistency.

## Database Schema Summary

### Core Tables

#### 1. `users` - Main user profiles table
- **Primary Key**: `id` (INTEGER)
- **Unique Keys**: `uuid` (VARCHAR(50)), `email` (VARCHAR(255))
- **Relationships**: Referenced by all other tables as the main entity

#### 2. `messages` - User-to-user messaging
- **Primary Key**: `id` (INTEGER)
- **Foreign Keys**:
  - `sender_id` → `users.id` (CASCADE DELETE)
  - `receiver_id` → `users.id` (CASCADE DELETE)
- **Constraints**: Both sender_id and receiver_id are NOT NULL

#### 3. `notifications` - System notifications
- **Primary Key**: `id` (INTEGER)
- **Foreign Keys**:
  - `user_id` → `users.uuid` (CASCADE DELETE)
  - `from_user_id` → `users.uuid` (SET NULL ON DELETE)
- **Note**: Uses UUID references instead of integer IDs for compatibility

#### 4. `opportunities` - Business opportunities/projects
- **Primary Key**: `id` (INTEGER)
- **Foreign Keys**:
  - `author_id` → `users.id` (CASCADE DELETE)

#### 5. `applications` - User applications to opportunities
- **Primary Key**: `id` (INTEGER)
- **Foreign Keys**:
  - `user_id` → `users.id` (CASCADE DELETE)
  - `opportunity_id` → `opportunities.id` (CASCADE DELETE)
- **Unique Constraint**: `(user_id, opportunity_id)` - prevents duplicate applications

#### 6. `events` - Platform events and meetups
- **Primary Key**: `id` (INTEGER)
- **Foreign Keys**:
  - `organizer_id` → `users.id` (SET NULL ON DELETE)

#### 7. `event_registrations` - User event registrations
- **Primary Key**: `id` (INTEGER)
- **Foreign Keys**:
  - `user_id` → `users.id` (CASCADE DELETE)
  - `event_id` → `events.id` (CASCADE DELETE)
- **Unique Constraint**: `(user_id, event_id)` - prevents duplicate registrations

#### 8. `favorites` - User favorites/bookmarks
- **Primary Key**: `id` (INTEGER)
- **Foreign Keys**:
  - `user_id` → `users.id` (CASCADE DELETE)
  - `profile_id` → `users.id` (CASCADE DELETE)
- **Unique Constraint**: `(user_id, profile_id)` - prevents duplicate favorites

### New Relationship Tables (Added in Foreign Key Migration)

#### 9. `user_connections` - User-to-user connections/network
- **Primary Key**: `id` (INTEGER)
- **Unique Key**: `uuid` (VARCHAR(50))
- **Foreign Keys**:
  - `requester_id` → `users.id` (CASCADE DELETE)
  - `addressee_id` → `users.id` (CASCADE DELETE)
- **Constraints**:
  - `UNIQUE(requester_id, addressee_id)` - prevents duplicate connection requests
  - `CHECK(requester_id != addressee_id)` - prevents self-connections
  - `status` must be one of: 'pending', 'accepted', 'declined', 'blocked'

#### 10. `user_documents` - File uploads and document management
- **Primary Key**: `id` (INTEGER)
- **Unique Key**: `uuid` (VARCHAR(50))
- **Foreign Keys**:
  - `user_id` → `users.id` (CASCADE DELETE)
- **Constraints**:
  - `document_type` must be one of: 'avatar', 'document', 'certificate', 'portfolio'
  - All file metadata fields are NOT NULL

## Foreign Key Relationships Summary

| Child Table | Child Column | Parent Table | Parent Column | Delete Rule | Update Rule |
|-------------|--------------|--------------|---------------|-------------|-------------|
| applications | user_id | users | id | CASCADE | NO ACTION |
| applications | opportunity_id | opportunities | id | CASCADE | NO ACTION |
| event_registrations | user_id | users | id | CASCADE | NO ACTION |
| event_registrations | event_id | events | id | CASCADE | NO ACTION |
| events | organizer_id | users | id | SET NULL | NO ACTION |
| favorites | user_id | users | id | CASCADE | NO ACTION |
| favorites | profile_id | users | id | CASCADE | NO ACTION |
| messages | sender_id | users | id | CASCADE | NO ACTION |
| messages | receiver_id | users | id | CASCADE | NO ACTION |
| notifications | user_id | users | uuid | CASCADE | CASCADE |
| notifications | from_user_id | users | uuid | SET NULL | CASCADE |
| opportunities | author_id | users | id | CASCADE | NO ACTION |
| user_connections | requester_id | users | id | CASCADE | NO ACTION |
| user_connections | addressee_id | users | id | CASCADE | NO ACTION |
| user_documents | user_id | users | id | CASCADE | NO ACTION |

## Data Integrity Features

### 1. **Cascade Delete Protection**
- When a user is deleted, all their related data (messages, notifications, applications, etc.) are automatically removed
- Organizer references in events are set to NULL instead of cascading to preserve event history

### 2. **Referential Integrity**
- All foreign key constraints prevent insertion of invalid references
- No orphaned records can exist in the database
- Data consistency is maintained at the database level

### 3. **Business Logic Constraints**
- Users cannot connect to themselves
- Users cannot apply to the same opportunity twice
- Users cannot register for the same event multiple times
- Users cannot favorite the same profile twice

### 4. **Index Optimization**
All foreign key columns have indexes for optimal query performance:
- Single-column indexes on all FK columns
- Composite indexes on frequently queried combinations
- Unique indexes prevent duplicate relationships

## Migration History

### Foreign Key Migration (Latest)
- **Fixed notifications table UUID data type inconsistency**
- **Added missing foreign key constraints for notifications**
- **Created user_connections table for networking features**
- **Created user_documents table for file management**
- **Added comprehensive constraints and validation rules**
- **Implemented proper cascade delete policies**

## Usage Guidelines

### 1. **Adding New Relationships**
```sql
-- Always include foreign key constraints for new tables
ALTER TABLE new_table 
ADD CONSTRAINT fk_new_table_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE NO ACTION;
```

### 2. **Query Optimization**
- Use JOINs instead of subqueries where possible
- Foreign key indexes automatically optimize JOIN operations
- Consider composite indexes for multi-column WHERE clauses

### 3. **Data Modification**
- DELETE operations automatically cascade where configured
- UPDATE operations are protected by foreign key constraints
- Always verify data integrity after bulk operations

## Monitoring and Maintenance

### 1. **Constraint Violation Monitoring**
- Monitor application logs for foreign key constraint errors
- Set up alerts for unusual constraint violation patterns
- Regularly validate data integrity with the test scripts

### 2. **Performance Monitoring**
- Monitor foreign key index usage
- Check for slow JOINs in query performance logs
- Consider additional indexes for frequently joined columns

### 3. **Database Health Checks**
- Run the `test-foreign-keys.js` script regularly
- Validate referential integrity with the `analyze-schema.js` script
- Monitor for orphaned records (should be impossible with proper constraints)

## Related Files

- `server/foreign-key-migration.js` - Main migration script
- `server/test-foreign-keys.js` - Constraint testing script
- `server/analyze-schema.js` - Schema analysis script
- `server/profile-migration.js` - Profile fields migration
- `server/quick-migrate.js` - Initial security migration

## Next Steps

1. **Add comprehensive database constraints** (CHECK constraints, additional validations)
2. **Create admin dashboard** for user and relationship management
3. **Implement email verification** with proper referential integrity
4. **Add password reset functionality** with secure token management
5. **Create API documentation** including relationship endpoints