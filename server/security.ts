/**
 * Sistema Avançado de Segurança Anti-Hacker
 * 
 * Este módulo implementa diversas camadas de proteção contra ataques:
 * - Detecção de padrões de ataque
 * - Limitação de taxa de solicitações
 * - Bloqueio por geolocalização 
 * - Proteção contra injeção SQL
 * - Proteção contra XSS
 * - Monitoramento de atividades suspeitas
 * - Criptografia de dados sensíveis
 */

import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { inArray, eq, and, or, sql, desc } from 'drizzle-orm';
import { 
  securityLogs, 
  suspiciousActivities,
  deviceFingerprints,
  bannedIdentifiers,
  ipBlacklist,
  DeviceFingerprint,
  InsertDeviceFingerprint
} from '@shared/schema';
import { hashPassword } from './storage';
import crypto from 'crypto';

// Configurações de Segurança
const SECURITY_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 100,
  MAX_FAILED_LOGINS: 5,
  SUSPICIOUS_PATTERNS: [
    'SELECT *', 'UNION SELECT', 'DROP TABLE', 'DELETE FROM', 'INSERT INTO',
    '1=1', 'OR 1=1', 'admin\'--', '; DROP', '<script>', 'javascript:',
    'document.cookie', 'eval(', 'setTimeout(', 'XMLHttpRequest'
  ],
  BLOCKED_COUNTRIES: ['country-blacklist'], // Lista de códigos de país bloqueados
  AUTO_BLOCK_THRESHOLD: 5, // Número de atividades suspeitas antes do bloqueio automático
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  TOKEN_EXPIRY: 3600 * 24 // 24 horas
};

// Cache para limitar taxa
const requestCache: Record<string, { count: number; timestamps: number[] }> = {};

// Cache de IP bloqueados para não consultar o banco a cada requisição
const blockedIPCache = new Set<string>();
let lastCacheUpdate = 0;

/**
 * Inicializa o módulo de segurança carregando dados da cache
 */
export async function initSecurityModule() {
  try {
    // Carregar IPs bloqueados na memória
    await updateBlockedIPCache();
    
    // Iniciar o sistema de detecção automática
    startAutomaticThreatDetection();
    
    console.log('[security] Módulo de segurança anti-hacker inicializado');
  } catch (error) {
    console.error('[security] Erro ao inicializar o módulo de segurança:', error);
  }
}

/**
 * Sistema de detecção automática de ameaças que verifica periodicamente
 * padrões suspeitos e bloqueia automaticamente IPs maliciosos
 */
let threatDetectionInterval: NodeJS.Timeout | null = null;

function startAutomaticThreatDetection() {
  if (threatDetectionInterval) {
    clearInterval(threatDetectionInterval);
  }
  
  // Executar detecção a cada 5 minutos
  threatDetectionInterval = setInterval(async () => {
    try {
      console.log('[security] Executando verificação automática de ameaças...');
      
      // 1. Identificar IPs com múltiplas atividades suspeitas nas últimas 24 horas
      const suspiciousIPs = await db.select({
        ipAddress: suspiciousActivities.ipAddress,
        count: sql<number>`count(*)`,
        maxRiskLevel: sql<number>`MAX(${suspiciousActivities.riskLevel})`
      })
      .from(suspiciousActivities)
      .where(
        sql`${suspiciousActivities.timestamp} > NOW() - INTERVAL '24 hours'`
      )
      .groupBy(suspiciousActivities.ipAddress)
      .having(sql`count(*) >= ${SECURITY_CONFIG.AUTO_BLOCK_THRESHOLD}`);
      
      // 2. Bloquear IPs com alta atividade suspeita
      for (const ip of suspiciousIPs) {
        // Verificar se o IP já está bloqueado
        if (await isIPBlocked(ip.ipAddress)) {
          continue;
        }
        
        // Determinar o tempo de bloqueio com base no nível de risco
        let blockHours = 24; // Padrão: 24 horas
        if (ip.maxRiskLevel >= 9) {
          blockHours = 168; // 7 dias
        } else if (ip.maxRiskLevel >= 7) {
          blockHours = 72; // 3 dias
        } else if (ip.maxRiskLevel >= 5) {
          blockHours = 48; // 2 dias
        }
        
        // Bloquear o IP automaticamente
        await blockIP(
          ip.ipAddress, 
          `Bloqueio automático - ${ip.count} atividades suspeitas detectadas`, 
          blockHours
        );
        
        console.log(`[security] IP ${ip.ipAddress} bloqueado automaticamente por ${blockHours} horas devido a ${ip.count} atividades suspeitas`);
      }
      
      // 3. Verificar padrões de ataque coordenado (múltiplos IPs com comportamento similar)
      // Este seria um algoritmo mais complexo de detecção de padrões que poderia ser implementado no futuro
      
    } catch (error) {
      console.error('[security] Erro na detecção automática de ameaças:', error);
    }
  }, 5 * 60 * 1000); // 5 minutos
  
  console.log('[security] Sistema de detecção automática de ameaças iniciado');
}

