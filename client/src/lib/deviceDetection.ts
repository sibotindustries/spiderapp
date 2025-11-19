/**
 * Sistema de Detecção de Dispositivos
 * 
 * Esta biblioteca detecta a marca e modelo de dispositivos móveis
 * para aplicar estilos CSS personalizados baseados no dispositivo.
 */

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  brand: string;
  model: string;
  orientation: 'portrait' | 'landscape';
  os: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isAndroid: boolean;
  isIOS: boolean;
  isSamsung: boolean;
  isMotorola: boolean;
  isXiaomi: boolean;
  deviceCode: string;
}

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Valores padrão
  let deviceInfo: DeviceInfo = {
    type: 'unknown',
    brand: 'unknown',
    model: 'unknown',
    orientation,
    os: 'unknown',
    osVersion: 'unknown',
    browserName: 'unknown',
    browserVersion: 'unknown',
    screenWidth,
    screenHeight,
    devicePixelRatio,
    isAndroid: false,
    isIOS: false,
    isSamsung: false,
    isMotorola: false,
    isXiaomi: false,
    deviceCode: 'unknown'
  };
  
  // Detecção de sistema operacional
  if (/android/i.test(ua)) {
    deviceInfo.os = 'Android';
    deviceInfo.isAndroid = true;
    
    // Tentar extrair a versão do Android
    const androidVersionMatch = ua.match(/Android\s([0-9.]+)/i);
    if (androidVersionMatch && androidVersionMatch[1]) {
      deviceInfo.osVersion = androidVersionMatch[1];
    }
    
    // Detecção de tipo de dispositivo para Android
    if (/tablet|SM-T|SM-P/i.test(ua)) {
      deviceInfo.type = 'tablet';
    } else {
      deviceInfo.type = 'mobile';
    }
    
    // Detecção de marca e modelo para Android
    if (/samsung|SM-|GT-/i.test(ua)) {
      deviceInfo.brand = 'Samsung';
      deviceInfo.isSamsung = true;
      
      // Extrair modelo Samsung
      const samsungModelMatch = ua.match(/(SM-[A-Z0-9]+)/i);
      if (samsungModelMatch && samsungModelMatch[1]) {
        deviceInfo.model = samsungModelMatch[1];
        deviceInfo.deviceCode = samsungModelMatch[1].toLowerCase();
      }
    } 
    else if (/motorola|moto/i.test(ua)) {
      deviceInfo.brand = 'Motorola';
      deviceInfo.isMotorola = true;
      
      // Extrair modelo Motorola
      const motoModelMatch = ua.match(/moto\s([a-z0-9\s]+)/i);
      if (motoModelMatch && motoModelMatch[1]) {
        deviceInfo.model = 'Moto ' + motoModelMatch[1].trim();
        
        // Detecção específica para Moto G73 5G
        if (/g73|xt2375/i.test(ua)) {
          deviceInfo.model = 'Moto G73 5G';
          deviceInfo.deviceCode = 'moto-g73-5g';
        }
      }
    } 
    else if (/xiaomi|redmi|poco/i.test(ua)) {
      deviceInfo.brand = 'Xiaomi';
      deviceInfo.isXiaomi = true;
      
      // Extrair modelo Xiaomi/Redmi/POCO
      const xiaomiModelMatch = ua.match(/(redmi|poco|mi)\s([a-z0-9\s]+)/i);
      if (xiaomiModelMatch && xiaomiModelMatch[2]) {
        deviceInfo.model = xiaomiModelMatch[1] + ' ' + xiaomiModelMatch[2].trim();
        deviceInfo.deviceCode = xiaomiModelMatch[0].toLowerCase().replace(/\s+/g, '-');
      }
    }
    else if (/huawei/i.test(ua)) {
      deviceInfo.brand = 'Huawei';
      
      // Extrair modelo Huawei
      const huaweiModelMatch = ua.match(/huawei\s([a-z0-9\-]+)/i);
      if (huaweiModelMatch && huaweiModelMatch[1]) {
        deviceInfo.model = 'Huawei ' + huaweiModelMatch[1];
        deviceInfo.deviceCode = 'huawei-' + huaweiModelMatch[1].toLowerCase();
      }
    }
    else if (/oneplus/i.test(ua)) {
      deviceInfo.brand = 'OnePlus';
      
      // Extrair modelo OnePlus
      const oneplusModelMatch = ua.match(/oneplus\s([a-z0-9\s]+)/i);
      if (oneplusModelMatch && oneplusModelMatch[1]) {
        deviceInfo.model = 'OnePlus ' + oneplusModelMatch[1].trim();
        deviceInfo.deviceCode = 'oneplus-' + oneplusModelMatch[1].toLowerCase().replace(/\s+/g, '-');
      }
    }
    else if (/oppo/i.test(ua)) {
      deviceInfo.brand = 'OPPO';
      
      // Extrair modelo OPPO
      const oppoModelMatch = ua.match(/oppo\s([a-z0-9\s]+)/i);
      if (oppoModelMatch && oppoModelMatch[1]) {
        deviceInfo.model = 'OPPO ' + oppoModelMatch[1].trim();
        deviceInfo.deviceCode = 'oppo-' + oppoModelMatch[1].toLowerCase().replace(/\s+/g, '-');
      }
    }
    else if (/vivo/i.test(ua)) {
      deviceInfo.brand = 'Vivo';
      
      // Extrair modelo Vivo
      const vivoModelMatch = ua.match(/vivo\s([a-z0-9\s]+)/i);
      if (vivoModelMatch && vivoModelMatch[1]) {
        deviceInfo.model = 'Vivo ' + vivoModelMatch[1].trim();
        deviceInfo.deviceCode = 'vivo-' + vivoModelMatch[1].toLowerCase().replace(/\s+/g, '-');
      }
    }
    else if (/realme/i.test(ua)) {
      deviceInfo.brand = 'Realme';
      
      // Extrair modelo Realme
      const realmeModelMatch = ua.match(/realme\s([a-z0-9\s]+)/i);
      if (realmeModelMatch && realmeModelMatch[1]) {
        deviceInfo.model = 'Realme ' + realmeModelMatch[1].trim();
        deviceInfo.deviceCode = 'realme-' + realmeModelMatch[1].toLowerCase().replace(/\s+/g, '-');
      }
    }
    else if (/nokia/i.test(ua)) {
      deviceInfo.brand = 'Nokia';
      
      // Extrair modelo Nokia
      const nokiaModelMatch = ua.match(/nokia\s([a-z0-9\.\-]+)/i);
      if (nokiaModelMatch && nokiaModelMatch[1]) {
        deviceInfo.model = 'Nokia ' + nokiaModelMatch[1];
        deviceInfo.deviceCode = 'nokia-' + nokiaModelMatch[1].toLowerCase();
      }
    }
    else if (/asus|zenfone/i.test(ua)) {
      deviceInfo.brand = 'Asus';
      
      // Extrair modelo Asus
      const asusModelMatch = ua.match(/(zenfone|asus)\s([a-z0-9\s]+)/i);
      if (asusModelMatch && asusModelMatch[2]) {
        deviceInfo.model = 'Asus ' + asusModelMatch[2].trim();
        deviceInfo.deviceCode = 'asus-' + asusModelMatch[2].toLowerCase().replace(/\s+/g, '-');
      }
    }
    else if (/lenovo/i.test(ua)) {
      deviceInfo.brand = 'Lenovo';
      
      // Extrair modelo Lenovo
      const lenovoModelMatch = ua.match(/lenovo\s([a-z0-9\s]+)/i);
      if (lenovoModelMatch && lenovoModelMatch[1]) {
        deviceInfo.model = 'Lenovo ' + lenovoModelMatch[1].trim();
        deviceInfo.deviceCode = 'lenovo-' + lenovoModelMatch[1].toLowerCase().replace(/\s+/g, '-');
      }
    }
    
    // Se depois de todas as verificações o modelo ainda for desconhecido
    // extrair modelo genérico do Android se possível
    if (deviceInfo.model === 'unknown') {
      const genericModelMatch = ua.match(/;\s([^;]+)\sBuild\//i);
      if (genericModelMatch && genericModelMatch[1]) {
        deviceInfo.model = genericModelMatch[1].trim();
        deviceInfo.deviceCode = genericModelMatch[1].toLowerCase().replace(/\s+/g, '-');
      }
    }
  } 
  else if (/iPad|iPhone|iPod/i.test(ua)) {
    deviceInfo.os = 'iOS';
    deviceInfo.isIOS = true;
    deviceInfo.brand = 'Apple';
    
    // Tentar extrair a versão do iOS
    const iosVersionMatch = ua.match(/OS\s([0-9_]+)/i);
    if (iosVersionMatch && iosVersionMatch[1]) {
      deviceInfo.osVersion = iosVersionMatch[1].replace(/_/g, '.');
    }
    
    // Detecção de tipo de dispositivo para iOS
    if (/iPad/i.test(ua)) {
      deviceInfo.type = 'tablet';
      deviceInfo.model = 'iPad';
      deviceInfo.deviceCode = 'ipad';
      
      // Tentativa de identificar modelo específico do iPad
      if (/iPad Pro/i.test(ua)) {
        deviceInfo.model = 'iPad Pro';
        deviceInfo.deviceCode = 'ipad-pro';
      } else if (/iPad Air/i.test(ua)) {
        deviceInfo.model = 'iPad Air';
        deviceInfo.deviceCode = 'ipad-air';
      } else if (/iPad Mini/i.test(ua)) {
        deviceInfo.model = 'iPad Mini';
        deviceInfo.deviceCode = 'ipad-mini';
      }
    } else {
      deviceInfo.type = 'mobile';
      
      // Identificação de modelos de iPhone
      if (/iPhone/i.test(ua)) {
        deviceInfo.model = 'iPhone';
        deviceInfo.deviceCode = 'iphone';
        
        // Detecção mais específica do modelo do iPhone
        // usando características de tela e outros identificadores
        if (devicePixelRatio === 3) {
          if (screenHeight === 812 || screenHeight === 896) {
            deviceInfo.model = 'iPhone X/XS/11 Pro';
            deviceInfo.deviceCode = 'iphone-x';
          } else if (screenHeight === 844 || screenHeight === 926) {
            deviceInfo.model = 'iPhone 12/13/14';
            deviceInfo.deviceCode = 'iphone-12';
          } else if (screenHeight === 852 || screenHeight === 932) {
            deviceInfo.model = 'iPhone 14 Pro/15 Pro';
            deviceInfo.deviceCode = 'iphone-14-pro';
          }
        }
      } else if (/iPod/i.test(ua)) {
        deviceInfo.model = 'iPod Touch';
        deviceInfo.deviceCode = 'ipod';
      }
    }
  } 
  else if (/Windows Phone/i.test(ua)) {
    deviceInfo.os = 'Windows Phone';
    deviceInfo.type = 'mobile';
    
    // Extração de versão do Windows Phone
    const wpVersionMatch = ua.match(/Windows Phone\s([0-9.]+)/i);
    if (wpVersionMatch && wpVersionMatch[1]) {
      deviceInfo.osVersion = wpVersionMatch[1];
    }
    
    // Detecção de marca para Windows Phone
    if (/Lumia/i.test(ua)) {
      deviceInfo.brand = 'Nokia';
      
      // Extração do modelo Lumia
      const lumiaModelMatch = ua.match(/Lumia\s([0-9]+)/i);
      if (lumiaModelMatch && lumiaModelMatch[1]) {
        deviceInfo.model = 'Lumia ' + lumiaModelMatch[1];
        deviceInfo.deviceCode = 'lumia-' + lumiaModelMatch[1];
      }
    }
  } 
  else if (/Windows NT/i.test(ua)) {
    deviceInfo.os = 'Windows';
    deviceInfo.type = 'desktop';
    
    // Extração de versão do Windows
    const winVersionMatch = ua.match(/Windows NT\s([0-9.]+)/i);
    if (winVersionMatch && winVersionMatch[1]) {
      const versionNumber = winVersionMatch[1];
      switch (versionNumber) {
        case '10.0': deviceInfo.osVersion = '10/11'; break;
        case '6.3': deviceInfo.osVersion = '8.1'; break;
        case '6.2': deviceInfo.osVersion = '8'; break;
        case '6.1': deviceInfo.osVersion = '7'; break;
        case '6.0': deviceInfo.osVersion = 'Vista'; break;
        case '5.2': deviceInfo.osVersion = 'XP 64-Bit/Server 2003'; break;
        case '5.1': deviceInfo.osVersion = 'XP'; break;
        default: deviceInfo.osVersion = versionNumber;
      }
    }
  } 
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceInfo.os = 'macOS';
    deviceInfo.type = 'desktop';
    deviceInfo.brand = 'Apple';
    
    // Extração de versão do macOS
    const macVersionMatch = ua.match(/Mac OS X\s([0-9_\.]+)/i);
    if (macVersionMatch && macVersionMatch[1]) {
      deviceInfo.osVersion = macVersionMatch[1].replace(/_/g, '.');
    }
  } 
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
    deviceInfo.os = 'Linux';
    deviceInfo.type = 'desktop';
    
    // Detecção de distribuições Linux
    if (/Ubuntu/i.test(ua)) {
      deviceInfo.osVersion = 'Ubuntu';
    } else if (/Fedora/i.test(ua)) {
      deviceInfo.osVersion = 'Fedora';
    } else if (/Debian/i.test(ua)) {
      deviceInfo.osVersion = 'Debian';
    }
  }
  
  // Detecção do navegador
  if (/Chrome/i.test(ua) && !/Chromium|Edge|OPR|Opera/i.test(ua)) {
    deviceInfo.browserName = 'Chrome';
    const chromeVersionMatch = ua.match(/Chrome\/([0-9.]+)/i);
    if (chromeVersionMatch && chromeVersionMatch[1]) {
      deviceInfo.browserVersion = chromeVersionMatch[1];
    }
  } 
  else if (/Firefox/i.test(ua)) {
    deviceInfo.browserName = 'Firefox';
    const firefoxVersionMatch = ua.match(/Firefox\/([0-9.]+)/i);
    if (firefoxVersionMatch && firefoxVersionMatch[1]) {
      deviceInfo.browserVersion = firefoxVersionMatch[1];
    }
  } 
  else if (/Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua)) {
    deviceInfo.browserName = 'Safari';
    const safariVersionMatch = ua.match(/Version\/([0-9.]+)/i);
    if (safariVersionMatch && safariVersionMatch[1]) {
      deviceInfo.browserVersion = safariVersionMatch[1];
    }
  } 
  else if (/Edge/i.test(ua)) {
    deviceInfo.browserName = 'Edge';
    const edgeVersionMatch = ua.match(/Edge\/([0-9.]+)/i) || ua.match(/Edg\/([0-9.]+)/i);
    if (edgeVersionMatch && edgeVersionMatch[1]) {
      deviceInfo.browserVersion = edgeVersionMatch[1];
    }
  } 
  else if (/Opera|OPR/i.test(ua)) {
    deviceInfo.browserName = 'Opera';
    const operaVersionMatch = ua.match(/(?:Opera|OPR)\/([0-9.]+)/i);
    if (operaVersionMatch && operaVersionMatch[1]) {
      deviceInfo.browserVersion = operaVersionMatch[1];
    }
  } 
  else if (/MSIE|Trident/i.test(ua)) {
    deviceInfo.browserName = 'Internet Explorer';
    const ieVersionMatch = ua.match(/(?:MSIE |rv:)([0-9.]+)/i);
    if (ieVersionMatch && ieVersionMatch[1]) {
      deviceInfo.browserVersion = ieVersionMatch[1];
    }
  }
  
  // Fallback para detecção de tipo com base no tamanho da tela
  if (deviceInfo.type === 'unknown') {
    if (screenWidth <= 767) {
      deviceInfo.type = 'mobile';
    } else if (screenWidth <= 1024) {
      deviceInfo.type = 'tablet';
    } else {
      deviceInfo.type = 'desktop';
    }
  }
  
  return deviceInfo;
}

