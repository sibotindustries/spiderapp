import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obter o diretório atual equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretórios
const ASSETS_DIR = path.join(__dirname, 'public', 'assets');
const SCREENSHOTS_DIR = path.join(ASSETS_DIR, 'screenshots');
const SHORTCUTS_DIR = path.join(ASSETS_DIR, 'shortcuts');

// Função para verificar e criar diretórios
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório criado: ${dir}`);
  }
}

// Verificar e criar diretórios necessários
ensureDirectoryExists(ASSETS_DIR);
ensureDirectoryExists(SCREENSHOTS_DIR);
ensureDirectoryExists(SHORTCUTS_DIR);

// Use o ícone principal para gerar vários tamanhos
const ICON_SIZES = [192, 512];
const ICON_SVG = path.join(ASSETS_DIR, 'icon.svg');

if (fs.existsSync(ICON_SVG)) {
  ICON_SIZES.forEach(size => {
    const outputFile = path.join(ASSETS_DIR, `icon-${size}.png`);
    try {
      // Gerar PNG a partir do SVG
      execSync(`convert -background none -size ${size}x${size} ${ICON_SVG} ${outputFile}`);
      console.log(`Ícone gerado: ${outputFile}`);
    } catch (error) {
      console.error(`Falha ao gerar ícone ${size}x${size}:`, error.message);
    }
  });
  
  // Gerar ícone maskable (com preenchimento extra para área segura)
  try {
    const outputFile = path.join(ASSETS_DIR, 'maskable-icon.png');
    execSync(`convert -background none -size 512x512 -gravity center -extent 584x584 ${ICON_SVG} ${outputFile}`);
    console.log(`Ícone maskable gerado: ${outputFile}`);
  } catch (error) {
    console.error('Falha ao gerar ícone maskable:', error.message);
  }
} else {
  console.warn(`Arquivo SVG não encontrado: ${ICON_SVG}`);
}

// Gerar PNGs a partir dos SVGs de atalhos
const shortcutSvgs = [
  { src: path.join(SHORTCUTS_DIR, 'report.svg'), dest: path.join(SHORTCUTS_DIR, 'report.png') },
  { src: path.join(SHORTCUTS_DIR, 'my-reports.svg'), dest: path.join(SHORTCUTS_DIR, 'my-reports.png') }
];

shortcutSvgs.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    try {
      execSync(`convert -background none -size 96x96 ${src} ${dest}`);
      console.log(`Ícone de atalho gerado: ${dest}`);
    } catch (error) {
      console.error(`Falha ao gerar ícone de atalho:`, error.message);
    }
  } else {
    console.warn(`Arquivo SVG não encontrado: ${src}`);
  }
});

// Gerar PNGs a partir dos SVGs de screenshots
const screenshotSvgs = [
  { src: path.join(SCREENSHOTS_DIR, 'home-dark.svg'), dest: path.join(SCREENSHOTS_DIR, 'home-dark.png') },
  { src: path.join(SCREENSHOTS_DIR, 'report-dark.svg'), dest: path.join(SCREENSHOTS_DIR, 'report-dark.png') }
];

screenshotSvgs.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    try {
      execSync(`convert -background none -size 1280x720 ${src} ${dest}`);
      console.log(`Screenshot gerado: ${dest}`);
    } catch (error) {
      console.error(`Falha ao gerar screenshot:`, error.message);
    }
  } else {
    console.warn(`Arquivo SVG não encontrado: ${src}`);
  }
});

console.log('Geração de ícones concluída!');