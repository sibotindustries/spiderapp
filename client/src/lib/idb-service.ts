/**
 * Serviço para gerenciar o IndexedDB para armazenamento offline
 * Este módulo possibilita o cadastro e consulta de ocorrências mesmo offline,
 * mantendo uma sincronização quando o aplicativo estiver online novamente.
 */

const DB_NAME = 'spiderapp-offline-db';
const DB_VERSION = 1;
const STORES = {
  PENDING_REPORTS: 'pendingReports',
  CACHED_REPORTS: 'cachedReports',
  USER_DATA: 'userData',
};

interface PendingReport {
  id?: number;
  localId: string;
  data: any;
  createdAt: number;
  attempts: number;
}

interface CachedReport {
  id: number;
  data: any;
  updatedAt: number;
}

interface UserData {
  id: string;
  data: any;
  updatedAt: number;
}

// Inicializa e retorna uma conexão com o banco de dados
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador não suporta IndexedDB, funcionalidades offline limitadas.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Erro ao abrir o IndexedDB:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Armazena relatórios pendentes de envio ao servidor
      if (!db.objectStoreNames.contains(STORES.PENDING_REPORTS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_REPORTS, {
          keyPath: 'localId',
          autoIncrement: false,
        });
        pendingStore.createIndex('createdAt', 'createdAt', { unique: false });
        pendingStore.createIndex('attempts', 'attempts', { unique: false });
      }

      // Armazena cópia local dos relatórios já enviados
      if (!db.objectStoreNames.contains(STORES.CACHED_REPORTS)) {
        const cachedStore = db.createObjectStore(STORES.CACHED_REPORTS, {
          keyPath: 'id',
          autoIncrement: false,
        });
        cachedStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Armazena dados do usuário para uso offline
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        const userStore = db.createObjectStore(STORES.USER_DATA, {
          keyPath: 'id',
          autoIncrement: false,
        });
        userStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

// Adiciona um relatório pendente para ser enviado quando houver conexão
export async function addPendingReport(data: any): Promise<string> {
  const db = await openDB();
  const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    
    const pendingReport: PendingReport = {
      localId,
      data,
      createdAt: Date.now(),
      attempts: 0,
    };
    
    const request = store.add(pendingReport);
    
    request.onsuccess = () => {
      // Registrar solicitação de sincronização quando estiver online
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('crime-report-sync')
            .catch((err) => console.error('Falha ao registrar sincronização:', err));
        });
      }
      resolve(localId);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Busca todos os relatórios pendentes de envio
export async function getPendingReports(): Promise<PendingReport[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const request = store.index('createdAt').openCursor();
    
    const reports: PendingReport[] = [];
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        reports.push(cursor.value);
        cursor.continue();
      } else {
        resolve(reports);
      }
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Atualiza o contador de tentativas de um relatório pendente
export async function updatePendingReportAttempts(localId: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const request = store.get(localId);
    
    request.onsuccess = (event) => {
      const report = (event.target as IDBRequest).result as PendingReport;
      if (report) {
        report.attempts += 1;
        store.put(report);
        resolve();
      } else {
        reject(new Error('Relatório não encontrado'));
      }
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Remove um relatório pendente após envio bem-sucedido
export async function removePendingReport(localId: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const request = store.delete(localId);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Armazena dados locais do usuário para acesso offline
export async function saveUserData(id: string, data: any): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.USER_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.USER_DATA);
    
    const userData: UserData = {
      id,
      data,
      updatedAt: Date.now(),
    };
    
    const request = store.put(userData);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Recupera dados do usuário armazenados localmente
export async function getUserData(id: string): Promise<any | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.USER_DATA], 'readonly');
    const store = transaction.objectStore(STORES.USER_DATA);
    const request = store.get(id);
    
    request.onsuccess = (event) => {
      const userData = (event.target as IDBRequest).result as UserData;
      resolve(userData ? userData.data : null);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Limpa todos os dados armazenados
export async function clearAllData(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PENDING_REPORTS, STORES.CACHED_REPORTS, STORES.USER_DATA], 
      'readwrite'
    );
    
    let completed = 0;
    const storeNames = [STORES.PENDING_REPORTS, STORES.CACHED_REPORTS, STORES.USER_DATA];
    
    storeNames.forEach((storeName) => {
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        completed++;
        if (completed === storeNames.length) {
          resolve();
        }
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}