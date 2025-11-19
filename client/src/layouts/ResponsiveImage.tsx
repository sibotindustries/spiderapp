import { useEffect, useState } from 'react';

interface ImageSrcSet {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  motoG73?: string;
  samsung?: string;
  xiaomi?: string;
  apple?: string;
}

interface ResponsiveImageProps {
  srcSet: ImageSrcSet;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Componente de imagem responsiva que carrega diferentes versões
 * de uma imagem com base no dispositivo e tamanho da tela
 */
export default function ResponsiveImage({
  srcSet,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  objectFit = 'cover'
}: ResponsiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  
  useEffect(() => {
    const updateImageSource = () => {
      const html = document.documentElement;
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      // Verificar primeiro por modelos específicos
      if (html.classList.contains('model-moto-g73-5g') && srcSet.motoG73) {
        setCurrentSrc(srcSet.motoG73);
        return;
      }
      
      // Verificar em seguida por marcas
      if (html.classList.contains('brand-motorola') && srcSet.motoG73) {
        setCurrentSrc(srcSet.motoG73);
        return;
      } else if (html.classList.contains('brand-samsung') && srcSet.samsung) {
        setCurrentSrc(srcSet.samsung);
        return;
      } else if (html.classList.contains('brand-xiaomi') && srcSet.xiaomi) {
        setCurrentSrc(srcSet.xiaomi);
        return;
      } else if (html.classList.contains('brand-apple') && srcSet.apple) {
        setCurrentSrc(srcSet.apple);
        return;
      }
      
      // Se não houver correspondência específica, usar o tamanho da tela
      if (isMobile && srcSet.mobile) {
        setCurrentSrc(srcSet.mobile);
      } else if (isTablet && srcSet.tablet) {
        setCurrentSrc(srcSet.tablet);
      } else if (srcSet.desktop) {
        setCurrentSrc(srcSet.desktop);
      } else {
        // Fallback para a primeira origem disponível
        const firstAvailableSrc = Object.values(srcSet).find(src => !!src);
        setCurrentSrc(firstAvailableSrc || '');
      }
    };
    
    // Atualizar na montagem e em alterações de tamanho
    updateImageSource();
    
    window.addEventListener('resize', updateImageSource);
    
    return () => {
      window.removeEventListener('resize', updateImageSource);
    };
  }, [srcSet]);
  
  // Estilo para controlar o object-fit
  const imgStyle = {
    objectFit,
    width: width || '100%',
    height: height || 'auto'
  };
  
  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      loading={loading}
      style={imgStyle as React.CSSProperties}
    />
  );
}