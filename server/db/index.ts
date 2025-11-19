import { log } from "./vite";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Usa DATABASE_URL do Neon.tech
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[database-error] DATABASE_URL não está configurada. Configure a variável de ambiente com a connection string do Neon.tech");
  throw new Error("DATABASE_URL is required. Get it from https://neon.tech");
}

// Cria conexão HTTP com Neon
const sql = neon(connectionString);

// Inicializa Drizzle ORM com Neon HTTP
export const db = drizzle(sql, { schema });

console.log("[database] Conexão Neon.tech configurada com sucesso");