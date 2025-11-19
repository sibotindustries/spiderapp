import { useState, useCallback } from "react";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const toast = useCallback(
    ({ title, description, variant = "default", duration = 5000 }: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
      
      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}

// Componente de Toasts será criado na interface posteriormente
// Este hook é apenas para gerenciar o estado das notificações