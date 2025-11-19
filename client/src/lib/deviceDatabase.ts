/**
 * Base de dados detalhada sobre dispositivos móveis
 * Contém informações técnicas sobre smartphones e tablets populares para melhorar a detecção de dispositivos
 */

export interface DeviceSpecs {
  brand: string;
  model: string;
  displayName: string;
  physicalResolution: {
    width: number;
    height: number;
  };
  cssResolution: {
    width: number;
    height: number;
  };
  pixelRatio: number;
  releaseYear: number;
  screenSize: number; // diagonal em polegadas
  processorType?: string;
  ram?: string;
  notes?: string;
}

// Base de dados de dispositivos para referência
export const deviceDatabase: DeviceSpecs[] = [
  // Modelos Realme
  {
    brand: 'Realme',
    model: 'Realme_GT_2_Pro',
    displayName: 'Realme GT 2 Pro',
    physicalResolution: { width: 1440, height: 3216 },
    cssResolution: { width: 360, height: 804 },
    pixelRatio: 4.0,
    releaseYear: 2022,
    screenSize: 6.7,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB/12GB',
  },
  {
    brand: 'Realme',
    model: 'Realme_GT_Neo_3',
    displayName: 'Realme GT Neo 3',
    physicalResolution: { width: 1080, height: 2412 },
    cssResolution: { width: 360, height: 804 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.7,
    processorType: 'Dimensity 8100',
    ram: '6GB/8GB/12GB',
  },
  
  // Modelos Vivo
  {
    brand: 'Vivo',
    model: 'Vivo_X80_Pro',
    displayName: 'Vivo X80 Pro',
    physicalResolution: { width: 1440, height: 3200 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 4.0,
    releaseYear: 2022,
    screenSize: 6.78,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB/12GB',
  },
  {
    brand: 'Vivo',
    model: 'Vivo_V25_Pro',
    displayName: 'Vivo V25 Pro',
    physicalResolution: { width: 1080, height: 2376 },
    cssResolution: { width: 360, height: 792 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.56,
    processorType: 'Dimensity 1300',
    ram: '8GB/12GB',
  },
  
  // Modelos OPPO
  {
    brand: 'OPPO',
    model: 'OPPO_Find_X5_Pro',
    displayName: 'OPPO Find X5 Pro',
    physicalResolution: { width: 1440, height: 3216 },
    cssResolution: { width: 360, height: 804 },
    pixelRatio: 4.0,
    releaseYear: 2022,
    screenSize: 6.7,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB/12GB',
  },
  {
    brand: 'OPPO',
    model: 'OPPO_Reno_8_Pro',
    displayName: 'OPPO Reno 8 Pro',
    physicalResolution: { width: 1080, height: 2412 },
    cssResolution: { width: 360, height: 804 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.7,
    processorType: 'Dimensity 8100-Max',
    ram: '8GB/12GB',
  },
  
  // Modelos Lenovo
  {
    brand: 'Lenovo',
    model: 'Lenovo_Legion_Y90',
    displayName: 'Lenovo Legion Y90',
    physicalResolution: { width: 1080, height: 2460 },
    cssResolution: { width: 360, height: 820 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.92,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '12GB/16GB/18GB',
    notes: 'Smartphone gamer com tela de 144Hz'
  },
  
  // Modelos Honor
  {
    brand: 'Honor',
    model: 'Honor_Magic4_Pro',
    displayName: 'Honor Magic4 Pro',
    physicalResolution: { width: 1312, height: 2848 },
    cssResolution: { width: 360, height: 780 },
    pixelRatio: 3.64,
    releaseYear: 2022,
    screenSize: 6.81,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB/12GB',
    notes: 'Resolução não padrão e pixel ratio fracionado'
  },
  
  // Modelos ZTE
  {
    brand: 'ZTE',
    model: 'ZTE_Axon_40_Ultra',
    displayName: 'ZTE Axon 40 Ultra',
    physicalResolution: { width: 1116, height: 2480 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.1,
    releaseYear: 2022,
    screenSize: 6.8,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB/12GB/16GB',
    notes: 'Resolução e pixel ratio não padrão'
  },
  
  // Modelos ASUS
  {
    brand: 'ASUS',
    model: 'ASUS_ROG_Phone_6_Pro',
    displayName: 'ASUS ROG Phone 6 Pro',
    physicalResolution: { width: 1080, height: 2448 },
    cssResolution: { width: 360, height: 816 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.78,
    processorType: 'Snapdragon 8+ Gen 1',
    ram: '16GB/18GB',
    notes: 'Smartphone gamer com tela de 165Hz'
  },
  
  // Modelos Sony
  {
    brand: 'Sony',
    model: 'Sony_Xperia_1_IV',
    displayName: 'Sony Xperia 1 IV',
    physicalResolution: { width: 1644, height: 3840 },
    cssResolution: { width: 360, height: 840 },
    pixelRatio: 4.57,
    releaseYear: 2022,
    screenSize: 6.5,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '12GB',
    notes: 'Resolução 4K e proporção 21:9'
  },
  {
    brand: 'Sony',
    model: 'Sony_Xperia_5_IV',
    displayName: 'Sony Xperia 5 IV',
    physicalResolution: { width: 1080, height: 2520 },
    cssResolution: { width: 360, height: 840 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.1,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB',
    notes: 'Proporção 21:9'
  },
  
  // Modelos LG (descontinuado mas ainda em uso)
  {
    brand: 'LG',
    model: 'LG_V60_ThinQ',
    displayName: 'LG V60 ThinQ',
    physicalResolution: { width: 1080, height: 2460 },
    cssResolution: { width: 360, height: 820 },
    pixelRatio: 3.0,
    releaseYear: 2020,
    screenSize: 6.8,
    processorType: 'Snapdragon 865',
    ram: '8GB',
    notes: 'Último flagship da LG antes de deixar mercado'
  },
  
  // Modelos HTC (descontinuado mas ainda em uso)
  {
    brand: 'HTC',
    model: 'HTC_U20_5G',
    displayName: 'HTC U20 5G',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2020,
    screenSize: 6.8,
    processorType: 'Snapdragon 765G',
    ram: '8GB',
    notes: 'Um dos últimos modelos da HTC'
  },
  
  // Modelos Nokia
  {
    brand: 'Nokia',
    model: 'Nokia_X30',
    displayName: 'Nokia X30',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.43,
    processorType: 'Snapdragon 695',
    ram: '6GB/8GB',
  },
  
  // Modelos TCL
  {
    brand: 'TCL',
    model: 'TCL_20_Pro_5G',
    displayName: 'TCL 20 Pro 5G',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2021,
    screenSize: 6.67,
    processorType: 'Snapdragon 750G',
    ram: '6GB',
  },
  
  // Modelos BlackBerry (descontinuado mas ainda em uso)
  {
    brand: 'BlackBerry',
    model: 'BlackBerry_Key2',
    displayName: 'BlackBerry Key2',
    physicalResolution: { width: 1080, height: 1620 },
    cssResolution: { width: 360, height: 540 },
    pixelRatio: 3.0,
    releaseYear: 2018,
    screenSize: 4.5,
    processorType: 'Snapdragon 660',
    ram: '6GB',
    notes: 'Teclado físico e proporção não padrão'
  },
  
  // Modelos Meizu
  {
    brand: 'Meizu',
    model: 'Meizu_18s_Pro',
    displayName: 'Meizu 18s Pro',
    physicalResolution: { width: 1440, height: 3200 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 4.0,
    releaseYear: 2021,
    screenSize: 6.7,
    processorType: 'Snapdragon 888+',
    ram: '8GB/12GB',
  },
  // Apple
  {
    brand: 'Apple',
    model: 'iPhone_14_Pro_Max',
    displayName: 'iPhone 14 Pro Max',
    physicalResolution: { width: 1284, height: 2778 },
    cssResolution: { width: 428, height: 926 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.7,
    processorType: 'A16 Bionic',
    ram: '6GB',
  },
  {
    brand: 'Apple',
    model: 'iPhone_14_Pro',
    displayName: 'iPhone 14 Pro',
    physicalResolution: { width: 1170, height: 2532 },
    cssResolution: { width: 390, height: 844 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.1,
    processorType: 'A16 Bionic',
    ram: '6GB',
  },
  {
    brand: 'Apple',
    model: 'iPhone_14',
    displayName: 'iPhone 14',
    physicalResolution: { width: 1170, height: 2532 },
    cssResolution: { width: 390, height: 844 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.1,
    processorType: 'A15 Bionic',
    ram: '6GB',
  },
  {
    brand: 'Apple',
    model: 'iPhone_13_Pro_Max',
    displayName: 'iPhone 13 Pro Max',
    physicalResolution: { width: 1284, height: 2778 },
    cssResolution: { width: 428, height: 926 },
    pixelRatio: 3.0,
    releaseYear: 2021,
    screenSize: 6.7,
    processorType: 'A15 Bionic',
    ram: '6GB',
  },
  {
    brand: 'Apple',
    model: 'iPhone_SE_2022',
    displayName: 'iPhone SE (2022)',
    physicalResolution: { width: 750, height: 1334 },
    cssResolution: { width: 375, height: 667 },
    pixelRatio: 2.0,
    releaseYear: 2022,
    screenSize: 4.7,
    processorType: 'A15 Bionic',
    ram: '4GB',
    notes: 'Formato tradicional com botão Home',
  },
  
  // Samsung
  {
    brand: 'Samsung',
    model: 'Galaxy_S23_Ultra',
    displayName: 'Galaxy S23 Ultra',
    physicalResolution: { width: 1440, height: 3088 },
    cssResolution: { width: 360, height: 772 },
    pixelRatio: 4.0,
    releaseYear: 2023,
    screenSize: 6.8,
    processorType: 'Snapdragon 8 Gen 2',
    ram: '8GB/12GB',
  },
  {
    brand: 'Samsung',
    model: 'Galaxy_S23',
    displayName: 'Galaxy S23',
    physicalResolution: { width: 1080, height: 2340 },
    cssResolution: { width: 360, height: 780 },
    pixelRatio: 3.0,
    releaseYear: 2023,
    screenSize: 6.1,
    processorType: 'Snapdragon 8 Gen 2',
    ram: '8GB',
  },
  {
    brand: 'Samsung',
    model: 'Galaxy_S22_Ultra',
    displayName: 'Galaxy S22 Ultra',
    physicalResolution: { width: 1440, height: 3088 },
    cssResolution: { width: 360, height: 772 },
    pixelRatio: 4.0,
    releaseYear: 2022,
    screenSize: 6.8,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB/12GB',
  },
  {
    brand: 'Samsung',
    model: 'Galaxy_A53',
    displayName: 'Galaxy A53 5G',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.5,
    processorType: 'Exynos 1280',
    ram: '6GB/8GB',
    notes: 'Modelo intermediário popular',
  },
  
  // Google
  {
    brand: 'Google',
    model: 'Pixel_7_Pro',
    displayName: 'Pixel 7 Pro',
    physicalResolution: { width: 1440, height: 3120 },
    cssResolution: { width: 360, height: 780 },
    pixelRatio: 4.0,
    releaseYear: 2022,
    screenSize: 6.7,
    processorType: 'Google Tensor G2',
    ram: '12GB',
  },
  {
    brand: 'Google',
    model: 'Pixel_7',
    displayName: 'Pixel 7',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.3,
    processorType: 'Google Tensor G2',
    ram: '8GB',
  },
  {
    brand: 'Google',
    model: 'Pixel_6',
    displayName: 'Pixel 6',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2021,
    screenSize: 6.4,
    processorType: 'Google Tensor',
    ram: '8GB',
  },
  
  // Xiaomi
  {
    brand: 'Xiaomi',
    model: 'Mi_13_Pro',
    displayName: 'Xiaomi 13 Pro',
    physicalResolution: { width: 1440, height: 3200 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 4.0,
    releaseYear: 2022,
    screenSize: 6.73,
    processorType: 'Snapdragon 8 Gen 2',
    ram: '8GB/12GB',
  },
  {
    brand: 'Xiaomi',
    model: 'Redmi_Note_12',
    displayName: 'Redmi Note 12',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.67,
    processorType: 'Snapdragon 4 Gen 1',
    ram: '4GB/6GB/8GB',
    notes: 'Modelo popular de entrada',
  },
  {
    brand: 'Xiaomi',
    model: 'POCO_F4',
    displayName: 'POCO F4',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.67,
    processorType: 'Snapdragon 870',
    ram: '6GB/8GB/12GB',
  },
  
  // Motorola
  {
    brand: 'Motorola',
    model: 'Moto_G73_5G',
    displayName: 'Moto G73 5G',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 320, height: 711 },
    pixelRatio: 3.375,
    releaseYear: 2023,
    screenSize: 6.5,
    processorType: 'Dimensity 930',
    ram: '8GB',
    notes: 'Dispositivo de médio alcance com proporção não padrão'
  },
  {
    brand: 'Motorola',
    model: 'Moto_G72',
    displayName: 'Moto G72',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.6,
    processorType: 'Helio G99',
    ram: '6GB/8GB',
  },
  {
    brand: 'Motorola',
    model: 'Moto_Edge_30',
    displayName: 'Moto Edge 30',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2022,
    screenSize: 6.5,
    processorType: 'Snapdragon 778G+',
    ram: '8GB',
  },
  
  // OnePlus
  {
    brand: 'OnePlus',
    model: 'OnePlus_11',
    displayName: 'OnePlus 11',
    physicalResolution: { width: 1440, height: 3216 },
    cssResolution: { width: 360, height: 804 },
    pixelRatio: 4.0,
    releaseYear: 2023,
    screenSize: 6.7,
    processorType: 'Snapdragon 8 Gen 2',
    ram: '8GB/16GB',
  },
  {
    brand: 'OnePlus',
    model: 'OnePlus_Nord_2',
    displayName: 'OnePlus Nord 2',
    physicalResolution: { width: 1080, height: 2400 },
    cssResolution: { width: 360, height: 800 },
    pixelRatio: 3.0,
    releaseYear: 2021,
    screenSize: 6.43,
    processorType: 'Dimensity 1200',
    ram: '6GB/8GB/12GB',
    notes: 'Modelo intermediário popular'
  },
  
  // Huawei
  {
    brand: 'Huawei',
    model: 'P50_Pro',
    displayName: 'Huawei P50 Pro',
    physicalResolution: { width: 1228, height: 2700 },
    cssResolution: { width: 360, height: 789 },
    pixelRatio: 3.4,
    releaseYear: 2021,
    screenSize: 6.6,
    processorType: 'Snapdragon 888',
    ram: '8GB/12GB',
    notes: 'Resolução não padrão e pixel ratio fracionado'
  },
  
  // Tablets
  {
    brand: 'Apple',
    model: 'iPad_Pro_12_9_2022',
    displayName: 'iPad Pro 12.9" (2022)',
    physicalResolution: { width: 2732, height: 2048 },
    cssResolution: { width: 1024, height: 768 },
    pixelRatio: 2.66,
    releaseYear: 2022,
    screenSize: 12.9,
    processorType: 'M2',
    ram: '8GB/16GB',
    notes: 'Tablet de alta performance'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy_Tab_S8_Ultra',
    displayName: 'Galaxy Tab S8 Ultra',
    physicalResolution: { width: 2960, height: 1848 },
    cssResolution: { width: 740, height: 462 },
    pixelRatio: 4.0,
    releaseYear: 2022,
    screenSize: 14.6,
    processorType: 'Snapdragon 8 Gen 1',
    ram: '8GB/12GB/16GB',
    notes: 'Tablet premium com tela extra grande'
  }
];

/**
 * Retorna um dispositivo pelo código do modelo
 */
export function getDeviceByModel(model: string): DeviceSpecs | undefined {
  return deviceDatabase.find(device => device.model === model);
}

/**
 * Retorna todos os dispositivos de uma determinada marca
 */
export function getDevicesByBrand(brand: string): DeviceSpecs[] {
  return deviceDatabase.filter(device => device.brand.toLowerCase() === brand.toLowerCase());
}

/**
 * Retorna uma string informativa sobre o dispositivo para depuração
 */
export function getDeviceInfo(device: DeviceSpecs): string {
  return `${device.displayName} (${device.physicalResolution.width}x${device.physicalResolution.height}, 
          ${device.screenSize}", pixel ratio: ${device.pixelRatio})`;
}

/**
 * Tenta identificar o dispositivo atual com base em características detectadas
 * Retorna null se não encontrar uma correspondência confiável
 */
export function identifyCurrentDevice(
  width: number, 
  height: number, 
  pixelRatio: number, 
  userAgent: string
): DeviceSpecs | null {
  // Detecta marca pelo user agent
  let brand = 'unknown';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) brand = 'Apple';
  else if (userAgent.includes('Samsung') || userAgent.includes('SM-')) brand = 'Samsung';
  else if (userAgent.includes('Pixel')) brand = 'Google';
  else if (userAgent.includes('Xiaomi') || userAgent.includes('Redmi') || userAgent.includes('POCO')) brand = 'Xiaomi';
  else if (userAgent.includes('Motorola') || userAgent.includes('Moto')) brand = 'Motorola';
  else if (userAgent.includes('OnePlus')) brand = 'OnePlus';
  else if (userAgent.includes('Huawei')) brand = 'Huawei';
  
  // Filtra dispositivos por marca
  let possibleDevices = deviceDatabase;
  if (brand !== 'unknown') {
    possibleDevices = getDevicesByBrand(brand);
  }
  
  // Filtra por características
  const candidates = possibleDevices.filter(device => {
    // Considere um dispositivo se a resolução CSS e pixel ratio estão próximos
    const widthDiff = Math.abs(device.cssResolution.width - width);
    const heightDiff = Math.abs(device.cssResolution.height - height);
    const ratioDiff = Math.abs(device.pixelRatio - pixelRatio);
    
    return widthDiff < 20 && heightDiff < 50 && ratioDiff < 0.5;
  });
  
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  
  // Se houver múltiplos candidatos, tente refinar com base em outras características
  // Por agora, simplificando e retornando o primeiro
  return candidates[0];
}

/**
 * Lista detalhada das principais resoluções CSS para smartphones modernos
 * Útil para targets de media queries
 */
export const commonCssWidths = {
  iPhoneSmall: 320, // iPhone SE (1a gen), 5, 5S
  iPhoneStandard: 375, // iPhone 6-8, X, 11 Pro, 12 mini, 13 mini
  iPhoneMedium: 390, // iPhone 12, 13, 14
  iPhoneLarge: 414, // iPhone 6-8 Plus, XR, 11
  iPhoneMax: 428, // iPhone 12 Pro Max, 13 Pro Max, 14 Pro Max
  androidStandard: 360, // Maioria dos Android
  androidLarge: 400, // Alguns androids maiores
  androidXL: 412  // Configuração de alguns dispositivos grandes
};

/**
 * Breakpoints padrão para media queries
 */
export const breakpoints = {
  xs: 320,  // Mobile pequeno
  sm: 480,  // Mobile padrão
  md: 768,  // Tablets
  lg: 1024, // Laptops e tablets grandes
  xl: 1280, // Desktops
  xxl: 1536 // Telas grandes
};

/**
 * Determina o tipo de dispositivo atual com base nas dimensões
 */
export function getDeviceType(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}