import { useState, useEffect, useCallback } from 'react';
import * as idbService from '@/lib/idb-service';
import { useToast } from '@/hooks/use-toast';

export interface OfflineStorageOptions {
  /**
   * Tenta sincronizar automaticamente ao recuperar conexão
   */
  autoSync?: boolean;
  
  /**
   * Exibe notificações sobre status de sincronização
   */
  showNotifications?: boolean;
}

const defaultOptions: OfflineStorageOptions = {
  autoSync: true,
  showNotifications: true,
};

/**
 * Hook para gerenciar armazenamento offline e sincronização de dados
 */
export function useOfflineStorage(options = defaultOptions) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const { toast } = useToast();
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Atualiza o estado de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Conexão restaurada",
          description: "Você está online novamente.",
          duration: 3000,
        });
      }
      
      // Auto-sincronizar quando ficar online
      if (mergedOptions.autoSync) {
        syncPendingReports();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Sem conexão",
          description: "Você está offline. Seus dados serão salvos localmente.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verifica se há relatórios pendentes ao montar
    updatePendingCount();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Monitora mensagens do Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          setIsSyncing(false);
          updatePendingCount();
          
          if (mergedOptions.showNotifications) {
            const results = event.data.results || [];
            const successCount = results.filter((r: any) => r.success).length;
            const failCount = results.length - successCount;
            
            toast({
              title: "Sincronização concluída",
              description: `${successCount} relatórios enviados com sucesso. ${failCount} relatórios ainda pendentes.`,
              duration: 5000,
            });
          }
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);
  
  // Atualiza a contagem de relatórios pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const pendingReports = await idbService.getPendingReports();
      setPendingCount(pendingReports.length);
    } catch (error) {
      console.error('Erro ao verificar relatórios pendentes:', error);
    }
  }, []);
  
  // Salva um relatório localmente
  const saveReportOffline = useCallback(async (reportData: any) => {
    try {
      const localId = await idbService.addPendingReport(reportData);
      
      updatePendingCount();
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Relatório salvo localmente",
          description: isOnline 
            ? "Será sincronizado em breve."
            : "Será enviado quando você estiver online.",
          duration: 3000,
        });
      }
      
      return { success: true, localId };
    } catch (error) {
      console.error('Erro ao salvar relatório offline:', error);
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Erro ao salvar localmente",
          description: "Não foi possível armazenar o relatório offline.",
          variant: "destructive",
        });
      }
      
      return { success: false, error };
    }
  }, [isOnline, mergedOptions.showNotifications]);
  
  // Sincroniza todos os relatórios pendentes
  const syncPendingReports = useCallback(async () => {
    if (!isOnline || isSyncing) return { success: false, reason: 'offline-or-syncing' };
    
    try {
      setIsSyncing(true);
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Sincronizando dados",
          description: "Enviando relatórios pendentes...",
          duration: 3000,
        });
      }
      
      // Solicita sincronização via Service Worker
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        await navigator.serviceWorker.ready;
        await navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('crime-report-sync');
        });
        
        return { success: true };
      } else {
        // Se não houver suporte a Background Sync, faz a sincronização manualmente
        const pendingReports = await idbService.getPendingReports();
        
        // Implementar código de envio manual aqui quando necessário
        
        setIsSyncing(false);
        updatePendingCount();
        
        return { success: true, manualSync: true };
      }
    } catch (error) {
      console.error('Erro ao sincronizar relatórios:', error);
      setIsSyncing(false);
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Erro de sincronização",
          description: "Não foi possível sincronizar seus dados.",
          variant: "destructive",
        });
      }
      
      return { success: false, error };
    }
  }, [isOnline, isSyncing, mergedOptions.showNotifications]);
  
  // Salva dados do usuário para uso offline
  const saveUserDataOffline = useCallback(async (userId: string, userData: any) => {
    try {
      await idbService.saveUserData(userId, userData);
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar dados do usuário offline:', error);
      return { success: false, error };
    }
  }, []);
  
  // Recupera dados do usuário armazenados offline
  const getUserDataOffline = useCallback(async (userId: string) => {
    try {
      const userData = await idbService.getUserData(userId);
      return { success: true, data: userData };
    } catch (error) {
      console.error('Erro ao recuperar dados do usuário offline:', error);
      return { success: false, error };
    }
  }, []);
  
  // Limpa todos os dados offline
  const clearOfflineData = useCallback(async () => {
    try {
      await idbService.clearAllData();
      updatePendingCount();
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Dados offline apagados",
          description: "Todos os dados armazenados localmente foram removidos.",
          duration: 3000,
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao limpar dados offline:', error);
      
      if (mergedOptions.showNotifications) {
        toast({
          title: "Erro ao limpar dados",
          description: "Não foi possível remover os dados offline.",
          variant: "destructive",
        });
      }
      
      return { success: false, error };
    }
  }, [mergedOptions.showNotifications]);
  
  return {
    isOnline,
    isSyncing,
    pendingCount,
    saveReportOffline,
    syncPendingReports,
    saveUserDataOffline,
    getUserDataOffline,
    clearOfflineData,
  };
}