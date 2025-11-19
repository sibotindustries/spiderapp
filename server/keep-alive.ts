/**
 * Sistema de Energia Infinita para Replit
 * Este script mantém o aplicativo sempre online fazendo chamadas periódicas para o healthcheck
 * e implementa um mecanismo de reinício automático para garantir funcionamento contínuo
 */

import { log } from './vite';
import axios from 'axios';
import { exec } from 'child_process';

// Intervalo para verificações de "keep-alive" (em ms)
const KEEP_ALIVE_INTERVAL = 2 * 60 * 1000; // 2 minutos (o Replit suspende após 5 minutos de inatividade)

// Intervalo para verificações agressivas (em ms)
const AGGRESSIVE_CHECK_INTERVAL = 30 * 1000; // 30 segundos quando em modo agressivo

let isFirstRun = true;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3; // Reduzido para ser mais agressivo
let isAggressiveMode = false;

/**
 * Tenta acessar o endpoint de healthcheck para manter o aplicativo ativo
 */
async function pingHealthCheck() {
  try {
    // URLs para pingar (incluindo o próprio Replit e o endpoint de health)
    const healthEndpoint = `http://localhost:5000/api/health`;
    
    // Enviar requisição para o endpoint de healthcheck
    const response = await axios.get(healthEndpoint, { timeout: 5000 });
    
    // Se for bem-sucedido, resetar contador de falhas
    if (response.status === 200) {
      if (isFirstRun) {
        log('Sistema de Energia Infinita para Replit inicializado com sucesso!', 'keep-alive');
        isFirstRun = false;
      } else if (consecutiveFailures > 0) {
        log(`Conexão restabelecida após ${consecutiveFailures} falhas consecutivas`, 'keep-alive');
      } else if (Math.random() < 0.1) { // Logar apenas ocasionalmente para não encher o log
        log(`Sistema operando normalmente: ${response.data.uptime}s de uptime`, 'keep-alive');
      }
      
      consecutiveFailures = 0;
      
      // Se estava em modo agressivo, voltar ao normal
      if (isAggressiveMode) {
        isAggressiveMode = false;
        log('Voltando ao modo normal de monitoramento', 'keep-alive');
      }
    }
  } catch (error) {
    consecutiveFailures++;
    
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      log(`ALERTA: ${consecutiveFailures} falhas consecutivas ao verificar healthcheck`, 'keep-alive');
      
      // Entrar em modo agressivo de monitoramento
      if (!isAggressiveMode) {
        isAggressiveMode = true;
        log('Entrando em modo agressivo de monitoramento', 'keep-alive');
      }
      
      // Se falhas persistirem no modo agressivo, tentar forçar reinício
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES * 2) {
        log('Falhas persistem no modo agressivo. Forçando reinício programado...', 'keep-alive');
        forceRestart();
      }
    } else {
      log(`Falha ao acessar healthcheck: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'keep-alive');
    }
  } finally {
    // Agendar próxima execução com intervalo apropriado ao modo atual
    const interval = isAggressiveMode ? AGGRESSIVE_CHECK_INTERVAL : KEEP_ALIVE_INTERVAL;
    setTimeout(pingHealthCheck, interval);
  }
}

/**
 * Força o reinício do servidor programaticamente
 */
function forceRestart() {
  log('Executando procedimento de reinício forçado...', 'keep-alive');
  
  // Registrar dados vitais antes de reiniciar
  const memory = process.memoryUsage();
  log(`Memória antes do reinício: ${Math.round(memory.rss / 1024 / 1024)}MB | Uptime: ${Math.round(process.uptime() / 60)} minutos`, 'keep-alive');
  
  // Técnica 1: Enviar SIGTERM para o processo atual, confiando que o mecanismo de reinício do index.ts será acionado
  try {
    process.kill(process.pid, 'SIGTERM');
  } catch (error) {
    log(`Falha ao enviar SIGTERM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'keep-alive');
  }
  
  // Técnica 2: Se ainda estamos rodando após 1 segundo, tentar encerrar o processo de forma mais agressiva
  setTimeout(() => {
    log('Aplicando método de reinício secundário...', 'keep-alive');
    process.exit(1); // Forçar encerramento com código de erro
  }, 1000);
}

// Iniciar o sistema de keep-alive após um pequeno atraso para garantir que o servidor esteja pronto
log('Inicializando Sistema de Energia Infinita para Replit com proteção adicional...', 'keep-alive');
setTimeout(pingHealthCheck, 10000);

// Logs para confirmar que o sistema está funcionando e monitorar recursos
setInterval(() => {
  const memory = process.memoryUsage();
  log(`Status do Replit: Memória: ${Math.round(memory.rss / 1024 / 1024)}MB | Uptime: ${Math.round(process.uptime() / 60)} minutos`, 'keep-alive');
  
  // Reinício programado a cada 6 horas independente de falhas para manter o sistema fresco
  if (process.uptime() > 6 * 60 * 60) { // 6 horas
    log('Acionando reinício programado por tempo de execução...', 'keep-alive');
    setTimeout(() => forceRestart(), 5000); // Aguardar 5 segundos para registros finalizarem
  }
}, 15 * 60 * 1000); // A cada 15 minutos

// Exportar função mais útil que pode ser chamada externamente
export function keepAliveSystem() {
  log('Sistema de Energia Infinita para Replit ativado externamente', 'keep-alive');
  // Função real que pode ser chamada para forçar um reinício imediato
  return {
    forceRestart
  };
}