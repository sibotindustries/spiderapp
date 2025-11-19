import { ReactNode } from 'react';

type GridColumnsTemplate = string;
type GridRowsTemplate = string;
type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type JustifyItems = 'start' | 'end' | 'center' | 'stretch';
type AlignItems = 'start' | 'end' | 'center' | 'stretch';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  
  // Layout padrão
  columns?: GridColumnsTemplate;
  rows?: GridRowsTemplate;
  gap?: GridGap;
  justifyItems?: JustifyItems;
  alignItems?: AlignItems;
  
  // Layout para dispositivos móveis (< 768px)
  mobileColumns?: GridColumnsTemplate;
  mobileRows?: GridRowsTemplate;
  mobileGap?: GridGap;
  
  // Layout para tablets (768px - 1023px)
  tabletColumns?: GridColumnsTemplate;
  tabletRows?: GridRowsTemplate;
  tabletGap?: GridGap;
  
  // Layout específico para dispositivos
  motorolaColumns?: GridColumnsTemplate;
  samsungColumns?: GridColumnsTemplate;
  appleColumns?: GridColumnsTemplate;
  
  // Se deveria ocupar a altura total do container pai
  fullHeight?: boolean;
  
  // Padding específico para dispositivos
  mobilePadding?: string;
  tabletPadding?: string;
  desktopPadding?: string;
  
  // Modelo específico - Moto G73 5G
  motoG73Columns?: GridColumnsTemplate;
  motoG73Gap?: GridGap;
}

const gapMap = {
  none: '0',
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem'
};

/**
 * Componente grid responsivo que adapta seu layout
 * automaticamente com base no tipo de dispositivo
 */
export default function ResponsiveGrid({
  children,
  className = '',
  columns = 'repeat(12, 1fr)',
  rows,
  gap = 'md',
  justifyItems = 'stretch',
  alignItems = 'stretch',
  mobileColumns = 'repeat(4, 1fr)',
  mobileRows,
  mobileGap = 'sm',
  tabletColumns = 'repeat(8, 1fr)',
  tabletRows,
  tabletGap = 'md',
  motorolaColumns,
  samsungColumns,
  appleColumns,
  fullHeight = false,
  mobilePadding = '0.5rem',
  tabletPadding = '1rem',
  desktopPadding = '1.5rem',
  motoG73Columns = 'repeat(4, 1fr)',
  motoG73Gap = 'sm'
}: ResponsiveGridProps) {
  // Estilo base
  const baseStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: columns,
    gridTemplateRows: rows,
    gap: gapMap[gap] || '1rem',
    justifyItems,
    alignItems,
    height: fullHeight ? '100%' : 'auto',
  };
  
  // Ajusta o padding com base no tamanho da tela e dispositivo
  const getPadding = (): string => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (isMobile && mobilePadding) {
      return mobilePadding;
    } else if (isTablet && tabletPadding) {
      return tabletPadding;
    } else if (desktopPadding) {
      return desktopPadding;
    }
    
    return '0';
  };
  
  // Obter configurações específicas do dispositivo
  const getDeviceSpecificColumns = (): GridColumnsTemplate | undefined => {
    const html = document.documentElement;
    
    // Verificar primeiro para modelo específico Moto G73 5G
    if (html.classList.contains('model-moto-g73-5g') && motoG73Columns) {
      return motoG73Columns;
    }
    
    // Verificar por marca
    if (html.classList.contains('brand-motorola') && motorolaColumns) {
      return motorolaColumns;
    } else if (html.classList.contains('brand-samsung') && samsungColumns) {
      return samsungColumns;
    } else if (html.classList.contains('brand-apple') && appleColumns) {
      return appleColumns;
    }
    
    return undefined;
  };
  
  // Construir estilo responsivo
  const getResponsiveStyle = (): React.CSSProperties => {
    const style = { ...baseStyle };
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const deviceColumns = getDeviceSpecificColumns();
    const html = document.documentElement;
    const isMotoG73 = html.classList.contains('model-moto-g73-5g');
    
    // Ajustar padding
    style.padding = getPadding();
    
    // Aplicar estilos responsivos com base no tamanho da tela
    if (isMobile) {
      if (mobileColumns) style.gridTemplateColumns = mobileColumns;
      if (mobileRows) style.gridTemplateRows = mobileRows;
      if (mobileGap) style.gap = gapMap[mobileGap] || '0.5rem';
    } else if (isTablet) {
      if (tabletColumns) style.gridTemplateColumns = tabletColumns;
      if (tabletRows) style.gridTemplateRows = tabletRows;
      if (tabletGap) style.gap = gapMap[tabletGap] || '1rem';
    }
    
    // Sobrescrever com estilo específico do dispositivo se disponível
    if (deviceColumns) {
      style.gridTemplateColumns = deviceColumns;
    }
    
    // Estilos especiais para Moto G73 5G
    if (isMotoG73) {
      if (motoG73Gap) style.gap = gapMap[motoG73Gap] || '0.5rem';
    }
    
    return style;
  };
  
  return (
    <div className={`responsive-grid ${className}`} style={getResponsiveStyle()}>
      {children}
    </div>
  );
}