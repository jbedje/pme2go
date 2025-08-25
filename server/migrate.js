const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { demoUsers, demoOpportunities, demoMessages, demoEvents } = require('../src/data/demoData');
const bcrypt = require('bcrypt');

async function runMigration() {
  console.log('Starting database migration...');
  
  try {
    // Test connection first
    await pool.query('SELECT 1');
    console.log('✓ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Continuing with migration attempt...');
  }
  
  const client = await pool.connect();
  
  try {
    
    // Read and execute schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✓ Database schema created');
    
    // Clear existing data
    await client.query('TRUNCATE TABLE notifications, event_registrations, favorites, applications, messages, events, opportunities, users RESTART IDENTITY CASCADE');
    console.log('✓ Existing data cleared');
    
    // Insert demo users
    for (let i = 0; i < demoUsers.length; i++) {
      const user = demoUsers[i];
      const hashedPassword = await bcrypt.hash('demo123', 10);
      
      const userQuery = `
        INSERT INTO users (
          uuid, name, email, password_hash, type, industry, location, description,
          avatar, verified, website, linkedin, stage, funding, employees, revenue,
          interests, expertise, experience, rates, availability, languages,
          certifications, mentees, success_stories, programs, duration, equity,
          mentors, startups, success_rate, sectors, fund_size, ticket_size,
          portfolio, geo_focus, investment_criteria, products, amounts,
          duration_range, criteria, stats, profile_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43)
        RETURNING id, uuid
      `;
      
      const values = [
        user.id,
        user.name,
        user.email,
        hashedPassword,
        user.type,
        user.industry,
        user.location,
        user.description,
        user.avatar,
        user.verified || false,
        user.website || null,
        user.linkedin || null,
        user.stage || null,
        user.funding || null,
        user.employees || null,
        user.revenue || null,
        user.interests || null,
        user.expertise || null,
        user.experience || null,
        user.rates || null,
        user.availability || null,
        user.languages || null,
        user.certifications || null,
        user.mentees || null,
        user.successStories || null,
        user.programs || null,
        user.duration || null,
        user.equity || null,
        user.mentors || null,
        user.startups || null,
        user.successRate || null,
        user.sectors || null,
        user.fundSize || null,
        user.ticketSize || null,
        typeof user.portfolio === 'number' ? user.portfolio : null, // Fix: Handle both array and number
        user.geoFocus || null,
        user.investmentCriteria || null,
        user.products || null,
        user.amounts || null,
        user.duration || null,
        user.criteria || null,
        JSON.stringify(user.stats || {}),
        JSON.stringify({
          achievements: user.achievements,
          documents: user.documents,
          portfolio: Array.isArray(user.portfolio) ? user.portfolio : null, // Store array portfolio in profile_data
          specialties: user.specialties,
          mentoring: user.mentoring,
          facilities: user.facilities,
          services: user.services,
          team: user.team,
          exits: user.exits,
          returns: user.returns,
          advantages: user.advantages,
          partnerships: user.partnerships
        })
      ];
      
      const result = await client.query(userQuery, values);
      console.log(`✓ User ${user.name} inserted with ID: ${result.rows[0].id}`);
    }
    
    // Insert demo opportunities
    for (const opportunity of demoOpportunities) {
      const oppQuery = `
        INSERT INTO opportunities (
          uuid, title, type, author_id, company, industry, location,
          budget, duration, description, requirements, tags, deadline,
          applicants, status
        ) VALUES ($1, $2, $3, (SELECT id FROM users WHERE uuid = $4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;
      
      await client.query(oppQuery, [
        opportunity.id,
        opportunity.title,
        opportunity.type,
        opportunity.authorId,
        opportunity.company,
        opportunity.industry,
        opportunity.location,
        opportunity.budget,
        opportunity.duration,
        opportunity.description,
        opportunity.requirements,
        opportunity.tags,
        opportunity.deadline,
        opportunity.applicants,
        opportunity.status
      ]);
    }
    console.log('✓ Demo opportunities inserted');
    
    // Insert demo messages
    for (const message of demoMessages) {
      const msgQuery = `
        INSERT INTO messages (
          uuid, sender_id, receiver_id, content, read_status
        ) VALUES ($1, (SELECT id FROM users WHERE uuid = $2), (SELECT id FROM users WHERE uuid = $3), $4, $5)
      `;
      
      await client.query(msgQuery, [
        message.id,
        message.senderId,
        message.receiverId,
        message.content,
        message.read
      ]);
    }
    console.log('✓ Demo messages inserted');
    
    // Insert demo events
    for (const event of demoEvents) {
      const eventQuery = `
        INSERT INTO events (
          uuid, title, type, organizer, event_date, location,
          description, attendees, price, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      
      await client.query(eventQuery, [
        event.id,
        event.title,
        event.type,
        event.organizer,
        event.date,
        event.location,
        event.description,
        event.attendees,
        event.price,
        event.tags
      ]);
    }
    console.log('✓ Demo events inserted');
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };