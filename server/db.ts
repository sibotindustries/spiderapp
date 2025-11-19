import { log } from "./vite";
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

const { Pool } = pg;

log("PostgreSQL database connection initializing", "database");

if (!process.env.DATABASE_URL) {
  log("WARNING: DATABASE_URL is not set. Database connection will fail.", "database-warning");
  log("Make sure the Replit database is provisioned correctly.", "database-warning");
} else {
  // Log connection attempt (without exposing password)
  const dbUrl = process.env.DATABASE_URL;
  const urlWithoutPassword = dbUrl.replace(/:([^@]+)@/, ':****@');
  log(`Attempting to connect to database: ${urlWithoutPassword}`, "database");
}

// Configure connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 60000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection - aumentado para 10 segundos
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    log(`Error connecting to the database: ${err.message}`, "database-error");
    return;
  }
  
  if (client) {
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        log(`Error executing query: ${err.message}`, "database-error");
        return;
      }
      log(`Database connection successful at ${result.rows[0].now}`, "database");
    });
  }
});

// Setup connection health monitoring
pool.on('error', (err) => {
  log(`Unexpected database error: ${err.message}`, "database-error");
  
  // Auto-reconnect in case of failures with exponential backoff
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  
  const attemptReconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff with max 30s
      
      log(`Attempting to reconnect to database (attempt ${reconnectAttempts}/${maxReconnectAttempts}) in ${delay/1000}s...`, "database");
      
      setTimeout(() => {
        pool.connect((err) => {
          if (err) {
            log(`Reconnection attempt ${reconnectAttempts} failed: ${err.message}`, "database-error");
            attemptReconnect();
          } else {
            log(`Successfully reconnected to database after ${reconnectAttempts} attempts`, "database");
            reconnectAttempts = 0;
          }
        });
      }, delay);
    } else {
      log(`Failed to reconnect to database after ${maxReconnectAttempts} attempts`, "database-error");
    }
  };
  
  attemptReconnect();
});

// Initialize Drizzle ORM with our schema
export const db = drizzle(pool, { schema });