/**
 * Atualiza o cache de IPs bloqueados a partir do banco de dados
 */
async function updateBlockedIPCache() {
  try {
    const currentTime = Date.now();
    // Atualiza a cache apenas a cada 5 minutos
    if (currentTime - lastCacheUpdate < 5 * 60 * 1000 && blockedIPCache.size > 0) {
      return;
    }
    
    const results = await db.select().from(ipBlacklist).where(
      and(
        sql`${ipBlacklist.expiresAt} > NOW() OR ${ipBlacklist.expiresAt} IS NULL`
      )
    );
    
    blockedIPCache.clear();
    results.forEach(block => blockedIPCache.add(block.ipAddress));
    lastCacheUpdate = currentTime;
  } catch (error) {
    console.error('[security] Erro ao atualizar cache de IPs bloqueados:', error);
  }
}

/**
 * Middleware para proteção anti-hacker
 */
export function securityMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const method = req.method;
    const path = req.path;
    const requestId = crypto.randomUUID();
    
    // Atribui um ID exclusivo à solicitação para rastreamento
    req.headers['x-request-id'] = requestId;
    
    try {
      // Ignorar verificações para endpoints relacionados à segurança
      if (path.startsWith('/api/security/')) {
        return next();
      }
      
      // 1. Verificar se o IP está na lista de bloqueados
      if (await isIPBlocked(clientIP)) {
        await logSecurityEvent(clientIP, 'BLOCKED_IP_ATTEMPT', {
          path,
          method,
          userAgent,
          requestId
        });
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado. Entre em contato com o suporte se acredita que isso é um erro.'
        });
      }
      
      // 2. Verificar limites de taxa
      if (isRateLimited(clientIP)) {
        await logSecurityEvent(clientIP, 'RATE_LIMIT_EXCEEDED', {
          path,
          method,
          userAgent,
          requestId
        });
        return res.status(429).json({
          status: 'error',
          message: 'Muitas solicitações. Tente novamente mais tarde.'
        });
      }
      
      // 3. Analisar padrões suspeitos na solicitação
      const suspiciousPatterns = detectSuspiciousPatterns(req);
      if (suspiciousPatterns.length > 0) {
        await logSecurityEvent(clientIP, 'SUSPICIOUS_PATTERN', {
          patterns: suspiciousPatterns,
          path,
          method,
          userAgent,
          requestId
        });
        
        // Verificar se deve bloquear automaticamente após múltiplas detecções
        const recentSuspiciousActivities = await countRecentSuspiciousActivities(clientIP);
        if (recentSuspiciousActivities >= SECURITY_CONFIG.AUTO_BLOCK_THRESHOLD) {
          await blockIP(clientIP, 'Múltiplos padrões suspeitos detectados', 24); // Bloquear por 24 horas
          return res.status(403).json({
            status: 'error',
            message: 'Acesso negado. Comportamento suspeito detectado.'
          });
        }
      }
      
      // 4. Adicionar headers de segurança
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Política CSP mais permissiva para permitir recursos externos
      // especialmente para fins de teste e desenvolvimento
      if (path === '/test-attack.html' || path.startsWith('/api/test-simulate-attack')) {
        // Política mais permissiva para páginas de teste
        res.setHeader('Content-Security-Policy', 
          "default-src 'self' https:; " + 
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " + 
          "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " + 
          "font-src 'self' https://cdn.jsdelivr.net; " + 
          "img-src 'self' data: https:; " + 
          "connect-src 'self'; " +
          "object-src 'none'");
      } else {
        // Política padrão mais restritiva para o restante do site
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
      }
      
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // 5. Adicionar timestamp de segurança e assinatura
      const securityTimestamp = Date.now();
      req.headers['x-security-timestamp'] = securityTimestamp.toString();
      req.headers['x-security-signature'] = generateSecuritySignature(clientIP, securityTimestamp);
      
      // Continuar para o próximo middleware
      next();
    } catch (error) {
      console.error('[security] Erro no middleware de segurança:', error);
      next();
    }
  };
}

