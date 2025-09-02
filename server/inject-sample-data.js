const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pme-360-db',
  user: 'postgres',
  password: 'Postgres2024!'
});

const sampleUsers = [
  {
    name: 'TechStart Solutions',
    email: 'contact@techstart.fr',
    type: 'PME/Startup',
    industry: 'Technologie',
    location: 'Paris, France',
    description: 'Startup innovante dans le développement d\'applications mobiles et IoT',
    verified: true,
    role: 'user',
    stats: { connections: 45, projects: 12, rating: 4.8, reviews: 23 },
    profile_data: { 
      stage: 'Series A', 
      funding: '2M€', 
      employees: '15-25',
      website: 'https://techstart.fr',
      founded: '2021'
    }
  },
  {
    name: 'Marie Dubois',
    email: 'marie.dubois@consulting.fr',
    type: 'Expert/Consultant',
    industry: 'Marketing Digital',
    location: 'Lyon, France',
    description: 'Consultante senior en transformation digitale avec 15 ans d\'expérience',
    verified: true,
    role: 'user',
    stats: { connections: 128, projects: 87, rating: 4.9, reviews: 45 },
    profile_data: { 
      experience: '15+ ans', 
      specialties: ['Marketing Digital', 'Transformation', 'E-commerce'],
      rate: '800€/jour',
      availability: 'Disponible'
    }
  },
  {
    name: 'Jean-Pierre Martin',
    email: 'jp.martin@mentor.fr',
    type: 'Mentor',
    industry: 'Finance',
    location: 'Bordeaux, France',
    description: 'Ex-directeur financier, accompagne les startups dans leur développement',
    verified: true,
    role: 'user',
    stats: { connections: 89, projects: 34, rating: 4.7, reviews: 28 },
    profile_data: { 
      experience: '20+ ans', 
      expertise: ['Finance', 'Strategy', 'Fundraising'],
      mentees: 45,
      success_rate: '85%'
    }
  },
  {
    name: 'Innovation Hub Paris',
    email: 'contact@innovhub-paris.fr',
    type: 'Incubateur',
    industry: 'Innovation',
    location: 'Paris, France',
    description: 'Incubateur technologique accompagnant les startups deeptech',
    verified: true,
    role: 'user',
    stats: { connections: 234, projects: 156, rating: 4.6, reviews: 89 },
    profile_data: { 
      portfolio: 120, 
      sectors: ['DeepTech', 'IA', 'Biotech'],
      program_duration: '12 mois',
      success_rate: '72%'
    }
  },
  {
    name: 'Capital Ventures',
    email: 'deals@capitalventures.fr',
    type: 'Investisseur',
    industry: 'Capital Risque',
    location: 'Paris, France',
    description: 'Fonds d\'investissement spécialisé dans les startups tech B2B',
    verified: true,
    role: 'user',
    stats: { connections: 345, projects: 67, rating: 4.5, reviews: 34 },
    profile_data: { 
      aum: '50M€', 
      stage: 'Seed & Series A',
      ticket_size: '500k-5M€',
      portfolio: 45
    }
  },
  {
    name: 'Crédit Entreprise Plus',
    email: 'pro@creditentreprise.fr',
    type: 'Institution Financière',
    industry: 'Banque',
    location: 'Marseille, France',
    description: 'Banque spécialisée dans le financement des PME et startups',
    verified: true,
    role: 'user',
    stats: { connections: 567, projects: 234, rating: 4.3, reviews: 156 },
    profile_data: { 
      services: ['Crédit Pro', 'Leasing', 'Affacturage'],
      min_amount: '10k€',
      max_amount: '2M€',
      approval_rate: '78%'
    }
  },
  {
    name: 'BPI France Nouvelle-Aquitaine',
    email: 'contact@bpi-na.fr',
    type: 'Organisme Public',
    industry: 'Financement Public',
    location: 'Bordeaux, France',
    description: 'Accompagnement et financement des entreprises innovantes',
    verified: true,
    role: 'user',
    stats: { connections: 189, projects: 298, rating: 4.4, reviews: 67 },
    profile_data: { 
      programs: ['Innovation', 'Export', 'Numérique'],
      funding_types: ['Subventions', 'Prêts', 'Garanties'],
      region: 'Nouvelle-Aquitaine'
    }
  },
  {
    name: 'CloudTech Partners',
    email: 'partnerships@cloudtech.fr',
    type: 'Partenaire Tech',
    industry: 'Cloud Computing',
    location: 'Toulouse, France',
    description: 'Partenaire technologique spécialisé dans les solutions cloud et DevOps',
    verified: true,
    role: 'user',
    stats: { connections: 156, projects: 89, rating: 4.7, reviews: 42 },
    profile_data: { 
      technologies: ['AWS', 'Azure', 'Google Cloud'],
      services: ['Migration Cloud', 'DevOps', 'Sécurité'],
      certifications: ['AWS Partner', 'Microsoft Gold']
    }
  },
  {
    name: 'DataFlow Analytics',
    email: 'hello@dataflow.fr',
    type: 'PME/Startup',
    industry: 'Data Science',
    location: 'Nice, France',
    description: 'Plateforme d\'analyse de données pour les PME',
    verified: false,
    role: 'user',
    stats: { connections: 23, projects: 5, rating: 4.2, reviews: 8 },
    profile_data: { 
      stage: 'Seed', 
      funding: '300k€',
      employees: '5-10',
      founded: '2023'
    }
  },
  {
    name: 'Sophie Laurent',
    email: 'sophie@marketing-expert.fr',
    type: 'Expert/Consultant',
    industry: 'Marketing',
    location: 'Nantes, France',
    description: 'Spécialiste en growth hacking et marketing digital pour startups',
    verified: true,
    role: 'user',
    stats: { connections: 98, projects: 67, rating: 4.8, reviews: 34 },
    profile_data: { 
      experience: '8 ans', 
      specialties: ['Growth Hacking', 'SEO', 'Social Media'],
      rate: '600€/jour',
      availability: 'Partiellement disponible'
    }
  },
  {
    name: 'Admin PME2GO',
    email: 'admin@pme2go.com',
    type: 'System Admin',
    industry: 'Platform Management',
    location: 'Paris, France',
    description: 'Administrateur système de la plateforme PME2GO',
    verified: true,
    role: 'admin',
    stats: { connections: 0, projects: 0, rating: 5.0, reviews: 0 },
    profile_data: { 
      access_level: 'super_admin',
      responsibilities: ['User Management', 'System Health', 'Analytics']
    }
  }
];

