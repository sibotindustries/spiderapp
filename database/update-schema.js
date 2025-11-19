import { pool } from './server/db.ts';

const alterTableSQL = `
-- Adicionar novas colunas para autenticação Google
ALTER TABLE IF EXISTS users 
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'citizen';

-- Adicionar campo de método de autenticação ao histórico de login
ALTER TABLE IF EXISTS login_history
  ADD COLUMN IF NOT EXISTS auth_method TEXT;
`;

async function updateSchema() {
  try {
    console.log('Atualizando esquema para suportar Google OAuth...');
    
    // Conectar ao banco de dados
    const client = await pool.connect();
    
    try {
      // Executar alterações de esquema
      await client.query(alterTableSQL);
      console.log('Esquema atualizado com sucesso!');
    } finally {
      // Liberar a conexão quando terminar
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar o esquema:', error);
    process.exit(1);
  } finally {
    // Fechar pool de conexões
    await pool.end();
  }
}

updateSchema();