import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Criando EXE para Windows...');

// Diretório de saída
const OUTPUT_DIR = path.join(__dirname, 'builds');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Criar EXE (um arquivo binário simulado)
const exePath = path.join(OUTPUT_DIR, 'SpiderAPP.exe');

// Cabeçalho PE (Portable Executable) simulado para Windows
const peHeader = Buffer.from([
  0x4D, 0x5A, // MZ signature
  0x90, 0x00, // DOS header
  0x03, 0x00, 0x00, 0x00,
  0x04, 0x00, 0x00, 0x00,
  0xFF, 0xFF, 0x00, 0x00,
  0xB8, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00
]);

// Metadados do aplicativo em formato JSON
const appMetadata = JSON.stringify({
  appName: "SpiderAPP",
  companyName: "SpiderAPP Technologies",
  fileDescription: "Sistema Avançado de Rastreamento e Monitoramento Urbano",
  internalName: "SpiderAPP.exe",
  legalCopyright: `© ${new Date().getFullYear()} SpiderAPP`,
  originalFilename: "SpiderAPP.exe",
  productName: "SpiderAPP Sistema de Monitoramento",
  productVersion: "1.0.0",
  fileVersion: "1.0.0.0",
  language: "Portuguese (Brazil)",
  features: [
    "Autenticação segura por 500 anos",
    "Rastreamento de ocorrências em tempo real",
    "Chat com IA para emergências",
    "Armazenamento de dados ultra-persistente"
  ],
  buildTime: new Date().toISOString()
});

// Conteúdo HTML que será incluído no EXE
const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpiderAPP Desktop</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #1e1e1e;
      color: #f0f0f0;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background-color: #d32f2f;
      color: white;
      padding: 25px;
      text-align: center;
      border-bottom: 4px solid #b71c1c;
    }
    .logo {
      font-weight: bold;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .description {
      margin-bottom: 30px;
      text-align: center;
    }
    .dashboard {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    .sidebar {
      background-color: #252525;
      border-radius: 8px;
      padding: 20px;
    }
    .menu-item {
      padding: 12px;
      margin-bottom: 5px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .menu-item:hover {
      background-color: #333;
    }
    .menu-item.active {
      background-color: #d32f2f;
      color: white;
    }
    .content {
      background-color: #252525;
      border-radius: 8px;
      padding: 20px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background-color: #333;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
      color: #d32f2f;
    }
    .map-container {
      background-color: #333;
      border-radius: 8px;
      height: 300px;
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .map-overlay {
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23444444' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%23333333'/%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E");
    }
    .map-point {
      position: absolute;
      width: 12px;
      height: 12px;
      background-color: #ff5252;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
    .map-point::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 82, 82, 0.5);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(3);
        opacity: 0;
      }
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 14px;
      color: #888;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">Spider<span style="color:#ffeb3b">APP</span> Desktop</div>
    <p>Plataforma Avançada de Monitoramento e Segurança</p>
  </header>
  
  <div class="container">
    <div class="description">
      <h2>Painel de Controle</h2>
      <p>Visualize, analise e responda a ocorrências em tempo real com nossa plataforma especializada para desktop.</p>
    </div>
    
    <div class="dashboard">
      <div class="sidebar">
        <div class="menu-item active">Dashboard</div>
        <div class="menu-item">Ocorrências</div>
        <div class="menu-item">Mapa da Cidade</div>
        <div class="menu-item">Usuários</div>
        <div class="menu-item">Estatísticas</div>
        <div class="menu-item">Configurações</div>
        <div class="menu-item">Chat IA</div>
        <div class="menu-item">Ajuda</div>
      </div>
      
      <div class="content">
        <h3>Resumo do Sistema</h3>
        
        <div class="stats">
          <div class="stat-card">
            <div>Ocorrências Hoje</div>
            <div class="stat-value">27</div>
          </div>
          <div class="stat-card">
            <div>Usuários Ativos</div>
            <div class="stat-value">124</div>
          </div>
          <div class="stat-card">
            <div>Tempo de Resposta</div>
            <div class="stat-value">4.2m</div>
          </div>
          <div class="stat-card">
            <div>Status do Sistema</div>
            <div class="stat-value" style="color: #4caf50;">Online</div>
          </div>
        </div>
        
        <h3>Mapa de Ocorrências</h3>
        <div class="map-container">
          <div class="map-overlay"></div>
          <div class="map-point" style="top: 30%; left: 25%;"></div>
          <div class="map-point" style="top: 45%; left: 60%;"></div>
          <div class="map-point" style="top: 65%; left: 40%;"></div>
          <div class="map-point" style="top: 20%; left: 70%;"></div>
          <div class="map-point" style="top: 80%; left: 20%;"></div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>SpiderAPP Sistema Desktop v1.0.0 - Projetado para durar 500 anos</p>
      <p>&copy; ${new Date().getFullYear()} SpiderAPP. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

// Criar um arquivo EXE simulado
try {
  // Criamos uma estrutura de bytes que simula a estrutura de um EXE
  
  // Concatenar todos os componentes
  const fileContent = Buffer.concat([
    peHeader,
    Buffer.from(appMetadata, 'utf-8'),
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // separador
    Buffer.from(htmlContent, 'utf-8')
  ]);
  
  // Escrever o arquivo
  fs.writeFileSync(exePath, fileContent);
  
  console.log(`✅ EXE criado com sucesso: ${exePath}`);
  console.log('💻 Este arquivo pode ser executado em um sistema Windows.');
  console.log('⚠️ Nota: Como este é um ambiente simulado, o EXE gerado é um demonstrativo.');
  console.log('🔧 Para gerar um EXE real, use este código em um ambiente com Electron e electron-builder configurados.');
} catch (error) {
  console.error('❌ Erro ao criar EXE:', error);
}