const sampleOpportunities = [
  {
    title: 'Développeur Full-Stack React/Node.js',
    type: 'Mission',
    company: 'TechStart Solutions',
    industry: 'Technologie',
    location: 'Paris, France',
    budget: '45-60k€',
    duration: '6 mois',
    description: 'Recherche un développeur expérimenté pour notre nouvelle plateforme SaaS de gestion IoT',
    requirements: ['React 18+', 'Node.js', 'PostgreSQL', 'TypeScript', '3+ ans d\'expérience'],
    tags: ['React', 'Node.js', 'Full-Stack', 'IoT'],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 12,
    status: 'active'
  },
  {
    title: 'Consultant Marketing Digital - Mission 3 mois',
    type: 'Consulting',
    company: 'DataFlow Analytics',
    industry: 'Data Science',
    location: 'Nice, France / Remote',
    budget: '15k€',
    duration: '3 mois',
    description: 'Accompagnement pour développer notre stratégie marketing et acquisition client B2B',
    requirements: ['Marketing B2B', 'Growth Marketing', 'Analytics', 'SaaS experience'],
    tags: ['Marketing', 'B2B', 'SaaS', 'Growth'],
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 8,
    status: 'active'
  },
  {
    title: 'Recherche Investissement Série A - 2M€',
    type: 'Financement',
    company: 'TechStart Solutions',
    industry: 'Technologie',
    location: 'Paris, France',
    budget: '2M€',
    duration: 'Permanent',
    description: 'Levée de fonds Série A pour accélérer le développement international',
    requirements: ['VC Tech', 'Series A experience', 'International expansion', 'IoT/Mobile'],
    tags: ['Series A', 'Financement', 'International', 'IoT'],
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 5,
    status: 'active'
  },
  {
    title: 'Partenariat Technologique Cloud',
    type: 'Partenariat',
    company: 'Innovation Hub Paris',
    industry: 'Cloud Computing',
    location: 'Paris, France',
    budget: 'À définir',
    duration: 'Long terme',
    description: 'Recherche partenaire cloud pour accompagner nos startups dans leur migration',
    requirements: ['AWS/Azure certification', 'Startup experience', 'Support technique', 'Pricing préférentiel'],
    tags: ['Cloud', 'Partenariat', 'Startups', 'Migration'],
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 3,
    status: 'active'
  }
];

