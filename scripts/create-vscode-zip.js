import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('📦 Criando ZIP COMPLETO do projeto SpiderAPP para VSCode/Windows...\n');

// Excluir apenas o absolutamente necessário
const excludePatterns = [
  'node_modules',
  '.git',
  '.cache',
  '*.log',
  'SpiderAPP-VSCode-Windows.zip'
];

// Nome do arquivo ZIP
const zipName = 'SpiderAPP-VSCode-Windows.zip';
const zipPath = path.join(projectRoot, zipName);

// Remover ZIP anterior se existir
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
  console.log('✅ ZIP anterior removido\n');
}

try {
  console.log('📦 Compactando projeto COMPLETO (isso pode levar alguns minutos)...');

  // Criar lista de exclusões para o comando zip
  const excludeArgs = excludePatterns.map(p => `-x "*/${p}/*" -x "${p}/*" -x "*${p}"`).join(' ');

  // Usar comando zip nativo do Linux (disponível no Replit)
  const zipCommand = `zip -r "${zipName}" . ${excludeArgs} -q`;
  execSync(zipCommand, { cwd: projectRoot });

  console.log(`\n✅ ZIP criado com sucesso: ${zipName}`);

  // Verificar tamanho do arquivo
  const stats = fs.statSync(zipPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Tamanho do arquivo: ${fileSizeMB} MB`);

  console.log('\n📁 Conteúdo incluído:');
  console.log('✅ Todos os arquivos de código-fonte (client, server, shared)');
  console.log('✅ Todas as pastas de configuração (config, database, scripts)');
  console.log('✅ Todas as pastas de build (build/android, build/final, build/temp, build/windows)');
  console.log('✅ Todos os arquivos públicos (public, assets)');
  console.log('✅ Documentação completa (docs, README, SETUP)');
  console.log('✅ Configurações VSCode (.vscode)');
  console.log('✅ Arquivos de configuração (.env, tsconfig, etc.)');
  console.log('✅ Scripts utilitários completos');

  console.log('\n📝 Instruções:');
  console.log('1. Baixe o arquivo: ' + zipName);
  console.log('2. Extraia em uma pasta no Windows (ex: C:\\Projects\\SpiderAPP)');
  console.log('3. Abra a pasta no VSCode');
  console.log('4. Execute: npm install');
  console.log('5. Configure o .env conforme SETUP_WINDOWS.md');
  console.log('6. Execute: npm run dev');

} catch (error) {
  console.error('❌ Erro ao criar ZIP:', error.message);
  process.exit(1);
}