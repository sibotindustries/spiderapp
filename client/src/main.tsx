import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { applyDeviceStyles } from "./lib/deviceDetection";

// Detectar dispositivo e aplicar estilos específicos
document.addEventListener('DOMContentLoaded', () => {
  const deviceInfo = applyDeviceStyles();
  console.log('SpiderAPP: Dispositivo detectado', deviceInfo);
});

// Atualizar classes ao mudar orientação
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    applyDeviceStyles();
  }, 100);
});

// Verificar mudanças no tamanho da janela (para atualizações durante redimensionamento)
let resizeTimeout: number | null = null;
window.addEventListener('resize', () => {
  if (resizeTimeout) {
    window.clearTimeout(resizeTimeout);
  }
  resizeTimeout = window.setTimeout(() => {
    applyDeviceStyles();
  }, 250);
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster />
  </QueryClientProvider>
);
