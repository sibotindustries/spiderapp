import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  securityLogs, 
  blockedIPs, 
  suspiciousActivities,
  securityChallenges,
  ipReputationData,
  apiAccessLogs,
  users,
} from '@shared/schema';
import { eq, and, sql, desc, asc, gt, count, avg } from 'drizzle-orm';
import { 
  blockIP, 
  unblockIP, 
  logSecurityEvent,
  initSecurityModule,
  generateSecurityToken,
  verifySecurityToken,
} from '../security';

// Middleware para verificar permissões de admin
function requireAdmin(req: Request, res: Response, next: Function) {
  // Temporariamente ignorando verificação de autenticação para fins de teste
  console.log('[security] Solicitação de acesso administrativo, requisição:', req.path);
  console.log('[security] Status de autenticação:', req.isAuthenticated());
  if (req.user) {
    console.log('[security] Usuário:', req.user);
  }
  
  // ATENÇÃO: Temporariamente permitindo todos os acessos para teste
  // Remover esta linha e descomentar as verificações abaixo em produção
  return next();
  
  /*
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
  
  next();
  */
}

// Router para rotas de segurança
export const securityRouter = Router();

// Inicializar módulo de segurança quando o servidor inicia
initSecurityModule().catch(err => {
  console.error('[security-routes] Erro ao inicializar módulo de segurança:', err);
});