const sampleEvents = [
  {
    title: 'Pitch Night - Startups & Investisseurs',
    type: 'Networking',
    organizer: 'Innovation Hub Paris',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Paris, Station F',
    description: 'Soirée de networking entre startups et investisseurs avec sessions de pitch',
    attendees: 45,
    price: 'Gratuit',
    tags: ['Networking', 'Startups', 'Investissement', 'Pitch']
  },
  {
    title: 'Formation: Marketing Digital pour PME',
    type: 'Formation',
    organizer: 'Marie Dubois Consulting',
    event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Lyon, Métropole de Lyon',
    description: 'Formation intensive sur les stratégies marketing digital adaptées aux PME',
    attendees: 25,
    price: '299€',
    tags: ['Formation', 'Marketing', 'Digital', 'PME']
  },
  {
    title: 'Conférence: Financement des Startups 2024',
    type: 'Conférence',
    organizer: 'Capital Ventures',
    event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Paris, Palais des Congrès',
    description: 'Panorama des solutions de financement pour startups avec retours d\'expérience',
    attendees: 150,
    price: '99€',
    tags: ['Conférence', 'Financement', 'Startups', 'VC']
  },
  {
    title: 'Atelier: Cloud Migration Best Practices',
    type: 'Atelier',
    organizer: 'CloudTech Partners',
    event_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Toulouse, La Cantine',
    description: 'Atelier pratique sur les bonnes pratiques de migration vers le cloud',
    attendees: 30,
    price: '149€',
    tags: ['Atelier', 'Cloud', 'Migration', 'DevOps']
  }
];

