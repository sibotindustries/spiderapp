import { log } from "./vite";
import pg from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

const { Pool } = pg;

async function runMigration() {
  log("Starting database migration process...", "database-migration");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Database not properly configured!");
  }

  // Configure connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const db = drizzle(pool, { schema });

  try {
    log("Pushing schema to database...", "database-migration");
    
    // Push schema changes directly to the database (better for our use case)
    // This creates all tables with proper constraints and relationships
    await db.execute(schema.users);
    await db.execute(schema.crimes);
    await db.execute(schema.notifications);
    await db.execute(schema.chatMessages);
    await db.execute(schema.sessions);
    await db.execute(schema.loginHistory);
    await db.execute(schema.deviceKeys);
    
    log("Database migration completed successfully!", "database-migration");
  } catch (error) {
    log(`Migration error: ${error instanceof Error ? error.message : String(error)}`, "database-migration-error");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration immediately
runMigration();