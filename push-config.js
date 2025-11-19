export default {
  schema: './shared/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  },
  verbose: true,
  strict: true,
  forcePush: true // Isso vai ignorar o prompt de confirmação
};