// Obter estatísticas de segurança
securityRouter.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Total de IPs bloqueados
    const blockedCount = await db.select({ 
      count: count()
    }).from(blockedIPs);
    
    // Número de bloqueios ativos
    const activeBlocksCount = await db.select({ 
      count: count() 
    }).from(blockedIPs).where(eq(blockedIPs.isActive, true));
    
    // Total de atividades suspeitas
    const suspiciousCount = await db.select({ 
      count: count() 
    }).from(suspiciousActivities);
    
    // Atividades suspeitas nas últimas 24 horas
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const recentSuspiciousCount = await db.select({ 
      count: count() 
    }).from(suspiciousActivities).where(
      gt(suspiciousActivities.timestamp, oneDayAgo)
    );
    
    // Tipos de ataques recentes
    const attackTypes = await db.select({
      type: suspiciousActivities.activityType,
      count: count()
    })
    .from(suspiciousActivities)
    .where(gt(suspiciousActivities.timestamp, oneDayAgo))
    .groupBy(suspiciousActivities.activityType)
    .orderBy(desc(sql`count`))
    .limit(5);
    
    // Distribuição por severidade
    const severityDistribution = await db.select({
      severity: suspiciousActivities.severity,
      count: count()
    })
    .from(suspiciousActivities)
    .groupBy(suspiciousActivities.severity)
    .orderBy(desc(sql`count`));
    
    // Total de logs de segurança
    const logsCount = await db.select({ 
      count: count() 
    }).from(securityLogs);
    
    // Pontuação média de confiança
    const trustScoreResult = await db.select({ 
      average: avg(ipReputationData.trustScore)
    }).from(ipReputationData);
    const trustScoreAverage = Math.round(trustScoreResult[0]?.average || 0);
    
    res.json({
      totalBlocked: blockedCount[0]?.count || 0,
      activeBlocks: activeBlocksCount[0]?.count || 0,
      totalSuspicious: suspiciousCount[0]?.count || 0,
      suspiciousLast24h: recentSuspiciousCount[0]?.count || 0,
      totalLogs: logsCount[0]?.count || 0,
      trustScoreAverage,
      recentAttackTypes: attackTypes,
      severityDistribution,
    });
  } catch (error) {
    console.error('[security-routes] Erro ao obter estatísticas de segurança:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Obter atividades suspeitas
securityRouter.get('/suspicious-activities', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const activities = await db.select()
      .from(suspiciousActivities)
      .orderBy(desc(suspiciousActivities.timestamp))
      .limit(limit)
      .offset(offset);
    
    res.json(activities);
  } catch (error) {
    console.error('[security-routes] Erro ao obter atividades suspeitas:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Obter IPs bloqueados
securityRouter.get('/blocked-ips', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const blocked = await db.select()
      .from(blockedIPs)
      .orderBy(desc(blockedIPs.blockedAt))
      .limit(limit)
      .offset(offset);
    
    res.json(blocked);
  } catch (error) {
    console.error('[security-routes] Erro ao obter IPs bloqueados:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Bloquear um IP
securityRouter.post('/block-ip', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ipAddress, reason, duration } = req.body;
    
    if (!ipAddress || !reason) {
      return res.status(400).json({ message: 'IP e motivo são obrigatórios' });
    }
    
    // Verificar se o IP já está bloqueado
    const existing = await db.select()
      .from(blockedIPs)
      .where(
        and(
          eq(blockedIPs.ipAddress, ipAddress),
          eq(blockedIPs.isActive, true)
        )
      );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Este IP já está bloqueado' });
    }
    
    const success = await blockIP(ipAddress, reason, duration);
    
    if (success) {
      // Adicionar quem bloqueou aos logs
      await logSecurityEvent(ipAddress, 'MANUAL_BLOCK', {
        reason,
        duration,
        blockedBy: req.user?.id,
        userAgent: req.headers['user-agent'],
      });
      
      res.status(200).json({ message: 'IP bloqueado com sucesso' });
    } else {
      res.status(500).json({ message: 'Falha ao bloquear IP' });
    }
  } catch (error) {
    console.error('[security-routes] Erro ao bloquear IP:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Desbloquear um IP
securityRouter.post('/unblock-ip', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'ID do bloqueio é obrigatório' });
    }
    
    // Buscar informações do IP bloqueado
    const [blocked] = await db.select()
      .from(blockedIPs)
      .where(eq(blockedIPs.id, id));
    
    if (!blocked) {
      return res.status(404).json({ message: 'Bloqueio não encontrado' });
    }
    
    if (!blocked.isActive) {
      return res.status(400).json({ message: 'Este IP já está desbloqueado' });
    }
    
    const success = await unblockIP(blocked.ipAddress);
    
    if (success) {
      // Adicionar quem desbloqueou aos logs
      await logSecurityEvent(blocked.ipAddress, 'MANUAL_UNBLOCK', {
        reason: 'Desbloqueio manual pelo administrador',
        unblockedBy: req.user?.id,
        userAgent: req.headers['user-agent'],
      });
      
      res.status(200).json({ message: 'IP desbloqueado com sucesso' });
    } else {
      res.status(500).json({ message: 'Falha ao desbloquear IP' });
    }
  } catch (error) {
    console.error('[security-routes] Erro ao desbloquear IP:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Obter logs de segurança para um IP específico
securityRouter.get('/logs/:ip', requireAdmin, async (req: Request, res: Response) => {
  try {
    const ip = req.params.ip;
    
    const logs = await db.select()
      .from(securityLogs)
      .where(eq(securityLogs.ipAddress, ip))
      .orderBy(desc(securityLogs.timestamp))
      .limit(100);
    
    res.json(logs);
  } catch (error) {
    console.error('[security-routes] Erro ao obter logs de segurança:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Gerar token de segurança para API
securityRouter.post('/generate-token', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { purpose } = req.body;
    
    if (!purpose) {
      return res.status(400).json({ message: 'Propósito do token é obrigatório' });
    }
    
    const token = generateSecurityToken(req.user!.id, purpose);
    
    res.json({ token });
  } catch (error) {
    console.error('[security-routes] Erro ao gerar token de segurança:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Rota de simulação de ataque para teste (SEM AUTENTICAÇÃO - REMOVER EM PRODUÇÃO)
securityRouter.post('/test-simulate-attack', async (req: Request, res: Response) => {
  try {
    console.log('[security] Recebida solicitação de teste para simular ataque:', req.body);
    const { ip, attackType, count } = req.body;
    
    if (!ip || !attackType) {
      console.log('[security] Erro: IP ou tipo de ataque ausente');
      return res.status(400).json({ message: 'IP e tipo de ataque são obrigatórios' });
    }
    
    const attackCount = count || 5; // Padrão: 5 tentativas
    console.log(`[security] Simulando ${attackCount} ataques do tipo ${attackType} para o IP ${ip}`);
    
    // Registrar nos logs quem está simulando o ataque
    await logSecurityEvent(req.ip || '', 'TEST_ATTACK_SIMULATION', {
      simulatedIP: ip,
      attackType,
      count: attackCount,
      simulatedBy: "test-endpoint"
    });
    
    // Simular o ataque
    await simulateAttack(ip, attackType, attackCount);
    
    res.json({ 
      message: `Ataque simulado com sucesso: ${attackCount} tentativas do tipo ${attackType} para o IP ${ip}`,
      status: 'success'
    });
  } catch (error) {
    console.error('[security-routes] Erro ao simular ataque de teste:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Verificar token de segurança
securityRouter.post('/verify-token', async (req: Request, res: Response) => {
  try {
    const { token, purpose } = req.body;
    
    if (!token || !purpose) {
      return res.status(400).json({ message: 'Token e propósito são obrigatórios' });
    }
    
    const { valid, userId } = verifySecurityToken(token, purpose);
    
    if (valid && userId) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin
      })
      .from(users)
      .where(eq(users.id, userId));
      
      res.json({ valid, user });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('[security-routes] Erro ao verificar token de segurança:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Executar migração de esquema de segurança (criação das tabelas)
securityRouter.post('/run-migration', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Esta rota deve ser implementada apenas se você quiser oferecer uma forma
    // programática de criar as tabelas de segurança. Normalmente isso seria feito
    // durante a inicialização do servidor ou por meio de migrations do Drizzle.
    res.status(501).json({ message: 'Não implementado - Use o script de migração do Drizzle' });
  } catch (error) {
    console.error('[security-routes] Erro ao executar migração:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Função para simular ataques (somente para demonstração)
async function simulateAttack(ip: string, attackType: string, count: number = 1): Promise<void> {
  // Tipos de ataque simulados
  const attackDetails: Record<string, any> = {
    'sql-injection': {
      patterns: ['SELECT *', 'UNION SELECT', '1=1'],
      severity: 'HIGH',
      path: '/api/user'
    },
    'xss': {
      patterns: ['<script>', 'javascript:', 'document.cookie'],
      severity: 'MEDIUM',
      path: '/api/comment'
    },
    'brute-force': {
      patterns: [],
      severity: 'MEDIUM',
      path: '/api/auth/login'
    },
    'ddos': {
      patterns: [],
      severity: 'CRITICAL',
      path: '/api'
    }
  };

  const details = attackDetails[attackType] || { patterns: [], severity: 'LOW', path: '/api' };
  
  for (let i = 0; i < count; i++) {
    await logSecurityEvent(
      ip,
      'SUSPICIOUS_PATTERN',
      {
        patterns: details.patterns,
        path: details.path,
        method: 'POST',
        userAgent: 'Hacker-Toolkit/1.0',
        requestId: `simulated-${Date.now()}-${i}`
      }
    );
    
    // Adicionar um pequeno atraso para simular ataques separados
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Endpoint para simular ataques (somente para demonstração)
securityRouter.post('/simulate-attack', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('[security] Recebida solicitação para simular ataque:', req.body);
    const { ip, attackType, count } = req.body;
    
    if (!ip || !attackType) {
      console.log('[security] Erro: IP ou tipo de ataque ausente');
      return res.status(400).json({ message: 'IP e tipo de ataque são obrigatórios' });
    }
    
    const attackCount = count || 5; // Padrão: 5 tentativas
    console.log(`[security] Simulando ${attackCount} ataques do tipo ${attackType} para o IP ${ip}`);
    
    // Registrar nos logs quem está simulando o ataque
    await logSecurityEvent(req.ip || '', 'ATTACK_SIMULATION', {
      simulatedIP: ip,
      attackType,
      count: attackCount,
      simulatedBy: req.user?.id
    });
    
    // Simular o ataque
    await simulateAttack(ip, attackType, attackCount);
    
    res.json({ 
      message: `Ataque simulado com sucesso: ${attackCount} tentativas do tipo ${attackType} para o IP ${ip}`,
      status: 'success'
    });
  } catch (error) {
    console.error('[security-routes] Erro ao simular ataque:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});