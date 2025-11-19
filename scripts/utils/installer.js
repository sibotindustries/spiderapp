/**
 * SpiderAPP - Instalador Universal
 * 
 * Este script detecta o sistema operacional do usuário e oferece o instalador
 * adequado para Android (APK) ou Windows (EXE).
 */

// Detecção do sistema operacional
const userAgent = navigator.userAgent || navigator.vendor || window.opera;
const isAndroid = /android/i.test(userAgent);
const isWindows = /windows/i.test(userAgent);

// Caminhos para os arquivos
const androidInstaller = 'final-builds/SpiderAPP.apk';
const windowsInstaller = 'final-builds/SpiderAPP.exe';
const instructions = 'final-builds/INSTRUÇÕES.md';
const zipPackage = 'downloads/spiderapp-installers.zip';

// Ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  const body = document.body;
  
  // Criar container principal
  const container = document.createElement('div');
  container.className = 'installer-container';
  
  // Adicionar título
  const title = document.createElement('h1');
  title.textContent = 'SpiderAPP - Instalador';
  container.appendChild(title);
  
  // Adicionar descrição
  const description = document.createElement('p');
  description.className = 'description';
  description.textContent = 'Baixe o SpiderAPP para seu dispositivo e tenha acesso ao sistema de rastreamento e vigilância mais avançado do mundo, projetado para durar 500 anos.';
  container.appendChild(description);
  
  // Detectar sistema e oferecer o instalador correto
  const detectedSystem = document.createElement('p');
  detectedSystem.className = 'detected-system';
  
  if (isAndroid) {
    detectedSystem.innerHTML = '🔍 <strong>Sistema Android detectado!</strong> Oferecendo o instalador APK...';
  } else if (isWindows) {
    detectedSystem.innerHTML = '🔍 <strong>Sistema Windows detectado!</strong> Oferecendo o instalador EXE...';
  } else {
    detectedSystem.innerHTML = '🔍 <strong>Sistema não identificado.</strong> Escolha o instalador adequado abaixo:';
  }
  
  container.appendChild(detectedSystem);
  
  // Criar botões de download
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'download-buttons';
  
  // Botão para Android
  const androidButton = createDownloadButton('📱 Download para Android (APK)', androidInstaller, isAndroid);
  buttonsContainer.appendChild(androidButton);
  
  // Botão para Windows
  const windowsButton = createDownloadButton('💻 Download para Windows (EXE)', windowsInstaller, isWindows);
  buttonsContainer.appendChild(windowsButton);
  
  // Botão para pacote ZIP com todos os arquivos
  const zipButton = createDownloadButton('📦 Download completo (ZIP)', zipPackage, false);
  zipButton.classList.add('zip-button');
  buttonsContainer.appendChild(zipButton);
  
  container.appendChild(buttonsContainer);
  
  // Instruções básicas
  const instructionsContainer = document.createElement('div');
  instructionsContainer.className = 'instructions';
  
  const instructionsTitle = document.createElement('h2');
  instructionsTitle.textContent = 'Instruções de Instalação';
  instructionsContainer.appendChild(instructionsTitle);
  
  // Instruções para Android
  const androidInstructions = document.createElement('div');
  androidInstructions.className = 'platform-instructions';
  androidInstructions.innerHTML = `
    <h3>📱 Para Android</h3>
    <ol>
      <li>Baixe o arquivo APK</li>
      <li>Toque no arquivo para iniciar a instalação</li>
      <li>Se necessário, permita instalação de fontes desconhecidas</li>
      <li>Siga as instruções na tela</li>
      <li>Abra o SpiderAPP a partir da sua tela inicial</li>
    </ol>
  `;
  instructionsContainer.appendChild(androidInstructions);
  
  // Instruções para Windows
  const windowsInstructions = document.createElement('div');
  windowsInstructions.className = 'platform-instructions';
  windowsInstructions.innerHTML = `
    <h3>💻 Para Windows</h3>
    <ol>
      <li>Baixe o arquivo EXE</li>
      <li>Dê duplo clique no arquivo para iniciar</li>
      <li>Se aparecer um aviso de segurança, clique em "Mais informações" e depois em "Executar assim mesmo"</li>
      <li>O aplicativo será iniciado automaticamente</li>
    </ol>
  `;
  instructionsContainer.appendChild(windowsInstructions);
  
  container.appendChild(instructionsContainer);
  
  // Rodapé
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p>SpiderAPP - Sistema de Rastreamento e Vigilância</p>
    <p class="copyright">© ${new Date().getFullYear()} SpiderAPP Technologies. Todos os direitos reservados.</p>
  `;
  container.appendChild(footer);
  
  // Adicionar container ao corpo
  body.appendChild(container);
  
  // Adicionar estilos
  addStyles();
});

// Função para criar botão de download
function createDownloadButton(text, link, isHighlighted) {
  const button = document.createElement('a');
  button.href = link;
  button.className = 'download-button';
  if (isHighlighted) {
    button.classList.add('highlighted');
  }
  button.textContent = text;
  button.setAttribute('download', '');
  return button;
}

// Adicionar estilos CSS
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      color: #333;
      line-height: 1.6;
    }
    
    .installer-container {
      max-width: 800px;
      margin: 40px auto;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      padding: 30px;
    }
    
    h1 {
      color: #d32f2f;
      text-align: center;
      margin-bottom: 20px;
      font-size: 2.2rem;
    }
    
    h2 {
      color: #333;
      margin-top: 30px;
      font-size: 1.6rem;
    }
    
    h3 {
      color: #d32f2f;
      font-size: 1.3rem;
      margin-bottom: 10px;
    }
    
    .description {
      text-align: center;
      font-size: 1.1rem;
      margin-bottom: 30px;
      color: #555;
    }
    
    .detected-system {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #d32f2f;
      margin-bottom: 30px;
    }
    
    .download-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 40px;
    }
    
    .download-button {
      display: block;
      text-align: center;
      padding: 15px 20px;
      background-color: #2196F3;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }
    
    .download-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 10px rgba(0,0,0,0.1);
    }
    
    .download-button.highlighted {
      background-color: #d32f2f;
      font-size: 1.2rem;
      padding: 18px 20px;
    }
    
    .zip-button {
      background-color: #4CAF50;
    }
    
    .platform-instructions {
      margin-bottom: 25px;
    }
    
    ol {
      padding-left: 25px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
    }
    
    .copyright {
      font-size: 0.9rem;
      color: #888;
    }
    
    @media (max-width: 600px) {
      .installer-container {
        margin: 20px;
        padding: 20px;
      }
      
      h1 {
        font-size: 1.8rem;
      }
      
      .download-button {
        font-size: 1rem;
      }
    }
  `;
  document.head.appendChild(style);
}