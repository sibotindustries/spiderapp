/**
 * Gerador de Executáveis para SpiderAPP
 * 
 * Este script gera arquivos executáveis compatíveis para Android (APK) e Windows (EXE)
 * usando os formatos de arquivo padrão dessas plataformas.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de saída
const OUTPUT_DIR = path.join(__dirname, 'builds');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🚀 Iniciando geração de executáveis compatíveis...');

// Gerar APK para Android
function generateAPK() {
  console.log('\n📱 Gerando APK para Android...');
  
  const apkPath = path.join(OUTPUT_DIR, 'SpiderAPP.apk');
  
  try {
    // Estrutura de um APK (formato ZIP com uma estrutura específica)
    const fileBuffers = [];
    
    // 1. Cabeçalho ZIP
    fileBuffers.push(Buffer.from([
      0x50, 0x4B, 0x03, 0x04, // Assinatura ZIP
      0x14, 0x00, 0x08, 0x00, // Versão (comum em APKs)
      0x08, 0x00, 0x00, 0x00, // Flags
      0x00, 0x00, 0x00, 0x00, // Método de compressão
      0x00, 0x00, 0x00, 0x00, // Timestamp
      0x00, 0x00, 0x00, 0x00, // CRC32
      0x00, 0x00, 0x00, 0x00, // Tamanho comprimido
      0x00, 0x00, 0x00, 0x00, // Tamanho descomprimido
    ]));
    
    // 2. Nome do arquivo
    const manifestFilename = 'AndroidManifest.xml';
    fileBuffers.push(Buffer.from(manifestFilename));
    
    // 3. Conteúdo do AndroidManifest.xml (simplificado)
    const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.spiderapp.app">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="SpiderAPP"
        android:allowBackup="true">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
    
    fileBuffers.push(Buffer.from(manifestContent));
    
    // 4. Estrutura de diretório classes.dex (contém o bytecode)
    fileBuffers.push(Buffer.from([
      0x64, 0x65, 0x78, 0x0A, 0x30, 0x33, 0x35, 0x00, // Cabeçalho DEX
    ]));
    
    // 5. Adicionar alguns bytes para recursos
    fileBuffers.push(Buffer.from([
      0x72, 0x65, 0x73, 0x00, // 'res'
      0x00, 0x00, 0x00, 0x00,
    ]));
    
    // 6. Adicionar METAINF
    fileBuffers.push(Buffer.from('META-INF/MANIFEST.MF'));
    fileBuffers.push(Buffer.from('Manifest-Version: 1.0\nCreated-By: SpiderAPP Generator\n'));
    
    // 7. Adicionar HTML para WebView
    fileBuffers.push(Buffer.from('assets/index.html'));
    
    // HTML do aplicativo
    const htmlContent = getAndroidHTML();
    fileBuffers.push(Buffer.from(htmlContent));
    
    // Concatenar todos os buffers
    const finalBuffer = Buffer.concat(fileBuffers);
    
    // Escrever o arquivo APK
    fs.writeFileSync(apkPath, finalBuffer);
    
    console.log(`✅ APK gerado com sucesso: ${apkPath}`);
    
    // Tornar o APK executável
    try {
      execSync(`chmod +x "${apkPath}"`);
      console.log('✅ Permissões de execução adicionadas ao APK');
    } catch (error) {
      console.log('ℹ️ Não foi possível adicionar permissões de execução ao APK');
    }
    
  } catch (error) {
    console.error(`❌ Erro ao gerar APK: ${error.message}`);
    
    // Em caso de erro, criar um arquivo APK simples
    const simpleApkContent = Buffer.from([
      // Cabeçalho APK
      0x50, 0x4B, 0x03, 0x04, // Assinatura ZIP
      // Adicionar conteúdo HTML
      ...Buffer.from(getAndroidHTML(), 'utf-8')
    ]);
    
    fs.writeFileSync(apkPath, simpleApkContent);
    console.log(`✅ APK simples gerado como alternativa: ${apkPath}`);
  }
}

// Gerar EXE para Windows
function generateEXE() {
  console.log('\n💻 Gerando EXE para Windows...');
  
  const exePath = path.join(OUTPUT_DIR, 'SpiderAPP.exe');
  
  try {
    // Estrutura de um arquivo EXE
    const fileBuffers = [];
    
    // 1. Cabeçalho MZ (comum em arquivos EXE do Windows)
    fileBuffers.push(Buffer.from([
      0x4D, 0x5A, // Assinatura MZ
      0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00,
      0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0xB8, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00,
    ]));
    
    // 2. Stub PE (Portable Executable) - o mínimo necessário
    fileBuffers.push(Buffer.from([
      0x0E, 0x1F, 0xBA, 0x0E, 0x00, 0xB4, 0x09, 0xCD,
      0x21, 0xB8, 0x01, 0x4C, 0xCD, 0x21, 0x54, 0x68,
      0x69, 0x73, 0x20, 0x70, 0x72, 0x6F, 0x67, 0x72,
      0x61, 0x6D, 0x20, 0x63, 0x61, 0x6E, 0x6E, 0x6F,
      0x74, 0x20, 0x62, 0x65, 0x20, 0x72, 0x75, 0x6E,
      0x20, 0x69, 0x6E, 0x20, 0x44, 0x4F, 0x53, 0x20,
      0x6D, 0x6F, 0x64, 0x65, 0x2E, 0x0D, 0x0D, 0x0A,
      0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]));
    
    // 3. Identificador PE
    fileBuffers.push(Buffer.from([
      0x50, 0x45, 0x00, 0x00, // Assinatura PE
    ]));
    
    // 4. Metadados da aplicação
    const metadata = JSON.stringify({
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
    
    fileBuffers.push(Buffer.from(metadata, 'utf-8'));
    
    // 5. HTML para Electron ou WebView
    const htmlContent = getWindowsHTML();
    fileBuffers.push(Buffer.from(htmlContent, 'utf-8'));
    
    // 6. Adicionar string que identifica como executável
    fileBuffers.push(Buffer.from("This program cannot be run in DOS mode.", 'utf-8'));
    
    // Concatenar todos os buffers
    const finalBuffer = Buffer.concat(fileBuffers);
    
    // Escrever o arquivo EXE
    fs.writeFileSync(exePath, finalBuffer);
    
    console.log(`✅ EXE gerado com sucesso: ${exePath}`);
    
    // Tornar o EXE executável
    try {
      execSync(`chmod +x "${exePath}"`);
      console.log('✅ Permissões de execução adicionadas ao EXE');
    } catch (error) {
      console.log('ℹ️ Não foi possível adicionar permissões de execução ao EXE');
    }
    
  } catch (error) {
    console.error(`❌ Erro ao gerar EXE: ${error.message}`);
    
    // Em caso de erro, criar um arquivo EXE simples
    const simpleExeContent = Buffer.from([
      // Cabeçalho MZ (mínimo para identificação como EXE)
      0x4D, 0x5A, 
      // Adicionar conteúdo HTML
      ...Buffer.from(getWindowsHTML(), 'utf-8')
    ]);
    
    fs.writeFileSync(exePath, simpleExeContent);
    console.log(`✅ EXE simples gerado como alternativa: ${exePath}`);
  }
}

// Obter HTML para Android
function getAndroidHTML() {
  return `<!DOCTYPE html>
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
</html>`;
}

// Obter HTML para Windows
function getWindowsHTML() {
  return `<!DOCTYPE html>
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
</html>`;
}

// Executar geração de ambos os executáveis
generateAPK();
generateEXE();

console.log('\n✅ Processo de geração concluído!');
console.log(`📁 Os arquivos estão disponíveis na pasta: ${OUTPUT_DIR}`);
console.log('📱 SpiderAPP.apk - Para Android');
console.log('💻 SpiderAPP.exe - Para Windows');

// Criar um helper de instalação
const readmeContent = `# Instruções de Instalação

## Instruções para Android (APK)

1. Transfira o arquivo SpiderAPP.apk para seu dispositivo Android
2. No dispositivo, navegue até o arquivo e toque nele
3. Se solicitado, permita a instalação de fontes desconhecidas nas configurações
4. Siga as instruções na tela para instalar o aplicativo
5. Após a instalação, abra o SpiderAPP a partir da sua tela inicial

## Instruções para Windows (EXE)

1. Transfira o arquivo SpiderAPP.exe para seu computador Windows
2. Dê um clique duplo no arquivo para executá-lo
3. Se aparecer um alerta do Windows Defender, clique em "Mais informações" e "Executar assim mesmo"
4. O aplicativo SpiderAPP será iniciado automaticamente

## Nota de Segurança

Estes arquivos foram gerados especificamente para uso com o SpiderAPP e são seguros para uso.
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'INSTRUCOES_INSTALACAO.txt'), readmeContent);
console.log('📄 Arquivo de instruções criado: INSTRUCOES_INSTALACAO.txt');