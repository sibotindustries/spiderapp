import { ReactNode } from 'react';

type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type Gap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ResponsiveFlexProps {
  children: ReactNode;
  className?: string;
  
  // Layout padrão
  direction?: FlexDirection;
  justify?: JustifyContent;
  align?: AlignItems;
  wrap?: FlexWrap;
  gap?: Gap;
  
  // Layout para dispositivos móveis (< 768px)
  mobileDirection?: FlexDirection;
  mobileJustify?: JustifyContent;
  mobileAlign?: AlignItems;
  mobileWrap?: FlexWrap;
  mobileGap?: Gap;
  
  // Layout para tablets (768px - 1023px)
  tabletDirection?: FlexDirection;
  tabletJustify?: JustifyContent;
  tabletAlign?: AlignItems;
  tabletWrap?: FlexWrap;
  tabletGap?: Gap;
  
  // Layout específico para dispositivos
  motorolaDirection?: FlexDirection;
  samsungDirection?: FlexDirection;
  appleDirection?: FlexDirection;
  
  // Se deveria ocupar a altura total do container pai
  fullHeight?: boolean;
  
  // Padding específico para dispositivos
  mobilePadding?: string;
  tabletPadding?: string;
  desktopPadding?: string;
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
 * Componente flexível responsivo que adapta seu layout
 * automaticamente com base no tipo de dispositivo
 */
export default function ResponsiveFlex({
  children,
  className = '',
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap = 'none',
  mobileDirection,
  mobileJustify,
  mobileAlign,
  mobileWrap,
  mobileGap,
  tabletDirection,
  tabletJustify,
  tabletAlign,
  tabletWrap,
  tabletGap,
  motorolaDirection,
  samsungDirection,
  appleDirection,
  fullHeight = false,
  mobilePadding,
  tabletPadding,
  desktopPadding
}: ResponsiveFlexProps) {
  // Estilo base
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap,
    gap: gapMap[gap] || '0',
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
  
  // Obter o estilo específico do dispositivo
  const getDeviceSpecificDirection = (): FlexDirection | undefined => {
    const html = document.documentElement;
    
    if (html.classList.contains('brand-motorola') && motorolaDirection) {
      return motorolaDirection;
    } else if (html.classList.contains('brand-samsung') && samsungDirection) {
      return samsungDirection;
    } else if (html.classList.contains('brand-apple') && appleDirection) {
      return appleDirection;
    }
    
    return undefined;
  };
  
  // Construir estilo responsivo
  const getResponsiveStyle = (): React.CSSProperties => {
    const style = { ...baseStyle };
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const deviceDirection = getDeviceSpecificDirection();
    
    // Ajustar padding
    style.padding = getPadding();
    
    // Aplicar estilos responsivos com base no tamanho da tela
    if (isMobile) {
      if (mobileDirection) style.flexDirection = mobileDirection;
      if (mobileJustify) style.justifyContent = mobileJustify;
      if (mobileAlign) style.alignItems = mobileAlign;
      if (mobileWrap) style.flexWrap = mobileWrap;
      if (mobileGap) style.gap = gapMap[mobileGap] || '0';
    } else if (isTablet) {
      if (tabletDirection) style.flexDirection = tabletDirection;
      if (tabletJustify) style.justifyContent = tabletJustify;
      if (tabletAlign) style.alignItems = tabletAlign;
      if (tabletWrap) style.flexWrap = tabletWrap;
      if (tabletGap) style.gap = gapMap[tabletGap] || '0';
    }
    
    // Sobrescrever com estilo específico do dispositivo se disponível
    if (deviceDirection) {
      style.flexDirection = deviceDirection;
    }
    
    return style;
  };
  
  return (
    <div className={`responsive-flex ${className}`} style={getResponsiveStyle()}>
      {children}
    </div>
  );
}