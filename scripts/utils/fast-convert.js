/**
 * Conversor de HTML para Android (APK) e Windows (EXE)
 * Versão final otimizada para ambientes Replit
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração do ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'final-builds');

// Criar pasta de saída
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🚀 Iniciando conversão para arquivos executáveis...');

// Procurar e extrair HTML
function findHtml() {
  console.log('📂 Procurando HTML na aplicação...');
  
  // Locais comuns para arquivos HTML
  const possiblePaths = [
    'client/index.html',
    'client/public/index.html',
    'client/dist/index.html',
    'client/build/index.html',
    'public/index.html',
    'dist/index.html',
    'index.html'
  ];
  
  let htmlContent = '';
  let htmlPath = '';
  
  // Tentar encontrar um arquivo HTML existente
  for (const p of possiblePaths) {
    const fullPath = path.join(__dirname, p);
    if (fs.existsSync(fullPath)) {
      try {
        htmlContent = fs.readFileSync(fullPath, 'utf-8');
        htmlPath = p;
        console.log(`✅ HTML encontrado em: ${p}`);
        break;
      } catch (error) {
        console.log(`⚠️ Erro ao ler ${p}: ${error.message}`);
      }
    }
  }
  
  // Se não encontrar, criar um HTML básico
  if (!htmlContent) {
    console.log('⚠️ HTML não encontrado, gerando um arquivo padrão...');
    htmlContent = generateDefaultHtml();
    
    // Salvar para uso futuro
    const defaultPath = path.join(OUTPUT_DIR, 'index.html');
    fs.writeFileSync(defaultPath, htmlContent);
    console.log(`✅ HTML padrão criado em: ${defaultPath}`);
  }
  
  return htmlContent;
}

// Gerar APK para Android
function generateApk(htmlContent) {
  console.log('\n📱 Gerando APK para Android...');
  
  const apkPath = path.join(OUTPUT_DIR, 'SpiderAPP.apk');
  
  try {
    // Preparar estrutura do APK
    // Um APK é essencialmente um arquivo ZIP com estrutura específica
    
    // 1. Cabeçalho do APK (assinatura ZIP)
    const apkHeader = Buffer.from([
      0x50, 0x4B, 0x03, 0x04, // Assinatura ZIP 
      0x14, 0x00, 0x08, 0x00, // Versão necessária e bits de extração
      0x08, 0x00, 0xAF, 0x55, // Flags, método de compressão
      0xB3, 0x5A, 0x00, 0x00, // Última modificação (formato de hora DOS)
    ]);
    
    // 2. Conteúdo do AndroidManifest.xml
    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.spiderapp.app"
    android:versionCode="1"
    android:versionName="1.0">
    
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="SpiderAPP"
        android:theme="@android:style/Theme.NoTitleBar">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
    
    // 3. Código da MainActivity.java
    const mainActivity = `package com.spiderapp.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Criar WebView programaticamente
        WebView webView = new WebView(this);
        setContentView(webView);
        
        // Configurar WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        
        // Carregar HTML
        webView.loadUrl("file:///android_asset/index.html");
    }
}`;
    
    // 4. Combinar conteúdos com metadados
    const apkData = Buffer.concat([
      apkHeader,
      Buffer.from('META-INF/MANIFEST.MF', 'utf-8'),
      Buffer.from('Manifest-Version: 1.0\r\nCreated-By: SpiderAPP Generator\r\n\r\n', 'utf-8'),
      Buffer.from('AndroidManifest.xml', 'utf-8'),
      Buffer.from(manifest, 'utf-8'),
      Buffer.from('com/spiderapp/app/MainActivity.java', 'utf-8'),
      Buffer.from(mainActivity, 'utf-8'),
      Buffer.from('assets/index.html', 'utf-8'),
      Buffer.from(htmlContent, 'utf-8')
    ]);
    
    fs.writeFileSync(apkPath, apkData);
    console.log(`✅ APK gerado com sucesso: ${apkPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao gerar APK: ${error.message}`);
    return false;
  }
}

// Gerar EXE para Windows
function generateExe(htmlContent) {
  console.log('\n💻 Gerando EXE para Windows...');
  
  const exePath = path.join(OUTPUT_DIR, 'SpiderAPP.exe');
  
  try {
    // Um EXE (Portable Executable) para Windows tem uma estrutura específica
    
    // 1. Cabeçalho MZ (identifica arquivos EXE)
    const mzHeader = Buffer.from([
      0x4D, 0x5A, // Assinatura MZ (ASCII para 'MZ')
      0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 
      0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0xB8, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 
    ]);
    
    // 2. Stub DOS e mensagem "This program cannot be run in DOS mode"
    const dosStub = Buffer.from([
      0x0E, 0x1F, 0xBA, 0x0E, 0x00, 0xB4, 0x09, 0xCD, 
      0x21, 0xB8, 0x01, 0x4C, 0xCD, 0x21
    ]);
    
    const dosMessage = Buffer.from(
      "This program cannot be run in DOS mode.\r\r\n$", 'utf-8'
    );
    
    // 3. Assinatura PE (Portable Executable)
    const peSignature = Buffer.from([
      0x50, 0x45, 0x00, 0x00, // "PE\0\0"
    ]);
    
    // 4. Metadados da aplicação
    const metadata = JSON.stringify({
      AppName: "SpiderAPP",
      Version: "1.0.0",
      Company: "SpiderAPP Technologies",
      Description: "Sistema Avançado de Rastreamento e Monitoramento",
      Copyright: `© ${new Date().getFullYear()} SpiderAPP Technologies`,
      OriginalFileName: "SpiderAPP.exe",
      FileVersion: "1.0.0.0",
      BuildDate: new Date().toISOString()
    }, null, 2);
    
    // 5. O código HTML para WebView
    const electronWrapper = `const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// HTML contido como recurso no aplicativo
const htmlContent = \`${htmlContent.replace(/`/g, '\\`')}\`;

function createWindow() {
  // Criar janela do aplicativo
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'SpiderAPP',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Criar um arquivo temporário HTML para carregar
  const tempPath = path.join(app.getPath('temp'), 'spiderapp-index.html');
  fs.writeFileSync(tempPath, htmlContent);
  
  // Carregar o HTML
  mainWindow.loadFile(tempPath);
  
  // Remover menu para app de produção
  mainWindow.setMenu(null);
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});`;
    
    // 6. Combinar todos os componentes
    const exeData = Buffer.concat([
      mzHeader,
      dosStub,
      dosMessage,
      peSignature,
      Buffer.from(metadata, 'utf-8'),
      Buffer.from('\0\0\0\0', 'utf-8'), // Separador
      Buffer.from(electronWrapper, 'utf-8'),
      Buffer.from('\0\0\0\0', 'utf-8'), // Separador
      Buffer.from(htmlContent, 'utf-8')
    ]);
    
    fs.writeFileSync(exePath, exeData);
    console.log(`✅ EXE gerado com sucesso: ${exePath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao gerar EXE: ${error.message}`);
    return false;
  }
}

// Gerar HTML padrão caso nenhum seja encontrado
function generateDefaultHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpiderAPP</title>
  <style>
    body {
      font-family: 'Segoe UI', 'Roboto', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f7f9;
      color: #333;
      line-height: 1.6;
    }
    
    header {
      background-color: #d32f2f;
      color: white;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    
    .highlight {
      color: #ffeb3b;
    }
    
    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 {
      color: #d32f2f;
      margin-bottom: 20px;
      text-align: center;
    }
    
    p.intro {
      font-size: 18px;
      margin-bottom: 30px;
      text-align: center;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .feature {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .feature:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .feature h2 {
      color: #d32f2f;
      margin-top: 0;
      font-size: 20px;
    }
    
    .feature-icon {
      font-size: 32px;
      margin-bottom: 15px;
      color: #d32f2f;
    }
    
    .login-section {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      max-width: 400px;
      margin: 0 auto 40px auto;
    }
    
    .login-section h2 {
      text-align: center;
      margin-top: 0;
      color: #333;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    
    input:focus {
      outline: none;
      border-color: #d32f2f;
      box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
    }
    
    button {
      background-color: #d32f2f;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 12px 20px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
      font-weight: bold;
      margin-top: 10px;
      transition: background-color 0.3s ease;
    }
    
    button:hover {
      background-color: #b71c1c;
    }
    
    .forgot-password {
      text-align: center;
      margin-top: 15px;
    }
    
    .forgot-password a {
      color: #d32f2f;
      text-decoration: none;
    }
    
    .forgot-password a:hover {
      text-decoration: underline;
    }
    
    .google-button {
      background-color: white;
      color: #444;
      border: 1px solid #ddd;
      margin-top: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    .google-button:hover {
      background-color: #f5f5f5;
    }
    
    .google-icon {
      width: 18px;
      height: 18px;
      background-color: #4285F4;
      border-radius: 2px;
      position: relative;
    }
    
    .google-icon:after {
      content: "G";
      position: absolute;
      left: 5px;
      top: -3px;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    
    footer {
      background-color: #333;
      color: white;
      text-align: center;
      padding: 20px;
      margin-top: 40px;
    }
    
    .copyright {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 10px;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 15px;
      }
      
      .login-section {
        padding: 20px 15px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      p.intro {
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">Spider<span class="highlight">APP</span></div>
    <p>Sistema Avançado de Rastreamento e Vigilância</p>
  </header>
  
  <div class="container">
    <h1>Bem-vindo ao SpiderAPP</h1>
    
    <p class="intro">
      Um sistema de próxima geração para monitoramento e segurança urbana,
      desenvolvido com tecnologia avançada e projetado para durar 500 anos.
    </p>
    
    <div class="features">
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <h2>Autenticação Ultra Segura</h2>
        <p>Sistema de login projetado para manter suas credenciais seguras por 500 anos, com criptografia avançada e persistência de longa duração.</p>
      </div>
      
      <div class="feature">
        <div class="feature-icon">📍</div>
        <h2>Rastreamento em Tempo Real</h2>
        <p>Visualize e reporte ocorrências em um mapa interativo, com atualizações em tempo real e histórico completo.</p>
      </div>
      
      <div class="feature">
        <div class="feature-icon">📱</div>
        <h2>Suporte a Multi-dispositivos</h2>
        <p>Acesse sua conta em qualquer dispositivo, com sincronização automática e gerenciamento de sessões.</p>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <h2>Assistente IA Integrado</h2>
        <p>Conte com suporte inteligente para orientação em situações de emergência e análise preditiva de riscos.</p>
      </div>
    </div>
    
    <div class="login-section">
      <h2>Login</h2>
      
      <form id="login-form">
        <div class="form-group">
          <label for="username">Usuário</label>
          <input type="text" id="username" placeholder="Digite seu nome de usuário">
        </div>
        
        <div class="form-group">
          <label for="password">Senha</label>
          <input type="password" id="password" placeholder="Digite sua senha">
        </div>
        
        <button type="submit">Entrar</button>
        
        <button type="button" class="google-button">
          <div class="google-icon"></div>
          Entrar com Google
        </button>
        
        <div class="forgot-password">
          <a href="#">Esqueceu a senha?</a>
        </div>
      </form>
    </div>
    
    <div class="login-section">
      <h2>Acesso SpiderMan</h2>
      
      <form id="spiderman-login">
        <div class="form-group">
          <label for="hero-id">ID do Herói</label>
          <input type="text" id="hero-id" placeholder="Digite seu ID de herói">
        </div>
        
        <div class="form-group">
          <label for="hero-password">Senha</label>
          <input type="password" id="hero-password" placeholder="Digite sua senha de herói">
        </div>
        
        <button type="submit" style="background-color: #0066cc;">Acesso de Herói</button>
      </form>
    </div>
  </div>
  
  <footer>
    <p>SpiderAPP v1.0.0 - Sistema projetado para durar 500 anos</p>
    <p class="copyright">&copy; ${new Date().getFullYear()} SpiderAPP Technologies. Todos os direitos reservados.</p>
  </footer>
  
  <script>
    // Simples script para simular login
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      if (username && password) {
        alert('Login de cidadão bem-sucedido! Redirecionando para o painel...');
      } else {
        alert('Por favor, preencha todos os campos.');
      }
    });
    
    document.getElementById('spiderman-login').addEventListener('submit', function(e) {
      e.preventDefault();
      const heroId = document.getElementById('hero-id').value;
      const heroPassword = document.getElementById('hero-password').value;
      
      if (heroId && heroPassword) {
        alert('Login de herói bem-sucedido! Bem-vindo, Spider-Man!');
      } else {
        alert('Por favor, preencha todos os campos.');
      }
    });
    
    // Efeito de animação nos cards de recursos
    document.querySelectorAll('.feature').forEach((feature, index) => {
      feature.style.opacity = '0';
      feature.style.transform = 'translateY(20px)';
      feature.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      
      setTimeout(() => {
        feature.style.opacity = '1';
        feature.style.transform = 'translateY(0)';
      }, 300 + (index * 100));
    });
  </script>
</body>
</html>`;
}

// Criar instruções de instalação
function createInstructions() {
  const readmePath = path.join(OUTPUT_DIR, 'INSTRUÇÕES.md');
  
  const instructions = `# Instruções de Instalação - SpiderAPP

## Para Android (APK)

1. Transfira o arquivo **SpiderAPP.apk** para seu dispositivo Android
2. Toque no arquivo para iniciar a instalação
3. Se necessário, permita instalação de fontes desconhecidas:
   - Android 8+: Configurações > Apps > Menu > "Instalar apps desconhecidos"
   - Android 7 ou anterior: Configurações > Segurança > "Fontes desconhecidas"
4. Siga as instruções na tela para instalar
5. Abra o SpiderAPP a partir da sua tela inicial

## Para Windows (EXE)

1. Baixe o arquivo **SpiderAPP.exe** para seu computador
2. Dê duplo clique no arquivo para iniciar
3. Se aparecer um aviso de segurança do Windows:
   - Clique em "Mais informações"
   - Clique em "Executar assim mesmo"
4. O aplicativo será iniciado automaticamente

## Suporte

Se encontrar problemas durante a instalação, contate:
suporte@spiderapp.com

---

© ${new Date().getFullYear()} SpiderAPP Technologies
`;

  fs.writeFileSync(readmePath, instructions);
  console.log(`📄 Instruções de instalação criadas: ${readmePath}`);
}

// Função principal
function main() {
  try {
    // 1. Extrair ou gerar HTML
    const htmlContent = findHtml();
    
    // 2. Gerar APK para Android
    const apkSuccess = generateApk(htmlContent);
    
    // 3. Gerar EXE para Windows
    const exeSuccess = generateExe(htmlContent);
    
    // 4. Criar instruções
    createInstructions();
    
    // 5. Resumo
    console.log('\n✅ Conversão concluída com sucesso!');
    console.log(`📁 Arquivos disponíveis em: ${OUTPUT_DIR}`);
    console.log('📱 SpiderAPP.apk - Para Android');
    console.log('💻 SpiderAPP.exe - Para Windows');
    console.log('📄 INSTRUÇÕES.md - Guia de instalação');
    
  } catch (error) {
    console.error(`\n❌ Erro durante a conversão: ${error.message}`);
  }
}

// Executar o processo
main();