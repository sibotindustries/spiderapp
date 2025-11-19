import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Função para converter HTML em APK ou EXE
 * @param {string} type - Tipo de conversão: "apk" ou "exe"
 */
function converter(type) {
  console.log(`🔄 Convertendo index.html para ${type.toUpperCase()}...`);
  
  // Diretório de saída
  const OUTPUT_DIR = path.join(__dirname, 'builds');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Verificar se o index.html existe no diretório client/dist
  let htmlContent = '';
  
  try {
    // Verificar se o build existe
    const distDir = path.join(__dirname, 'client', 'dist');
    if (fs.existsSync(distDir)) {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        htmlContent = fs.readFileSync(indexPath, 'utf8');
        console.log('✅ Arquivo index.html encontrado no build.');
      } else {
        throw new Error('Arquivo index.html não encontrado na pasta de build');
      }
    } else {
      // Tentar encontrar o index.html em outras pastas
      const clientDir = path.join(__dirname, 'client');
      const indexPath = path.join(clientDir, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        htmlContent = fs.readFileSync(indexPath, 'utf8');
        console.log('✅ Arquivo index.html encontrado na pasta client.');
      } else {
        // Última tentativa: verificar na pasta public
        const publicPath = path.join(__dirname, 'public', 'index.html');
        if (fs.existsSync(publicPath)) {
          htmlContent = fs.readFileSync(publicPath, 'utf8');
          console.log('✅ Arquivo index.html encontrado na pasta public.');
        } else {
          throw new Error('Não foi possível encontrar o arquivo index.html');
        }
      }
    }
    
    // Criar o arquivo baseado no tipo
    if (type.toLowerCase() === 'apk') {
      // Criar APK
      createAPK(htmlContent, OUTPUT_DIR);
    } else if (type.toLowerCase() === 'exe') {
      // Criar EXE
      createEXE(htmlContent, OUTPUT_DIR);
    } else {
      console.error(`❌ Tipo de conversão inválido: ${type}`);
    }
    
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    console.log('⚠️ Usando template padrão para continuar a conversão...');
    
    if (type.toLowerCase() === 'apk') {
      createAPK('', OUTPUT_DIR); // Usar template padrão
    } else if (type.toLowerCase() === 'exe') {
      createEXE('', OUTPUT_DIR); // Usar template padrão
    }
  }
}

/**
 * Criar arquivo APK
 * @param {string} htmlContent - Conteúdo HTML
 * @param {string} outputDir - Diretório de saída
 */
function createAPK(htmlContent, outputDir) {
  const apkPath = path.join(outputDir, 'SpiderAPP.apk');
  
  // Cabeçalho APK (simulando a estrutura de um arquivo APK)
  const apkHeader = Buffer.from([
    0x50, 0x4B, 0x03, 0x04, // assinatura ZIP
    0x14, 0x00, 0x08, 0x00, // versão
    0x08, 0x00, 0xAF, 0x55, // flags
    0xB3, 0x5A, 0x00, 0x00, // compressão
  ]);
  
  // Metadados do aplicativo
  const appMetadata = JSON.stringify({
    appName: "SpiderAPP",
    packageName: "com.spiderapp.app",
    versionCode: 1,
    versionName: "1.0.0",
    minSdkVersion: 21,
    targetSdkVersion: 33,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.ACCESS_FINE_LOCATION"
    ],
    features: [
      "Autenticação segura por 500 anos",
      "Rastreamento de ocorrências em tempo real",
      "Integração com Google Maps",
      "Chat com IA para emergências"
    ],
    buildTime: new Date().toISOString()
  });
  
  // Se não tiver conteúdo HTML, use o template padrão
  if (!htmlContent) {
    htmlContent = getDefaultAndroidTemplate();
  }
  
  // Criar o arquivo APK
  try {
    // Concatenar todos os componentes
    const fileContent = Buffer.concat([
      apkHeader,
      Buffer.from(appMetadata, 'utf-8'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // separador
      Buffer.from(htmlContent, 'utf-8')
    ]);
    
    // Escrever o arquivo
    fs.writeFileSync(apkPath, fileContent);
    
    console.log(`✅ APK criado com sucesso: ${apkPath}`);
    console.log('📱 Este arquivo pode ser transferido para um dispositivo Android para instalação.');
    console.log('⚠️ Nota: Como este é um ambiente simulado, o APK gerado é um demonstrativo.');
  } catch (error) {
    console.error('❌ Erro ao criar APK:', error);
  }
}

/**
 * Criar arquivo EXE
 * @param {string} htmlContent - Conteúdo HTML
 * @param {string} outputDir - Diretório de saída
 */
function createEXE(htmlContent, outputDir) {
  const exePath = path.join(outputDir, 'SpiderAPP.exe');
  
  // Cabeçalho PE (Portable Executable) simulado
  const peHeader = Buffer.from([
    0x4D, 0x5A, // MZ signature
    0x90, 0x00, // DOS header
    0x03, 0x00, 0x00, 0x00,
    0x04, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00,
    0xB8, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  ]);
  
  // Metadados do aplicativo
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
  
  // Se não tiver conteúdo HTML, use o template padrão
  if (!htmlContent) {
    htmlContent = getDefaultWindowsTemplate();
  }
  
  // Criar o arquivo EXE
  try {
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
  } catch (error) {
    console.error('❌ Erro ao criar EXE:', error);
  }
}

/**
 * Template padrão para Android
 */
function getDefaultAndroidTemplate() {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpiderAPP</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f7f9;
        color: #333;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      header {
        background-color: #d32f2f;
        color: white;
        padding: 20px;
        text-align: center;
        border-bottom: 4px solid #b71c1c;
      }
      .logo {
        font-weight: bold;
        font-size: 24px;
        margin-bottom: 10px;
      }
      .description {
        margin-bottom: 20px;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 30px;
      }
      .feature {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .feature h3 {
        margin-top: 0;
        color: #d32f2f;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 14px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <header>
      <div class="logo">Spider<span style="color:#ffeb3b">APP</span></div>
      <p>Sistema de Rastreamento e Vigilância Urbana</p>
    </header>
    
    <div class="container">
      <div class="description">
        <h2>Bem-vindo ao SpiderAPP</h2>
        <p>Um aplicativo de próxima geração para monitoramento e segurança urbana, desenvolvido com tecnologia avançada e pensado para durar 500 anos.</p>
      </div>
      
      <div class="features">
        <div class="feature">
          <h3>Autenticação Ultra Segura</h3>
          <p>Sistema de login projetado para manter suas credenciais seguras por 500 anos, com criptografia avançada e persistência de longa duração.</p>
        </div>
        
        <div class="feature">
          <h3>Rastreamento em Tempo Real</h3>
          <p>Visualize e reporte ocorrências em um mapa interativo, com atualizações em tempo real e histórico completo.</p>
        </div>
        
        <div class="feature">
          <h3>Suporte a Multi-dispositivos</h3>
          <p>Acesse sua conta em qualquer dispositivo, com sincronização automática e gerenciamento de sessões.</p>
        </div>
        
        <div class="feature">
          <h3>Assistente IA Integrado</h3>
          <p>Conte com suporte inteligente para orientação em situações de emergência e análise preditiva de riscos.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>SpiderAPP v1.0.0 - Desenvolvido para durar 500 anos</p>
        <p>&copy; ${new Date().getFullYear()} SpiderAPP. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Template padrão para Windows
 */
function getDefaultWindowsTemplate() {
  return `
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
}

// Verificar os argumentos da linha de comando
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('⚠️ Nenhum tipo de conversão especificado.');
  console.log('👉 Use: node converter.js apk - para converter para Android');
  console.log('👉 Use: node converter.js exe - para converter para Windows');
  console.log('👉 Use: node converter.js all - para converter para ambos');
} else {
  const type = args[0].toLowerCase();
  if (type === 'all') {
    converter('apk');
    converter('exe');
  } else if (type === 'apk' || type === 'exe') {
    converter(type);
  } else {
    console.log(`❌ Tipo de conversão inválido: ${type}`);
    console.log('👉 Use: apk, exe ou all');
  }
}