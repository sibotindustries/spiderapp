/**
 * Componente que bloqueia o zoom do usuário em dispositivos móveis
 * Versão atualizada para permitir cliques normais
 */
import { useEffect } from 'react';

/**
 * Impede o zoom em dispositivos móveis, mas mantém funcionalidade de clique:
 * 1. Monitoramento seletivo de eventos de toque para permitir interação normal
 * 2. Monitoramento de eventos de scroll/wheel apenas para gestos de zoom
 * 3. Meta viewport atualizado para controle principal
 */
export default function LockZoom() {
  useEffect(() => {
    // APENAS impede zoom com gestos de pinch-zoom
    // Deixa cliques individuais funcionarem normalmente
    function preventZoom(e: TouchEvent) {
      // Apenas prevenir quando for multi-touch (pinch)
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }

    // Impedir zoom com tecla Ctrl + scroll
    function preventWheelZoom(e: WheelEvent) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    }

    // Atualizar meta viewport
    const updateViewport = () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    };

    // Aplicar meta tag atualizada
    updateViewport();

    // Adicionando listeners de forma seletiva para não afetar cliques normais
    document.addEventListener('wheel', preventWheelZoom, { passive: false });
    
    // Usar touchmove (não touchstart) para não afetar cliques
    document.addEventListener('touchmove', preventZoom, { passive: false });

    // Remover eventos ao desmontar
    return () => {
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('wheel', preventWheelZoom);
    };
  }, []);

  return null; // Este componente não renderiza nada
}