/**
 * Aplica classes CSS ao <html> baseado no dispositivo detectado
 */
export function applyDeviceStyles() {
  const deviceInfo = detectDevice();
  const html = document.documentElement;
  
  // Remove todas as classes antigas relacionadas a dispositivos
  const oldClasses = Array.from(html.classList).filter(c => 
    c.startsWith('device-') || 
    c.startsWith('os-') || 
    c.startsWith('browser-') ||
    c.startsWith('brand-')
  );
  
  oldClasses.forEach(c => html.classList.remove(c));
  
  // Adiciona classes para o tipo de dispositivo
  html.classList.add(`device-${deviceInfo.type}`);
  
  // Adiciona classe para o sistema operacional
  const osClass = `os-${deviceInfo.os.toLowerCase().replace(/\s+/g, '-')}`;
  html.classList.add(osClass);
  
  // Adiciona classe para o navegador
  const browserClass = `browser-${deviceInfo.browserName.toLowerCase().replace(/\s+/g, '-')}`;
  html.classList.add(browserClass);
  
  // Adiciona classe para marca e modelo
  if (deviceInfo.brand !== 'unknown') {
    const brandClass = `brand-${deviceInfo.brand.toLowerCase().replace(/\s+/g, '-')}`;
    html.classList.add(brandClass);
    
    // Adiciona classe específica para o modelo
    if (deviceInfo.deviceCode !== 'unknown') {
      html.classList.add(`model-${deviceInfo.deviceCode}`);
    }
  }
  
  // Adiciona classe para orientação
  html.classList.add(`orientation-${deviceInfo.orientation}`);
  
  // Adiciona uma classe para o modelo específico Moto G73 5G
  if (deviceInfo.model === 'Moto G73 5G' || 
      (deviceInfo.isMotorola && /g73|xt2375/i.test(navigator.userAgent))) {
    html.classList.add('model-moto-g73-5g');
  }
  
  // Adiciona meta tag com informações do dispositivo para debugging
  const metaDeviceInfo = document.createElement('meta');
  metaDeviceInfo.name = 'device-info';
  metaDeviceInfo.content = JSON.stringify({
    type: deviceInfo.type,
    brand: deviceInfo.brand,
    model: deviceInfo.model,
    os: deviceInfo.os,
    browser: deviceInfo.browserName
  });
  document.head.appendChild(metaDeviceInfo);
  
  // Armazena informações do dispositivo em uma variável global para acesso via JavaScript
  window.deviceInfo = deviceInfo;
  
  // Log para debugging
  console.log('Dispositivo detectado:', deviceInfo);
  
  return deviceInfo;
}

// Adiciona tipagem para a variável global
declare global {
  interface Window {
    deviceInfo: DeviceInfo;
  }
}