async function injectSampleData() {
  try {
    console.log('🚀 Starting sample data injection...');

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing sample data...');
    await pool.query('DELETE FROM messages WHERE 1=1');
    await pool.query('DELETE FROM favorites WHERE 1=1');
    await pool.query('DELETE FROM events WHERE title LIKE \'%Pitch Night%\' OR title LIKE \'%Formation:%\' OR title LIKE \'%Conférence:%\' OR title LIKE \'%Atelier:%\'');
    await pool.query('DELETE FROM opportunities WHERE company IN (\'TechStart Solutions\', \'DataFlow Analytics\', \'Innovation Hub Paris\')');
    await pool.query('DELETE FROM users WHERE email LIKE \'%@techstart.fr\' OR email LIKE \'%@consulting.fr\' OR email LIKE \'%@mentor.fr\' OR email LIKE \'%@innovhub-paris.fr\' OR email LIKE \'%@capitalventures.fr\' OR email LIKE \'%@creditentreprise.fr\' OR email LIKE \'%@bpi-na.fr\' OR email LIKE \'%@cloudtech.fr\' OR email LIKE \'%@dataflow.fr\' OR email LIKE \'%@marketing-expert.fr\' OR email = \'admin@pme2go.com\'');

    // Insert sample users
    console.log('👥 Inserting sample users...');
    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      const uuid = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      const result = await pool.query(`
        INSERT INTO users (
          uuid, name, email, password_hash, type, industry, location, 
          description, avatar, verified, role, stats, profile_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING id, uuid, name
      `, [
        uuid,
        user.name,
        user.email,
        hashedPassword,
        user.type,
        user.industry,
        user.location,
        user.description,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`,
        user.verified,
        user.role,
        JSON.stringify(user.stats),
        JSON.stringify(user.profile_data)
      ]);
      
      console.log(`  ✓ Created user: ${result.rows[0].name} (${result.rows[0].uuid})`);
      
      // Store user ID for opportunities
      user.db_id = result.rows[0].id;
      user.uuid = result.rows[0].uuid;
    }

    // Insert sample opportunities
    console.log('💼 Inserting sample opportunities...');
    for (const opportunity of sampleOpportunities) {
      const author = sampleUsers.find(u => u.name === opportunity.company);
      if (!author) continue;
      
      const uuid = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      const result = await pool.query(`
        INSERT INTO opportunities (
          uuid, title, type, author_id, company, industry, location,
          budget, duration, description, requirements, tags, deadline,
          applicants, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING uuid, title
      `, [
        uuid,
        opportunity.title,
        opportunity.type,
        author.db_id,
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
      
      console.log(`  ✓ Created opportunity: ${result.rows[0].title} (${result.rows[0].uuid})`);
    }

    // Insert sample events
    console.log('📅 Inserting sample events...');
    for (const event of sampleEvents) {
      const uuid = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      const result = await pool.query(`
        INSERT INTO events (
          uuid, title, type, organizer, event_date, location,
          description, attendees, price, tags, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING uuid, title
      `, [
        uuid,
        event.title,
        event.type,
        event.organizer,
        event.event_date,
        event.location,
        event.description,
        event.attendees,
        event.price,
        event.tags
      ]);
      
      console.log(`  ✓ Created event: ${result.rows[0].title} (${result.rows[0].uuid})`);
    }

    // Add some sample messages between users
    console.log('💬 Adding sample messages...');
    const users = await pool.query('SELECT id, uuid, name FROM users ORDER BY created_at DESC LIMIT 5');
    
    if (users.rows.length >= 2) {
      const messageUuid1 = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const messageUuid2 = (Date.now() + 1000).toString() + Math.random().toString(36).substr(2, 9);
      
      await pool.query(`
        INSERT INTO messages (uuid, sender_id, receiver_id, content, created_at)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '2 hours')
      `, [
        messageUuid1,
        users.rows[0].id,
        users.rows[1].id,
        'Bonjour, je suis intéressé par votre profil pour un potentiel partenariat.'
      ]);

      await pool.query(`
        INSERT INTO messages (uuid, sender_id, receiver_id, content, created_at)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '1 hour')
      `, [
        messageUuid2,
        users.rows[1].id,
        users.rows[0].id,
        'Merci pour votre message ! Je serais ravi de discuter de ce projet.'
      ]);
      
      console.log('  ✓ Created sample conversation');
    }

    // Final statistics
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM opportunities'),
      pool.query('SELECT COUNT(*) as count FROM events'),
      pool.query('SELECT COUNT(*) as count FROM messages')
    ]);

    console.log('\n📊 Sample data injection completed successfully!');
    console.log(`   👥 Users: ${stats[0].rows[0].count}`);
    console.log(`   💼 Opportunities: ${stats[1].rows[0].count}`);
    console.log(`   📅 Events: ${stats[2].rows[0].count}`);
    console.log(`   💬 Messages: ${stats[3].rows[0].count}`);
    
    console.log('\n🔑 Test accounts (all with password: demo123):');
    sampleUsers.forEach(user => {
      console.log(`   ${user.type}: ${user.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error injecting sample data:', error);
    process.exit(1);
  }
}

// Run the injection
injectSampleData();