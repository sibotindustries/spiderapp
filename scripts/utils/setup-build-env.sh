#!/bin/bash

# Script para preparar o ambiente de desenvolvimento Android no Replit
# Este script instala as dependências necessárias para compilar aplicativos Android

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== SpiderAPP - Configuração do Ambiente de Build ==="
echo "Diretório atual: ${SCRIPT_DIR}"

# Verificar se é um ambiente Replit
if [ ! -d "/home/runner" ]; then
  echo "Atenção: Este script foi projetado para ser executado no Replit."
  echo "Algumas etapas podem não funcionar corretamente em outros ambientes."
fi

# Instalar dependências do sistema
echo "Instalando dependências do sistema..."
apt-get update
apt-get install -y curl wget unzip zip openjdk-11-jdk gradle

# Verificar a instalação do Java
java -version
javac -version

# Instalar Node.js e npm se não estiverem instalados
if ! command -v node &> /dev/null; then
  echo "Instalando Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  apt-get install -y nodejs
fi

# Verificar a instalação do Node.js
node -v
npm -v

# Criar diretório de ferramentas
mkdir -p "${SCRIPT_DIR}/tools"

# Configurar Capacitor no projeto
echo "Configurando ambiente Capacitor..."
cd "${SCRIPT_DIR}"

# Verificar se o package.json existe
if [ ! -f "${SCRIPT_DIR}/SpiderAPP/package.json" ]; then
  echo "Criando estrutura básica do projeto Capacitor..."
  mkdir -p "${SCRIPT_DIR}/SpiderAPP"
  
  cd "${SCRIPT_DIR}/SpiderAPP"
  
  # Inicializar o projeto npm
  npm init -y
  
  # Instalar Capacitor
  npm install @capacitor/core @capacitor/cli @capacitor/android
  
  # Inicializar Capacitor
  npx cap init SpiderAPP com.spiderapp.app --web-dir www
  
  # Criar diretório www
  mkdir -p www
  
  # Criar arquivo capacitor.config.ts básico
  cat > capacitor.config.ts << EOF
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spiderapp.app',
  appName: 'SpiderAPP',
  webDir: 'www',
  bundledWebRuntime: true,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      showSpinner: true,
      spinnerColor: "#d32f2f",
    },
  }
};

export default config;
EOF

  # Adicionar scripts ao package.json
  sed -i 's/"scripts": {/"scripts": {\n    "build": "npx cap build android",\n    "sync": "npx cap sync",\n    "open": "npx cap open android",/g' package.json
  
  echo "Estrutura básica do projeto Capacitor criada com sucesso!"
else
  echo "Projeto Capacitor já existe, atualizando dependências..."
  cd "${SCRIPT_DIR}/SpiderAPP"
  npm install
fi

# Tornar scripts executáveis
chmod +x "${SCRIPT_DIR}/download-android-sdk.sh"
chmod +x "${SCRIPT_DIR}/build-android-app.sh"

echo "=== Ambiente de build configurado com sucesso! ==="
echo ""
echo "Próximos passos:"
echo "1. Execute './download-android-sdk.sh' para baixar o Android SDK"
echo "2. Execute './build-android-app.sh' para compilar o APK do SpiderAPP"
echo ""
echo "Observação: Este script configurou o ambiente básico, mas a compilação"
echo "do APK requer o Android SDK, que será baixado pelo script 'download-android-sdk.sh'."