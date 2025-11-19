// Script de teste para validação de senhas
import crypto from 'crypto';

// Função para hash de senha
function hashPassword(password, salt) {
  // Usar PBKDF2 com as mesmas 600.000 iterações que estão no servidor
  return crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
}

// Função para verificar senha
function validatePassword(password, salt, hashedPassword) {
  const passwordHash = hashPassword(password, salt);
  const result = passwordHash === hashedPassword;
  console.log('Resultado da comparação:', result);
  return result;
}

// Dados do banco
const storedPasswords = [
  {
    username: 'spiderman',
    password: 'f49927b53ba4485d446c9987a94a91b3b85fa77500dac1f55c87b6950973f44c41f1d64baa06f9f978081dbb8d68d879bc12361a526decc38cc9347c62c97c17',
    salt: '1efadf78'
  },
  {
    username: 'caio',
    password: '8c547a9be3de8cc30ec9499466f6c17e8e2e8d7e90381e6945d841034d952aba74c09f1dd18f51fc38287aa17997c30405e65166e4864a739a9d50d1700a5612',
    salt: 'xyz789ab'
  }
];

// Teste com senha do admin
console.log('Testando senhas para usuários:');

// 1. Testar hash real
const testPassword = 'admin123';
const testUsername = 'caio';

// Buscar usuário no "banco"
const user = storedPasswords.find(u => u.username === testUsername);
if (!user) {
  console.log(`Usuário ${testUsername} não encontrado`);
  // Use o método de saída apropriado para ESM
  console.error('Erro: usuário não encontrado');
  // process.exit não está disponível em alguns ambientes ESM
  throw new Error('Usuário não encontrado');
}

console.log('Verificando senha para:', testUsername);
console.log('Senha para testar:', testPassword);
console.log('Senha armazenada:', user.password);
console.log('Salt armazenado:', user.salt);

// Calcular hash manualmente e comparar
const calculatedHash = hashPassword(testPassword, user.salt);
console.log('Hash calculado:', calculatedHash);
console.log('Match?', calculatedHash === user.password);

// Usar função de validação
console.log('Usando função validatePassword:');
const isValid = validatePassword(testPassword, user.salt, user.password);
console.log('Senha válida?', isValid);

// Criar hash real para o banco de dados com nosso método
console.log('\nCriando hash real para o banco:');
const realPassword = 'admin123';
const realSalt = 'xyz789ab';
const hashedRealPassword = hashPassword(realPassword, realSalt);
console.log(`INSERT INTO users (username, password, password_salt) VALUES ('caio_teste', '${hashedRealPassword}', '${realSalt}');`);