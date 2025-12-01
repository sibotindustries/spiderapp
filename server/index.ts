import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createHealthMonitor } from "./health-monitor";
import { keepAliveSystem } from "./keep-alive";
import { streamText } from "ai";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Adicionando rota de healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Rota especial para reinício programado (protegida por chave simples)
app.get("/api/restart/:key", (req, res) => {
  const restartKey = "spiderman-super-loop"; // Chave simples para proteção básica

  if (req.params.key === restartKey) {
    log("Solicitação de reinício remoto recebida com chave válida", "restart-api");
    res.json({ status: "restarting", message: "Servidor será reiniciado em 5 segundos" });

    // Aguardar 5 segundos e então reiniciar
    setTimeout(() => {
      log("Executando reinício programado remoto", "restart-api");
      const keepAlive = keepAliveSystem();
      keepAlive.forceRestart();
    }, 5000);
  } else {
    log(`Tentativa de reinício com chave inválida: ${req.params.key}`, "restart-api");
    res.status(403).json({ status: "error", message: "Chave de reinício inválida" });
  }
});

// Nova rota para atender à funcionalidade de IA
app.post("/api/chat", async (req, res) => {
  try {
    // Obter dados que são monitorados e usados como referência no contexto
    const spiderManArrivalData = await getSpiderManData();

    // Formatar contexto com os dados coletados
    const prompt = `
      Dados disponíveis sobre o Spider-Man:
      - Status de chegada: ${spiderManArrivalData.arrivalStatus}
      - Localização atual: ${spiderManArrivalData.currentLocation || "Desconhecida"}
      - Tempo estimado de chegada: ${spiderManArrivalData.estimatedArrival || "Sem previsão"}

      Pergunta: ${req.body.question}
    `;

    // Chamar o streamText para obter uma resposta baseada no contexto
    const result = await streamText({
      model: "perplexity/sonar",
      prompt,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao processar a entrada de IA",
      error: error.message,
    });
  }
});

// Função simulada para obter dados do Spider-Man
async function getSpiderManData() {
  // Exemplo de dados simulados; substituir pela lógica real
  return {
    arrivalStatus: "Chegou",
    currentLocation: "Nova York",
    estimatedArrival: "2025-11-21T15:00:00Z",
  };
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Variável para controlar se o servidor já está iniciando
let isServerStarting = false;
let currentServer: any = null;

// Reiniciar o servidor se ele falhar, loop infinito garantido
const startServer = async () => {
  // Prevenir múltiplas inicializações simultâneas
  if (isServerStarting) {
    log("Servidor já está sendo inicializado, ignorando nova tentativa...", "server");
    return;
  }

  isServerStarting = true;

  try {
    log("Iniciando servidor com sistema de fonte de energia infinita...", "server");

    // Se já existe um servidor rodando, fechar primeiro
    if (currentServer) {
      log("Fechando servidor anterior antes de reiniciar...", "server");
      await new Promise<void>((resolve) => {
        currentServer.close(() => {
          log("Servidor anterior fechado com sucesso", "server");
          currentServer = null;
          resolve();
        });
        // Timeout para forçar fechamento após 5 segundos
        setTimeout(() => {
          currentServer = null;
          resolve();
        }, 5000);
      });
      // Aguardar um pouco para garantir que as portas foram liberadas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const server = await registerRoutes(app);
    currentServer = server;

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });

      // Não propagar o erro para não derrubar o servidor
      log(`Erro capturado: ${err.message || "Erro desconhecido"}`, "error-handler");
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Servidor ativo na porta ${port}`, "server");
      isServerStarting = false;

      // Iniciar o sistema de monitoramento de saúde (fonte de energia infinita)
      const healthMonitor = createHealthMonitor(server);

      // Configurar encerramento programado para reinício automático em loop
      setTimeout(() => {
        log("Reinício programado do servidor para manutenção da energia infinita...", "server");
        isServerStarting = false;
        server.close(() => {
          log("Servidor encerrado programadamente, reiniciando em 3 segundos...", "server");
          currentServer = null;
          setTimeout(startServer, 3000);
        });
      }, 12 * 60 * 60 * 1000); // Reiniciar a cada 12 horas para garantir frescor
    });

    // Tratar erros ao escutar na porta
    server.on('error', (err: any) => {
      log(`Erro no servidor: ${err.message}`, "server");
      isServerStarting = false;
      currentServer = null;

      if (err.code === 'EADDRINUSE') {
        log("Porta já em uso, aguardando 10 segundos antes de tentar novamente...", "server");
        setTimeout(startServer, 10000);
      } else {
        setTimeout(startServer, 5000);
      }
    });

    return server;
  } catch (error: any) {
    log(`Erro ao iniciar o servidor: ${error instanceof Error ? error.message : "Erro desconhecido"}`, "server");
    isServerStarting = false;
    currentServer = null;

    // Tentar reiniciar o servidor após um atraso
    log("Tentando reiniciar o servidor automaticamente em 10 segundos...", "server");
    setTimeout(startServer, 10000);
  }
};

// Configurar handler de encerramento limpo
process.on('SIGTERM', () => {
  log("Recebido SIGTERM, encerrando servidor graciosamente...", "server");
  if (currentServer) {
    currentServer.close(() => {
      log("Servidor encerrado, processo finalizado", "server");
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  log("Recebido SIGINT, encerrando servidor graciosamente...", "server");
  if (currentServer) {
    currentServer.close(() => {
      log("Servidor encerrado, processo finalizado", "server");
      process.exit(0);
    });
  }
});

// Iniciar o servidor com mecanismo de recuperação automática
startServer();