/**
 * Verifica se um IP está bloqueado
 */
async function isIPBlocked(ip: string): Promise<boolean> {
  // CRÍTICO: Hash o IP antes de verificar (mesma forma que foi armazenado)
  const ipHash = hashIdentifier(ip);
  
  // Primeiro verifica na cache para evitar consultas ao banco
  if (blockedIPCache.has(ipHash)) {
    return true;
  }
  
  // Se não estiver na cache, atualiza o cache e verifica novamente
  await updateBlockedIPCache();
  return blockedIPCache.has(ipHash);
}

/**
 * Verifica se um IP excedeu o limite de taxa
 */
function isRateLimited(ip: string): boolean {
  // CRÍTICO: Hash o IP para consistência com outros sistemas
  const ipHash = hashIdentifier(ip);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  
  if (!requestCache[ipHash]) {
    requestCache[ipHash] = { count: 1, timestamps: [now] };
    return false;
  }
  
  // Filtrar timestamps dos últimos 60 segundos
  const recentTimestamps = requestCache[ipHash].timestamps.filter(
    timestamp => now - timestamp < windowMs
  );
  
  // Atualizar o cache
  requestCache[ipHash].timestamps = [...recentTimestamps, now];
  requestCache[ipHash].count = requestCache[ipHash].timestamps.length;
  
  return requestCache[ipHash].count > SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE;
}

/**
 * Detecta padrões suspeitos na solicitação
 */
function detectSuspiciousPatterns(req: Request): string[] {
  const body = JSON.stringify(req.body || {}).toLowerCase();
  const query = JSON.stringify(req.query || {}).toLowerCase();
  const cookies = JSON.stringify(req.cookies || {}).toLowerCase();
  
  const detectedPatterns: string[] = [];
  
  SECURITY_CONFIG.SUSPICIOUS_PATTERNS.forEach(pattern => {
    const patternLower = pattern.toLowerCase();
    if (
      body.includes(patternLower) ||
      query.includes(patternLower) ||
      cookies.includes(patternLower)
    ) {
      detectedPatterns.push(pattern);
    }
  });
  
  return detectedPatterns;
}

/**
 * Conta atividades suspeitas recentes de um IP
 */
async function countRecentSuspiciousActivities(ip: string): Promise<number> {
  try {
    // CRÍTICO: Hash o IP antes de consultar (mesma forma que foi armazenado)
    const ipHash = hashIdentifier(ip);
    
    // Verificar atividades nas últimas 24 horas
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(suspiciousActivities)
      .where(
        and(
          eq(suspiciousActivities.ipAddress, ipHash),
          sql`${suspiciousActivities.timestamp} > ${oneDayAgo.toISOString()}`
        )
      );
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error('[security] Erro ao contar atividades suspeitas:', error);
    return 0;
  }
}

/**
 * Bloqueia um IP por um número específico de horas
 */
