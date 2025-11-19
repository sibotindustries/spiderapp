import React, { useEffect, useState } from 'react';
import { identifyCurrentDevice, getDeviceType } from '../lib/deviceDatabase';

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
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

const DeviceInfoDisplay: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    detectDeviceInfo();
    window.addEventListener('resize', detectDeviceInfo);
    window.addEventListener('orientationchange', detectDeviceInfo);

    return () => {
      window.removeEventListener('resize', detectDeviceInfo);
      window.removeEventListener('orientationchange', detectDeviceInfo);
    };
  }, []);

  const detectDeviceInfo = () => {
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Detectar sistema operacional
    let os = 'Unknown';
    let osVersion = '';
    
    if (ua.includes('Android')) {
      os = 'Android';
      const match = ua.match(/Android (\d+)\.(\d+)/);
      if (match) osVersion = `${match[1]}${match[2] ? '.' + match[2] : ''}`;
    } else if (ua.includes('iPhone OS') || ua.includes('iPad OS')) {
      os = 'iOS';
      const match = ua.match(/OS (\d+)_(\d+)/);
      if (match) osVersion = `${match[1]}${match[2] ? '.' + match[2] : ''}`;
    } else if (ua.includes('Windows')) {
      os = 'Windows';
      const match = ua.match(/Windows NT (\d+)\.(\d+)/);
      if (match) osVersion = match[1] + '.' + match[2];
    } else if (ua.includes('Mac OS X')) {
      os = 'macOS';
      const match = ua.match(/Mac OS X (\d+)[\._](\d+)/);
      if (match) osVersion = match[1] + '.' + match[2];
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    }
    
    // Detectar navegador
    let browserName = 'Unknown';
    let browserVersion = '';
    
    if (ua.includes('Chrome/')) {
      browserName = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
      if (match) browserVersion = match[1] + '.' + match[2] + '.' + match[3] + '.' + match[4];
    } else if (ua.includes('Firefox/')) {
      browserName = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)\.(\d+)/);
      if (match) browserVersion = match[1] + '.' + match[2];
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      browserName = 'Safari';
      const match = ua.match(/Version\/(\d+)\.(\d+)/);
      if (match) browserVersion = match[1] + '.' + match[2];
    } else if (ua.includes('Edge/') || ua.includes('Edg/')) {
      browserName = 'Edge';
      const match = ua.match(/Edg(?:e)?\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
      if (match) browserVersion = match[1] + '.' + match[2] + '.' + match[3] + '.' + match[4];
    } else if (ua.includes('MSIE ') || ua.includes('Trident/')) {
      browserName = 'Internet Explorer';
      const match = ua.match(/(?:MSIE |rv:)(\d+)\.(\d+)/);
      if (match) browserVersion = match[1] + '.' + match[2];
    }
    
    // Identificar marca/modelo usando o banco de dados de dispositivos
    let brand = 'Unknown';
    let model = 'Generic';
    let deviceCode = 'unknown-device';
    
    // Detector de marca
    if (ua.includes('iPhone')) { 
      brand = 'Apple';
      model = 'iPhone';
      deviceCode = 'iphone';
    } else if (ua.includes('iPad')) {
      brand = 'Apple';
      model = 'iPad';
      deviceCode = 'ipad';
    } else if (ua.includes('SM-') || ua.includes('SAMSUNG') || ua.includes('Galaxy')) {
      brand = 'Samsung';
      const match = ua.match(/SM-[A-Z0-9]+/);
      if (match) {
        model = match[0];
        deviceCode = 'samsung-' + model.toLowerCase();
      } else {
        model = 'Galaxy';
        deviceCode = 'samsung-galaxy';
      }
    } else if (ua.includes('Pixel')) {
      brand = 'Google';
      const match = ua.match(/Pixel [0-9]+/);
      if (match) {
        model = match[0];
        deviceCode = 'google-' + model.toLowerCase().replace(' ', '-');
      } else {
        model = 'Pixel';
        deviceCode = 'google-pixel';
      }
    } else if (ua.includes('Moto') || ua.includes('motorola')) {
      brand = 'Motorola';
      // Tenta extrair o modelo específico
      const match = ua.match(/moto [a-z0-9 ]+/i);
      if (match) {
        model = match[0];
        deviceCode = 'moto-' + model.toLowerCase().replace(/\s+/g, '-');
      } else {
        model = 'Moto G';
        deviceCode = 'moto-g';
      }
    } else if (ua.includes('Xiaomi') || ua.includes('Redmi') || ua.includes('POCO')) {
      brand = 'Xiaomi';
      if (ua.includes('Redmi')) {
        const match = ua.match(/Redmi [A-Za-z0-9 ]+/);
        if (match) {
          model = match[0];
          deviceCode = 'redmi-' + model.toLowerCase().replace(/\s+/g, '-');
        } else {
          model = 'Redmi';
          deviceCode = 'redmi';
        }
      } else if (ua.includes('POCO')) {
        const match = ua.match(/POCO [A-Za-z0-9 ]+/);
        if (match) {
          model = match[0];
          deviceCode = 'poco-' + model.toLowerCase().replace(/\s+/g, '-');
        } else {
          model = 'POCO';
          deviceCode = 'poco';
        }
      } else {
        const match = ua.match(/Mi [A-Za-z0-9 ]+/);
        if (match) {
          model = match[0];
          deviceCode = 'mi-' + model.toLowerCase().replace(/\s+/g, '-');
        } else {
          model = 'Mi';
          deviceCode = 'mi';
        }
      }
    }
    
    // Tente identificar através do banco de dados de dispositivos
    const detectedDevice = identifyCurrentDevice(width, height, pixelRatio, ua);
    if (detectedDevice) {
      brand = detectedDevice.brand;
      model = detectedDevice.displayName;
      deviceCode = detectedDevice.model.toLowerCase();
    }
    
    // Informações fundamentais sobre o dispositivo
    const deviceType = getDeviceType(width);
    const isPortrait = height > width;
    
    const info: DeviceInfo = {
      type: deviceType,
      brand,
      model,
      orientation: isPortrait ? 'portrait' : 'landscape',
      os,
      osVersion,
      browserName,
      browserVersion,
      screenWidth: width,
      screenHeight: height,
      devicePixelRatio: pixelRatio,
      isAndroid: os === 'Android',
      isIOS: os === 'iOS',
      isSamsung: brand === 'Samsung',
      isMotorola: brand === 'Motorola',
      isXiaomi: brand === 'Xiaomi',
      deviceCode
    };
    
    setDeviceInfo(info);
    
    // Também envia para o console para debugging
    console.log('Dispositivo detectado:', info);
    
    // Adiciona class ao HTML para estilização específica
    document.documentElement.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    document.documentElement.classList.add(`device-${deviceType}`);
    
    // Adicionar classes específicas para marcas
    document.documentElement.classList.remove('brand-apple', 'brand-samsung', 'brand-google', 'brand-xiaomi', 'brand-motorola');
    document.documentElement.classList.add(`brand-${brand.toLowerCase()}`);
    
    // Adicionar classe para orientação do dispositivo
    document.documentElement.classList.remove('orientation-portrait', 'orientation-landscape');
    document.documentElement.classList.add(`orientation-${isPortrait ? 'portrait' : 'landscape'}`);
    
    // Expor informações no console global para debugging
    (window as any).spiderappDeviceInfo = info;
    console.log('SpiderAPP: Dispositivo detectado', info);
  };

  if (!deviceInfo) return null;

  return (
    <div className="device-info-display p-4 bg-background/90 backdrop-blur text-xs text-foreground rounded-md shadow-md fixed bottom-4 right-4 opacity-80 hover:opacity-100 transition-opacity z-50 max-w-xs">
      <h3 className="font-bold mb-1">{deviceInfo.brand} {deviceInfo.model}</h3>
      <div className="grid grid-cols-2 gap-1">
        <div className="text-muted-foreground">Tipo:</div>
        <div>{deviceInfo.type}</div>
        
        <div className="text-muted-foreground">SO:</div>
        <div>{deviceInfo.os} {deviceInfo.osVersion}</div>
        
        <div className="text-muted-foreground">Tela:</div>
        <div>{deviceInfo.screenWidth}×{deviceInfo.screenHeight}</div>
        
        <div className="text-muted-foreground">Pixel Ratio:</div>
        <div>{deviceInfo.devicePixelRatio}</div>
        
        <div className="text-muted-foreground">Orientação:</div>
        <div>{deviceInfo.orientation}</div>
        
        <div className="text-muted-foreground">Navegador:</div>
        <div>{deviceInfo.browserName} {deviceInfo.browserVersion}</div>
      </div>
    </div>
  );
};

export default DeviceInfoDisplay;