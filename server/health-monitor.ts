/**
 * Sistema de Fonte de Energia Infinita
 * Este módulo monitora a saúde do servidor, tentando reconectar
 * automaticamente em caso de falhas.
 */

import { log } from './vite';
import { Server } from 'http';

// Intervalo para verificações de saúde (em ms)
const HEALTH_CHECK_INTERVAL = 30000; // 30 segundos

// Tentativas máximas para reconexão
const MAX_RECONNECT_ATTEMPTS = 10;

// Intervalo para tentativas de reconexão (em ms)
const RECONNECT_INTERVAL = 5000; // 5 segundos

export class HealthMonitor {
  private server: Server;
  private isServerRunning = true;
  private reconnectAttempts = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.server = server;
    log('Sistema de Fonte de Energia Infinita iniciado', 'health-monitor');
  }

  /**
   * Inicia o sistema de monitoramento de saúde
   */
  start(): void {
    // Monitorar eventos do servidor
    this.monitorServerEvents();

    // Iniciar verificações periódicas de saúde
    this.startHealthChecks();

    // Adicionar manipuladores para sinais do sistema operacional
    this.setupProcessSignals();

    log('Monitoramento contínuo ativado - aplicação protegida', 'health-monitor');
  }

  /**
   * Configura o monitoramento de eventos do servidor
   */
  private monitorServerEvents(): void {
    this.server.on('error', (error) => {
      log(`Erro no servidor: ${error.message}`, 'health-monitor');
      this.isServerRunning = false;
      this.attemptServerRestart();
    });

    this.server.on('close', () => {
      log('Servidor fechado', 'health-monitor');
      this.isServerRunning = false;
      this.attemptServerRestart();
    });
  }

  /**
   * Inicia verificações periódicas de saúde
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      // Verificar saúde do servidor
      if (!this.isServerRunning) {
        log('Servidor detectado como inativo', 'health-monitor');
        this.attemptServerRestart();
      }

      // Registrar status atual do sistema
      this.logSystemStatus();

    }, HEALTH_CHECK_INTERVAL);
  }

  /**
   * Tenta reiniciar o servidor quando ele está inativo
   */
  private attemptServerRestart(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      log(`Atingido número máximo de tentativas (${MAX_RECONNECT_ATTEMPTS}). Solicitando reinício manual.`, 'health-monitor');
      return;
    }

    this.reconnectAttempts++;
    
    log(`Tentativa ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} de reiniciar o servidor...`, 'health-monitor');
    
    // Aguardar um pouco antes de tentar reiniciar
    setTimeout(() => {
      if (!this.isServerRunning) {
        try {
          // Se o servidor não estiver ouvindo em nenhuma porta, reiniciar
          if (!this.server.listening) {
            this.server.listen({
              port: 5000,
              host: "0.0.0.0",
              reusePort: true,
            }, () => {
              log('Servidor reiniciado com sucesso', 'health-monitor');
              this.isServerRunning = true;
              this.reconnectAttempts = 0;
            });
          } else {
            log('Servidor já está escutando em uma porta', 'health-monitor');
            this.isServerRunning = true;
            this.reconnectAttempts = 0;
          }
        } catch (error) {
          log(`Falha ao reiniciar o servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'health-monitor');
        }
      }
    }, RECONNECT_INTERVAL);
  }

  /**
   * Registra o status atual do sistema
   */
  private logSystemStatus(): void {
    const serverStatus = this.isServerRunning ? 'ONLINE' : 'OFFLINE';
    
    // Log apenas quando há mudanças de estado ou a cada 10 minutos
    if (!this.isServerRunning || Math.random() < 0.05) {
      log(`Status do Sistema: Servidor: ${serverStatus}`, 'health-monitor');
    }
  }

  /**
   * Configura manipuladores para sinais do sistema operacional
   */
  private setupProcessSignals(): void {
    // Manipulador para SIGTERM
    process.on('SIGTERM', () => {
      log('Sinal SIGTERM recebido. Desligando graciosamente...', 'health-monitor');
      this.stop();
      // Dar tempo para operações em andamento terminarem antes de encerrar
      setTimeout(() => process.exit(0), 1000);
    });

    // Manipulador para SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      log('Sinal SIGINT recebido. Desligando graciosamente...', 'health-monitor');
      this.stop();
      // Dar tempo para operações em andamento terminarem antes de encerrar
      setTimeout(() => process.exit(0), 1000);
    });

    // Manipulador para exceções não tratadas
    process.on('uncaughtException', (error) => {
      log(`Exceção não tratada: ${error.message}`, 'health-monitor');
      log('Continuando execução para manter o serviço ativo...', 'health-monitor');
    });

    // Manipulador para promessas rejeitadas não tratadas
    process.on('unhandledRejection', (reason) => {
      log(`Rejeição de promessa não tratada: ${reason instanceof Error ? reason.message : String(reason)}`, 'health-monitor');
      log('Continuando execução para manter o serviço ativo...', 'health-monitor');
    });
  }

  /**
   * Para o monitoramento de saúde
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    log('Sistema de Fonte de Energia Infinita desativado', 'health-monitor');
  }
}

// Função para criar e iniciar o monitor de saúde
export function createHealthMonitor(server: Server): HealthMonitor {
  const monitor = new HealthMonitor(server);
  monitor.start();
  return monitor;
}