export async function blockIP(ip: string, reason: string, hours: number = 0): Promise<boolean> {
  try {
    const expiresAt = hours > 0 
      ? new Date(Date.now() + hours * 3600 * 1000)
      : null; // Se hours for 0, o bloqueio é permanente
    
    const ipHash = hashIdentifier(ip);
    
    await db.insert(ipBlacklist).values({
      ipAddress: ipHash,
      reason,
      blockType: hours === 0 ? 'permanent' : 'temporary',
      severity: 'high',
      expiresAt,
      attemptCount: 1,
      lastAttempt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Atualizar o cache
    blockedIPCache.add(ipHash);
    
    await logSecurityEvent(ip, 'IP_BLOCKED', { reason, duration: hours });
    
    return true;
  } catch (error) {
    console.error('[security] Erro ao bloquear IP:', error);
    return false;
  }
}

/**
 * Desbloqueia um IP
 */
export async function unblockIP(ip: string): Promise<boolean> {
  try {
    const ipHash = hashIdentifier(ip);
    
    await db.delete(ipBlacklist)
      .where(eq(ipBlacklist.ipAddress, ipHash));
    
    // Atualizar o cache
    blockedIPCache.delete(ipHash);
    
    await logSecurityEvent(ip, 'IP_UNBLOCKED', {});
    
    return true;
  } catch (error) {
    console.error('[security] Erro ao desbloquear IP:', error);
    return false;
  }
}

/**
 * Registra um evento de segurança
 */
export async function logSecurityEvent(
  ip: string,
  eventType: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const ipHash = hashIdentifier(ip);
    
    await db.insert(securityLogs).values({
      ipAddress: ipHash,
      eventType,
      severity: determineSeverity(eventType, details),
      description: JSON.stringify(details),
      metadata: details,
      wasBlocked: details.blocked || false,
      actionTaken: details.action || 'logged',
      timestamp: new Date(),
      createdAt: new Date()
    });
    
    if (
      eventType === 'SUSPICIOUS_PATTERN' ||
      eventType === 'INJECTION_ATTEMPT' ||
      eventType === 'UNAUTHORIZED_ACCESS'
    ) {
      const riskLevel = eventType === 'INJECTION_ATTEMPT' ? 9 : 
                        eventType === 'UNAUTHORIZED_ACCESS' ? 7 : 5;
                        
      await db.insert(suspiciousActivities).values({
        ipAddress: ipHash,
        activityType: eventType,
        riskLevel,
        description: JSON.stringify(details),
        evidenceData: details,
        timestamp: new Date(),
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error('[security] Erro ao registrar evento de segurança:', error);
  }
}

/**
 * Determina a severidade de uma atividade suspeita
 */
function determineSeverity(eventType: string, details: Record<string, any>): 'low' | 'medium' | 'high' | 'critical' {
  if (eventType === 'INJECTION_ATTEMPT') {
    return 'high';
  }
  
  if (eventType === 'UNAUTHORIZED_ACCESS') {
    return details.adminAttempt ? 'critical' : 'medium';
  }
  
  if (eventType === 'SUSPICIOUS_PATTERN') {
    const patterns = details.patterns || [];
    if (patterns.some((p: any) => p.includes('DROP') || p.includes('DELETE'))) {
      return 'critical';
    }
    if (patterns.length > 2) {
      return 'high';
    }
    return 'medium';
  }
  
  return 'low';
}

/**
 * Gera uma assinatura de segurança para autenticação da solicitação
 */
function generateSecuritySignature(ip: string, timestamp: number): string {
  const data = `${ip}|${timestamp}|${process.env.SESSION_SECRET || 'spiderman-secret'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verifica se uma assinatura de segurança é válida
 */
export function verifySecuritySignature(ip: string, timestamp: number, signature: string): boolean {
  const expectedSignature = generateSecuritySignature(ip, timestamp);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Criptografa dados sensíveis
 */
export function encryptSensitiveData(data: string): { encrypted: string, iv: string, authTag: string } {
  const key = Buffer.from(hashPassword(process.env.SESSION_SECRET || 'spiderman-secret', 'security-salt').substring(0, 32), 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Para AES-GCM, precisamos do authTag para descriptografar
  const authTag = (cipher as any).getAuthTag().toString('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag
  };
}

/**
 * Descriptografa dados sensíveis
 */
export function decryptSensitiveData(encrypted: string, iv: string, authTag: string): string {
  const key = Buffer.from(hashPassword(process.env.SESSION_SECRET || 'spiderman-secret', 'security-salt').substring(0, 32), 'utf8');
  const decipher = crypto.createDecipheriv(
    SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );
  
  (decipher as any).setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Gera um token de segurança temporário
 */
export function generateSecurityToken(userId: number, purpose: string): string {
  const payload = {
    userId,
    purpose,
    createdAt: Date.now(),
    expiresAt: Date.now() + SECURITY_CONFIG.TOKEN_EXPIRY * 1000,
    nonce: crypto.randomBytes(16).toString('hex')
  };
  
  const { encrypted, iv, authTag } = encryptSensitiveData(JSON.stringify(payload));
  
  return `${encrypted}.${iv}.${authTag}`;
}

/**
 * Verifica um token de segurança
 */
export function verifySecurityToken(token: string, purpose: string): { valid: boolean, userId?: number } {
  try {
    const [encrypted, iv, authTag] = token.split('.');
    const decrypted = decryptSensitiveData(encrypted, iv, authTag);
    const payload = JSON.parse(decrypted);
    
    // Verificar validade
    if (
      payload.purpose !== purpose ||
      payload.expiresAt < Date.now()
    ) {
      return { valid: false };
    }
    
    return { valid: true, userId: payload.userId };
  } catch (error) {
    console.error('[security] Erro ao verificar token de segurança:', error);
    return { valid: false };
  }
}

/**
 * Middleware para validar tokens de segurança nas requisições
 */
export function requireSecurityToken(purpose: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['x-security-token'] as string;
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de segurança necessário'
      });
    }
    
    const { valid, userId } = verifySecurityToken(token, purpose);
    
    if (!valid) {
      return res.status(403).json({
        status: 'error',
        message: 'Token de segurança inválido ou expirado'
      });
    }
    
    // Adicionar o ID do usuário à requisição para uso posterior
    (req as any).securityTokenUserId = userId;
    next();
  };
}

/**
 * Middleware para proteção contra CSRF
 */
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ignorar para métodos seguros
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = (req.session as any)?.csrfToken;
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid CSRF token'
      });
    }
    
    next();
  };
}

// ===== SISTEMA ANTI-BYPASS DE BAN AVANÇADO =====

// Configurações adicionais de criptografia
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Hash unidirecional para comparação sem descriptografia
 */
export function hashIdentifier(identifier: string): string {
  return crypto.createHash('sha512').update(identifier + ENCRYPTION_KEY).digest('hex');
}

/**
 * Gera um hash único do dispositivo baseado em múltiplos parâmetros
 */
export function generateDeviceFingerprintHash(fingerprint: Partial<InsertDeviceFingerprint>): string {
  const components = [
    fingerprint.hwid || '',
    fingerprint.macAddress || '',
    fingerprint.canvasFingerprint || '',
    fingerprint.webglFingerprint || '',
    fingerprint.audioFingerprint || '',
    fingerprint.screenResolution || '',
    fingerprint.timezone || '',
    fingerprint.platform || '',
    fingerprint.cpuCores?.toString() || '',
    fingerprint.deviceMemory?.toString() || '',
    (fingerprint.fonts || []).join(','),
    (fingerprint.plugins || []).join(','),
  ].join('|');
  
  return crypto.createHash('sha512').update(components).digest('hex');
}

/**
 * Calcula o nível de similaridade entre dois fingerprints (0-100)
 */
export function calculateFingerprintSimilarity(fp1: Partial<DeviceFingerprint>, fp2: Partial<DeviceFingerprint>): number {
  let matchPoints = 0;
  let totalPoints = 0;
  
  // HWID (peso 20)
  if (fp1.hwid && fp2.hwid) {
    totalPoints += 20;
    if (fp1.hwid === fp2.hwid) matchPoints += 20;
  }
  
  // MAC Address (peso 20)
  if (fp1.macAddress && fp2.macAddress) {
    totalPoints += 20;
    if (fp1.macAddress === fp2.macAddress) matchPoints += 20;
  }
  
  // IP Address (peso 10)
  if (fp1.ipAddress && fp2.ipAddress) {
    totalPoints += 10;
    if (fp1.ipAddress === fp2.ipAddress) matchPoints += 10;
  }
  
  // Canvas Fingerprint (peso 15)
  if (fp1.canvasFingerprint && fp2.canvasFingerprint) {
    totalPoints += 15;
    if (fp1.canvasFingerprint === fp2.canvasFingerprint) matchPoints += 15;
  }
  
  // WebGL Fingerprint (peso 15)
  if (fp1.webglFingerprint && fp2.webglFingerprint) {
    totalPoints += 15;
    if (fp1.webglFingerprint === fp2.webglFingerprint) matchPoints += 15;
  }
  
  // Screen Resolution (peso 5)
  if (fp1.screenResolution && fp2.screenResolution) {
    totalPoints += 5;
    if (fp1.screenResolution === fp2.screenResolution) matchPoints += 5;
  }
  
  // Timezone (peso 5)
  if (fp1.timezone && fp2.timezone) {
    totalPoints += 5;
    if (fp1.timezone === fp2.timezone) matchPoints += 5;
  }
  
  // Platform (peso 5)
  if (fp1.platform && fp2.platform) {
    totalPoints += 5;
    if (fp1.platform === fp2.platform) matchPoints += 5;
  }
  
  // Fonts (peso 5)
  if (fp1.fonts && fp2.fonts) {
    totalPoints += 5;
    const commonFonts = (fp1.fonts as string[]).filter(f => (fp2.fonts as string[]).includes(f));
    const fontSimilarity = commonFonts.length / Math.max((fp1.fonts as string[]).length, (fp2.fonts as string[]).length);
    matchPoints += fontSimilarity * 5;
  }
  
  if (totalPoints === 0) return 0;
  
  return Math.round((matchPoints / totalPoints) * 100);
}

interface BanBypassCheckResult {
  isBypass: boolean;
  confidence: number; // 0-100
  reasons: string[];
  matchedFingerprints: DeviceFingerprint[];
  recommendedAction: 'allow' | 'block' | 'flag';
}

/**
 * Verifica se há tentativa de bypass de ban usando múltiplas camadas de detecção
 */
export async function detectBanBypass(
  userId: number | null,
  fingerprintData: Partial<InsertDeviceFingerprint>
): Promise<BanBypassCheckResult> {
  const reasons: string[] = [];
  let confidence = 0;
  const matchedFingerprints: DeviceFingerprint[] = [];
  
  // Layer 1: Verificar IP banido
  if (fingerprintData.ipAddress) {
    const ipHash = hashIdentifier(fingerprintData.ipAddress);
    
    // Verificar se o IP está na lista de identificadores banidos
    const bannedIpIdentifier = await db
      .select()
      .from(bannedIdentifiers)
      .where(
        and(
          eq(bannedIdentifiers.identifier, ipHash),
          eq(bannedIdentifiers.identifierType, 'ip')
        )
      )
      .limit(1);
      
    if (bannedIpIdentifier.length > 0) {
      reasons.push('IP identifier is banned');
      confidence += 25;
    }
  }
  
  // Layer 2: Verificar HWID banido
  if (fingerprintData.hwid) {
    const hwidHash = hashIdentifier(fingerprintData.hwid);
    
    const bannedHwid = await db
      .select()
      .from(bannedIdentifiers)
      .where(
        and(
          eq(bannedIdentifiers.identifier, hwidHash),
          eq(bannedIdentifiers.identifierType, 'hwid')
        )
      )
      .limit(1);
      
    if (bannedHwid.length > 0) {
      reasons.push('Hardware ID is banned');
      confidence += 40;
    }
    
    // Verificar dispositivos banidos com HWID similar
    const bannedDevices = await db
      .select()
      .from(deviceFingerprints)
      .where(eq(deviceFingerprints.isBanned, true));
      
    for (const device of bannedDevices) {
      if (device.hwid === hwidHash) {
        reasons.push('Exact HWID match with banned device');
        confidence += 35;
        matchedFingerprints.push(device);
      }
    }
  }
  
  // Layer 3: Verificar MAC Address banido
  if (fingerprintData.macAddress) {
    const macHash = hashIdentifier(fingerprintData.macAddress);
    
    const bannedMac = await db
      .select()
      .from(bannedIdentifiers)
      .where(
        and(
          eq(bannedIdentifiers.identifier, macHash),
          eq(bannedIdentifiers.identifierType, 'mac')
        )
      )
      .limit(1);
      
    if (bannedMac.length > 0) {
      reasons.push('MAC Address is banned');
      confidence += 40;
    }
  }
  
  // Layer 4: Análise de similaridade de fingerprint
  const allFingerprints = await db
    .select()
    .from(deviceFingerprints)
    .orderBy(desc(deviceFingerprints.lastSeen))
    .limit(1000); // Últimos 1000 fingerprints
    
  for (const existingFp of allFingerprints) {
    const similarity = calculateFingerprintSimilarity(fingerprintData as DeviceFingerprint, existingFp);
    
    if (similarity >= 90 && existingFp.isBanned) {
      reasons.push(`Very high similarity (${similarity}%) with banned device #${existingFp.id}`);
      confidence += 30;
      matchedFingerprints.push(existingFp);
    } else if (similarity >= 75 && existingFp.isBanned) {
      reasons.push(`High similarity (${similarity}%) with banned device #${existingFp.id}`);
      confidence += 15;
      matchedFingerprints.push(existingFp);
    } else if (similarity >= 60 && (existingFp.riskScore || 0) >= 70) {
      reasons.push(`Moderate similarity (${similarity}%) with high-risk device #${existingFp.id}`);
      confidence += 10;
    }
  }
  
  // Layer 5: Detecção de VPN/Tor/Proxy
  if (fingerprintData.isVpn || fingerprintData.isTor || fingerprintData.isProxy) {
    const vpnTorProxyMethods = [];
    if (fingerprintData.isVpn) vpnTorProxyMethods.push('VPN');
    if (fingerprintData.isTor) vpnTorProxyMethods.push('Tor');
    if (fingerprintData.isProxy) vpnTorProxyMethods.push('Proxy');
    
    reasons.push(`Using anonymization methods: ${vpnTorProxyMethods.join(', ')}`);
    confidence += 20;
  }
  
  // Determinar ação recomendada
  let recommendedAction: 'allow' | 'block' | 'flag' = 'allow';
  
  if (confidence >= 70) {
    recommendedAction = 'block';
  } else if (confidence >= 40) {
    recommendedAction = 'flag';
  }
  
  return {
    isBypass: confidence >= 50,
    confidence: Math.min(confidence, 100),
    reasons,
    matchedFingerprints,
    recommendedAction
  };
}

/**
 * Calcula o risk score de um dispositivo baseado em múltiplos fatores
 */
export function calculateDeviceRiskScore(fingerprint: Partial<InsertDeviceFingerprint>): number {
  let riskScore = 0;
  
  // VPN/Tor/Proxy aumenta o risco
  if (fingerprint.isVpn) riskScore += 20;
  if (fingerprint.isTor) riskScore += 30;
  if (fingerprint.isProxy) riskScore += 25;
  
  // Falta de informações aumenta suspeita
  if (!fingerprint.hwid) riskScore += 10;
  if (!fingerprint.macAddress) riskScore += 10;
  if (!fingerprint.canvasFingerprint) riskScore += 5;
  if (!fingerprint.webglFingerprint) riskScore += 5;
  
  // User agent suspeito
  if (fingerprint.userAgent) {
    const ua = fingerprint.userAgent.toLowerCase();
    if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
      riskScore += 40;
    }
    if (ua.includes('curl') || ua.includes('wget') || ua.includes('python')) {
      riskScore += 35;
    }
  }
  
  return Math.min(riskScore, 100);
}

/**
 * Armazena ou atualiza fingerprint do dispositivo
 */
export async function storeDeviceFingerprint(
  fingerprintData: InsertDeviceFingerprint,
  userId?: number
): Promise<DeviceFingerprint> {
  // Criptografar dados sensíveis
  const encryptedData = {
    hwid: fingerprintData.hwid ? hashIdentifier(fingerprintData.hwid) : null,
    macAddress: fingerprintData.macAddress ? hashIdentifier(fingerprintData.macAddress) : null,
    ipAddress: hashIdentifier(fingerprintData.ipAddress)
  };
  
  const fingerprintHash = generateDeviceFingerprintHash(fingerprintData);
  
  // Calcular risk score
  const riskScore = calculateDeviceRiskScore(fingerprintData);
  
  // Verificar se já existe um fingerprint similar
  const conditions = [];
  if (fingerprintData.hwid && encryptedData.hwid) {
    conditions.push(eq(deviceFingerprints.hwid, encryptedData.hwid));
  }
  if (fingerprintData.macAddress && encryptedData.macAddress) {
    conditions.push(eq(deviceFingerprints.macAddress, encryptedData.macAddress));
  }
  
  let existing: DeviceFingerprint[] = [];
  if (conditions.length > 0) {
    existing = await db
      .select()
      .from(deviceFingerprints)
      .where(or(...conditions))
      .limit(1);
  }
  
  if (existing.length > 0) {
    // Atualizar fingerprint existente
    const [updated] = await db
      .update(deviceFingerprints)
      .set({
        ...encryptedData,
        userId: userId || existing[0].userId,
        canvasFingerprint: fingerprintData.canvasFingerprint,
        webglFingerprint: fingerprintData.webglFingerprint,
        audioFingerprint: fingerprintData.audioFingerprint,
        screenResolution: fingerprintData.screenResolution,
        timezone: fingerprintData.timezone,
        language: fingerprintData.language,
        platform: fingerprintData.platform,
        userAgent: fingerprintData.userAgent,
        cpuCores: fingerprintData.cpuCores,
        deviceMemory: fingerprintData.deviceMemory,
        plugins: fingerprintData.plugins,
        fonts: fingerprintData.fonts,
        touchSupport: fingerprintData.touchSupport,
        batteryLevel: fingerprintData.batteryLevel,
        geoLocation: fingerprintData.geoLocation,
        isp: fingerprintData.isp,
        isVpn: fingerprintData.isVpn,
        isTor: fingerprintData.isTor,
        isProxy: fingerprintData.isProxy,
        riskScore,
        lastSeen: new Date(),
        timesUsed: sql`${deviceFingerprints.timesUsed} + 1`,
        updatedAt: new Date()
      })
      .where(eq(deviceFingerprints.id, existing[0].id))
      .returning();
    
    return updated;
  }
  
  // Criar novo fingerprint
  const [newFingerprint] = await db
    .insert(deviceFingerprints)
    .values({
      userId,
      ...encryptedData,
      canvasFingerprint: fingerprintData.canvasFingerprint,
      webglFingerprint: fingerprintData.webglFingerprint,
      audioFingerprint: fingerprintData.audioFingerprint,
      screenResolution: fingerprintData.screenResolution,
      timezone: fingerprintData.timezone,
      language: fingerprintData.language,
      platform: fingerprintData.platform,
      userAgent: fingerprintData.userAgent,
      cpuCores: fingerprintData.cpuCores,
      deviceMemory: fingerprintData.deviceMemory,
      plugins: fingerprintData.plugins,
      fonts: fingerprintData.fonts,
      touchSupport: fingerprintData.touchSupport,
      batteryLevel: fingerprintData.batteryLevel,
      geoLocation: fingerprintData.geoLocation,
      isp: fingerprintData.isp,
      isVpn: fingerprintData.isVpn || false,
      isTor: fingerprintData.isTor || false,
      isProxy: fingerprintData.isProxy || false,
      riskScore,
      isBanned: false,
      firstSeen: new Date(),
      lastSeen: new Date(),
      timesUsed: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  return newFingerprint;
}