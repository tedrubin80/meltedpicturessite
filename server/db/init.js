/**
 * Database Initialization Script
 * Creates all required tables for Melted Pictures
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'melted_pictures',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const schema = `
-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Films table
CREATE TABLE IF NOT EXISTS films (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  synopsis TEXT,
  full_description TEXT,
  youtube_id VARCHAR(50),
  year INTEGER,
  genre VARCHAR(100),
  duration VARCHAR(50),
  rating VARCHAR(20),
  release_date DATE,
  director VARCHAR(255) DEFAULT 'Melted Pictures',
  writer VARCHAR(255) DEFAULT 'Melted Pictures',
  credits TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  tags TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Settings table for site configuration
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for express-session (PostgreSQL store)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact form inquiries (admin inbox)
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(300) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_films_status ON films(status);
CREATE INDEX IF NOT EXISTS idx_films_featured ON films(featured);
CREATE INDEX IF NOT EXISTS idx_films_slug ON films(slug);
CREATE INDEX IF NOT EXISTS idx_films_created_at ON films(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_films_updated_at ON films;
CREATE TRIGGER update_films_updated_at
  BEFORE UPDATE ON films
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

const defaultSettings = [
  ['site_name', 'Melted Pictures'],
  ['site_tagline', 'Where AI Meets Nightmare'],
  ['site_description', 'Pioneering AI-generated horror and thriller cinema.'],
  ['contact_email', 'hello@meltedpictures.com'],
  ['press_email', 'press@meltedpictures.com'],
  ['youtube_url', ''],
  ['twitter_url', ''],
  ['instagram_url', ''],
  ['tiktok_url', ''],
  ['plausible_domain', ''],
];

async function initDatabase() {
  console.log('🎬 Initializing Melted Pictures Database...\n');

  try {
    // Create schema
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('✓ Tables created successfully\n');

    // Insert default settings
    console.log('Setting up default configuration...');
    for (const [key, value] of defaultSettings) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }
    console.log('✓ Default settings configured\n');

    // Create admin user if not exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@meltedpictures.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      console.log('Creating admin user...');
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)`,
        [adminEmail, passwordHash, 'Admin', 'admin']
      );
      console.log(`✓ Admin user created: ${adminEmail}\n`);
      console.log('⚠️  IMPORTANT: Change the default password immediately!\n');
    } else {
      console.log('✓ Admin user already exists\n');
    }

    console.log('═══════════════════════════════════════════');
    console.log('🎬 Database initialization complete!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
