import { useState, useEffect } from 'react';

/**
 * Hook para detectar media queries
 * Exemplo de uso: const isMobile = useMediaQuery("(max-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verifica se está no browser antes de usar window
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Define o listener para mudanças de tamanho
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}