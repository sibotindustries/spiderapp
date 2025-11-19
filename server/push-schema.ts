import { log } from "./vite";
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

async function pushSchema() {
  log("Starting database schema push process...", "database-migration");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Database not properly configured!");
  }

  // Configure connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const db = drizzle(pool);

  try {
    log("Pushing schema to database...", "database-migration");
    
    // Create tables in order (respecting foreign key relationships)
    await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Users table - This is the core of our long-term persistence system (500 years)
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_reset_token TEXT,
      password_reset_expires TIMESTAMP,
      email TEXT UNIQUE,
      birthdate DATE,
      is_banned BOOLEAN NOT NULL DEFAULT FALSE,
      ban_reason TEXT,
      banned_at TIMESTAMP,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      location TEXT,
      last_login_at TIMESTAMP,
      last_active_at TIMESTAMP,
      forced_password_change_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      account_deactivated_at TIMESTAMP,
      account_deactivation_reason TEXT,
      data_retention_date DATE,
      age_verified BOOLEAN NOT NULL DEFAULT FALSE,
      age_verification_method TEXT
    );
    
    -- Crimes table
    CREATE TABLE IF NOT EXISTS crimes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude TEXT NOT NULL,
      longitude TEXT NOT NULL,
      crime_type TEXT NOT NULL,
      priority_level TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      reported_by_id INTEGER NOT NULL REFERENCES users(id),
      photos JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      crime_id INTEGER REFERENCES crimes(id),
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- Chat messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      to_user_id INTEGER NOT NULL REFERENCES users(id),
      crime_id INTEGER NOT NULL REFERENCES crimes(id),
      message TEXT NOT NULL,
      is_from_spiderman BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- Sessions table for long-term persistence
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      sid TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id),
      user_uuid UUID REFERENCES users(uuid),
      data JSONB NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_extended_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      device_identifier TEXT,
      is_valid BOOLEAN NOT NULL DEFAULT TRUE
    );
    
    -- Login history for security audit
    CREATE TABLE IF NOT EXISTS login_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      user_uuid UUID REFERENCES users(uuid),
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      device_identifier TEXT,
      status TEXT NOT NULL,
      failure_reason TEXT,
      geo_location JSONB
    );
    
    -- Device keys for device-based authentication
    CREATE TABLE IF NOT EXISTS device_keys (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      user_uuid UUID REFERENCES users(uuid),
      device_identifier TEXT NOT NULL,
      public_key TEXT NOT NULL,
      device_name TEXT,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP,
      is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
      revoked_at TIMESTAMP,
      metadata JSONB
    );
    
    -- Tabelas para sistema anti-hacker
    
    -- Security logs table
    CREATE TABLE IF NOT EXISTS security_logs (
      id SERIAL PRIMARY KEY,
      ip_address TEXT NOT NULL,
      event_type TEXT NOT NULL,
      details JSONB,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id)
    );
    
    -- Blocked IPs table
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id SERIAL PRIMARY KEY,
      ip_address TEXT NOT NULL UNIQUE,
      reason TEXT NOT NULL,
      blocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      blocked_by INTEGER REFERENCES users(id)
    );
    
    -- Suspicious activities table
    CREATE TABLE IF NOT EXISTS suspicious_activities (
      id SERIAL PRIMARY KEY,
      ip_address TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      details JSONB,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id),
      severity TEXT NOT NULL
    );
    
    -- Security challenges table
    CREATE TABLE IF NOT EXISTS security_challenges (
      id SERIAL PRIMARY KEY,
      ip_address TEXT NOT NULL,
      challenge_type TEXT NOT NULL,
      challenge_token TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      is_solved BOOLEAN NOT NULL DEFAULT FALSE,
      solved_at TIMESTAMP,
      details JSONB
    );
    
    -- IP reputation data table
    CREATE TABLE IF NOT EXISTS ip_reputation_data (
      id SERIAL PRIMARY KEY,
      ip_address TEXT NOT NULL UNIQUE,
      trust_score INTEGER NOT NULL DEFAULT 100,
      first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
      last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
      suspicious_activity_count INTEGER NOT NULL DEFAULT 0,
      blocked_count INTEGER NOT NULL DEFAULT 0,
      country_code TEXT,
      isp TEXT,
      metadata JSONB
    );
    
    -- API access logs table
    CREATE TABLE IF NOT EXISTS api_access_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      ip_address TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      response_code INTEGER NOT NULL,
      response_time INTEGER NOT NULL,
      user_id INTEGER REFERENCES users(id),
      user_agent TEXT,
      request_id TEXT
    );
    
    -- Tabela para rastrear banimentos por verificação de idade
    CREATE TABLE IF NOT EXISTS banned_identifiers (
      id SERIAL PRIMARY KEY,
      identifier TEXT NOT NULL UNIQUE,
      identifier_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      associated_user_ids JSONB DEFAULT '[]'::jsonb,
      banned_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- Indexes for performance optimization
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
    CREATE INDEX IF NOT EXISTS idx_crimes_reported_by ON crimes(reported_by_id);
    CREATE INDEX IF NOT EXISTS idx_crimes_status ON crimes(status);
    CREATE INDEX IF NOT EXISTS idx_crimes_crime_type ON crimes(crime_type);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_to_user_id ON chat_messages(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_crime_id ON chat_messages(crime_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_sid ON sessions(sid);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_uuid ON sessions(user_uuid);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_is_valid ON sessions(is_valid);
    CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_history_user_uuid ON login_history(user_uuid);
    CREATE INDEX IF NOT EXISTS idx_login_history_timestamp ON login_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_device_keys_user_id ON device_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_device_keys_user_uuid ON device_keys(user_uuid);
    CREATE INDEX IF NOT EXISTS idx_device_keys_device_identifier ON device_keys(device_identifier);
    CREATE INDEX IF NOT EXISTS idx_device_keys_is_revoked ON device_keys(is_revoked);
    
    -- Indexes para tabelas de segurança
    CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
    CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address);
    CREATE INDEX IF NOT EXISTS idx_blocked_ips_is_active ON blocked_ips(is_active);
    CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip_address ON suspicious_activities(ip_address);
    CREATE INDEX IF NOT EXISTS idx_suspicious_activities_timestamp ON suspicious_activities(timestamp);
    CREATE INDEX IF NOT EXISTS idx_suspicious_activities_severity ON suspicious_activities(severity);
    CREATE INDEX IF NOT EXISTS idx_security_challenges_ip_address ON security_challenges(ip_address);
    CREATE INDEX IF NOT EXISTS idx_security_challenges_challenge_token ON security_challenges(challenge_token);
    CREATE INDEX IF NOT EXISTS idx_ip_reputation_data_ip_address ON ip_reputation_data(ip_address);
    CREATE INDEX IF NOT EXISTS idx_ip_reputation_data_trust_score ON ip_reputation_data(trust_score);
    CREATE INDEX IF NOT EXISTS idx_api_access_logs_ip_address ON api_access_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_api_access_logs_endpoint ON api_access_logs(endpoint);
    CREATE INDEX IF NOT EXISTS idx_api_access_logs_timestamp ON api_access_logs(timestamp);
    
    -- Índices para tabela de banimento por idade
    CREATE INDEX IF NOT EXISTS idx_banned_identifiers_identifier ON banned_identifiers(identifier);
    CREATE INDEX IF NOT EXISTS idx_banned_identifiers_identifier_type ON banned_identifiers(identifier_type);
    CREATE INDEX IF NOT EXISTS idx_banned_identifiers_banned_at ON banned_identifiers(banned_at);
    `);
    
    log("Database schema pushed successfully!", "database-migration");
  } catch (error) {
    log(`Schema push error: ${error instanceof Error ? error.message : String(error)}`, "database-migration-error");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run schema push immediately
pushSchema();