import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// Arquivo temporário para configuração de migração
const tempConfigContent = `export default {
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
};`;

// Salvando configuração temporária
writeFileSync('push-config.js', tempConfigContent);

try {
  // Executar a migração sem interação do usuário
  console.log('Aplicando migrações de esquema...');
  execSync('npx drizzle-kit push --config=push-config.js', { stdio: 'inherit' });
  console.log('Migrações aplicadas com sucesso!');
} catch (error) {
  console.error('Erro ao aplicar migrações:', error);
  process.exit(1);
} finally {
  // Limpeza (opcional, você pode querer manter o arquivo para uso futuro)
  try {
    execSync('rm push-config.js');
  } catch (e) {
    console.warn('Não foi possível remover o arquivo de configuração temporário:', e);
  }
}