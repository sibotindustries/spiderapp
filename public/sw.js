// Nome do cache
const CACHE_NAME = 'spiderapp-v1';

// Arquivos a serem cacheados inicialmente
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/Spider-APP.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/maskable-icon.png',
  '/assets/icon.svg',
  '/assets/screenshots/home-dark.png',
  '/assets/screenshots/report-dark.png',
  '/assets/shortcuts/report.png',
  '/assets/shortcuts/my-reports.png',
  '/offline.html'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: network first, fallback para cache
self.addEventListener('fetch', (event) => {
  // Não interceptar requisições para a API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona a resposta
        const responseClone = response.clone();
        
        // Abre o cache e adiciona a nova resposta
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });
        
        return response;
      })
      .catch(() => {
        // Se falhar, tenta buscar do cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Se não encontrar no cache e for uma página HTML, 
            // retorna a página offline
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // Para outros tipos de arquivos que não estão no cache
            return new Response('Recurso não disponível offline', {
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Tratamento de mensagens
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Eventos de sincronização em segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'crime-report-sync') {
    event.waitUntil(syncCrimeReports());
  }
});

// Função para sincronizar relatórios de crimes enviados offline
async function syncCrimeReports() {
  try {
    // Buscar relatórios pendentes do IndexedDB
    const pendingReports = await getPendingReports();
    
    // Tentar enviar cada relatório pendente
    const sendPromises = pendingReports.map(async (report) => {
      try {
        const response = await fetch('/api/crimes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        });
        
        if (response.ok) {
          // Se o envio for bem-sucedido, remover da lista de pendentes
          await removePendingReport(report.id);
          return { success: true, report };
        }
        
        return { success: false, report };
      } catch (error) {
        return { success: false, report, error };
      }
    });
    
    // Aguardar todas as tentativas de envio
    const results = await Promise.all(sendPromises);
    
    // Notificar os clientes sobre os resultados
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        results
      });
    });
    
    return results;
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return null;
  }
}

// Funções fictícias para IndexedDB - implementação real exigiria mais código
async function getPendingReports() {
  // Aqui teríamos o código para buscar relatórios de crimes pendentes do IndexedDB
  return [];
}

async function removePendingReport(id) {
  // Aqui teríamos o código para remover um relatório pendente do IndexedDB
  console.log(`Removendo relatório pendente: ${id}`);
}