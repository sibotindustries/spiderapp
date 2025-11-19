import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, AlertTriangle, UserX, Activity, List, BarChart2, Eye, Clock, Database, ZapOff, Bug, Zap, BugPlay } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Tipos para as estatísticas de segurança
interface SecurityStats {
  totalBlocked: number;
  totalSuspicious: number;
  activeBlocks: number;
  suspiciousLast24h: number;
  totalLogs: number;
  trustScoreAverage: number;
  recentAttackTypes: { type: string; count: number }[];
  severityDistribution: { severity: string; count: number }[];
}

// Interface para atividades suspeitas
interface SuspiciousActivity {
  id: number;
  ipAddress: string;
  activityType: string;
  details: any;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Interface para IPs bloqueados
interface BlockedIP {
  id: number;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

export function AntiHackerDashboard() {
  const [ipToBlock, setIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState(24); // Horas
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [simulationIP, setSimulationIP] = useState('192.168.1.1');
  const [attackType, setAttackType] = useState('sql-injection');
  const [attackCount, setAttackCount] = useState(5);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Mutação para simular ataques
  const simulateAttackMutation = useMutation({
    mutationFn: async (data: { ip: string; attackType: string; count: number }) => {
      console.log('Enviando requisição de simulação:', data);
      try {
        // Usando o endpoint de teste que não requer autenticação
        const res = await apiRequest('POST', '/api/security/test-simulate-attack', data);
        console.log('Resposta da simulação:', res.status, res.statusText);
        const result = await res.json();
        console.log('Dados da resposta:', result);
        return result;
      } catch (error) {
        console.error('Erro na simulação:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Ataque simulado com sucesso",
        description: `Simulação de ${attackCount} tentativas do tipo ${attackType} para o IP ${simulationIP}.`,
      });
      
      // Atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/security/suspicious-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao simular ataque",
        description: error.message || "Falha ao processar a solicitação",
        variant: "destructive",
      });
    }
  });

  // Verificar se o usuário é admin
  const isAdmin = user?.isAdmin;

  // Consulta para estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery<SecurityStats>({
    queryKey: ['/api/security/stats'],
    queryFn: async () => {
      console.log('Buscando estatísticas...');
      try {
        const res = await apiRequest('GET', '/api/security/stats');
        console.log('Resposta das estatísticas:', res.status, res.statusText);
        const data = await res.json();
        console.log('Dados das estatísticas:', data);
        return data;
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw error;
      }
    },
    enabled: Boolean(isAdmin), // Só busca se o usuário for admin
  });

  // Consulta para atividades suspeitas
  const { data: suspiciousActivities, isLoading: activitiesLoading } = useQuery<SuspiciousActivity[]>({
    queryKey: ['/api/security/suspicious-activities'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/security/suspicious-activities');
      return await res.json();
    },
    enabled: Boolean(isAdmin) && selectedTab === 'activities',
  });

  // Consulta para IPs bloqueados
  const { data: blockedIPs, isLoading: blockedIPsLoading } = useQuery<BlockedIP[]>({
    queryKey: ['/api/security/blocked-ips'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/security/blocked-ips');
      return await res.json();
    },
    enabled: Boolean(isAdmin) && selectedTab === 'blocked',
  });

  // Função para bloquear um IP
  const blockIP = async () => {
    if (!ipToBlock || !blockReason) {
      toast({
        title: "Campos incompletos",
        description: "IP e motivo do bloqueio são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await apiRequest('POST', '/api/security/block-ip', {
        ipAddress: ipToBlock,
        reason: blockReason,
        duration: blockDuration
      });

      if (res.ok) {
        toast({
          title: "IP bloqueado com sucesso",
          description: `O IP ${ipToBlock} foi bloqueado por ${blockDuration} horas.`,
        });
        
        // Limpar campos
        setIpToBlock('');
        setBlockReason('');
        
        // Atualizar lista de IPs bloqueados
        queryClient.invalidateQueries({ queryKey: ['/api/security/blocked-ips'] });
        queryClient.invalidateQueries({ queryKey: ['/api/security/stats'] });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao bloquear IP');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao bloquear IP",
        description: error.message || "Falha ao processar a solicitação",
        variant: "destructive",
      });
    }
  };

  // Função para desbloquear um IP
  const unblockIP = async (id: number, ip: string) => {
    try {
      const res = await apiRequest('POST', '/api/security/unblock-ip', { id });

      if (res.ok) {
        toast({
          title: "IP desbloqueado",
          description: `O IP ${ip} foi desbloqueado com sucesso.`,
        });
        
        // Atualizar lista de IPs bloqueados
        queryClient.invalidateQueries({ queryKey: ['/api/security/blocked-ips'] });
        queryClient.invalidateQueries({ queryKey: ['/api/security/stats'] });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao desbloquear IP');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao desbloquear IP",
        description: error.message || "Falha ao processar a solicitação",
        variant: "destructive",
      });
    }
  };

  // Renderizar badge de severidade com cores correspondentes
  const renderSeverityBadge = (severity: string) => {
    const severityMap: Record<string, { color: string, bg: string }> = {
      'LOW': { color: 'text-blue-500', bg: 'bg-blue-100' },
      'MEDIUM': { color: 'text-yellow-500', bg: 'bg-yellow-100' },
      'HIGH': { color: 'text-orange-500', bg: 'bg-orange-100' },
      'CRITICAL': { color: 'text-red-500', bg: 'bg-red-100' },
    };

    const style = severityMap[severity] || { color: 'text-gray-500', bg: 'bg-gray-100' };

    return (
      <Badge className={`${style.color} ${style.bg}`}>
        {severity}
      </Badge>
    );
  };

  // Se não for admin, não mostra nada
  if (!isAdmin) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistema de Segurança Anti-Hacker
          </CardTitle>
          <CardDescription>
            Acesso restrito. Esta funcionalidade está disponível apenas para administradores.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold">Sistema de Segurança Anti-Hacker</h2>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Atividades Suspeitas</span>
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-1">
            <UserX className="h-4 w-4" />
            <span>IPs Bloqueados</span>
          </TabsTrigger>
          <TabsTrigger value="block" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Bloquear IP</span>
          </TabsTrigger>
          <TabsTrigger value="simulate" className="flex items-center gap-1">
            <BugPlay className="h-4 w-4" />
            <span>Simular Ataque</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          {statsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      IPs Bloqueados Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.activeBlocks}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      De um total de {stats.totalBlocked} bloqueios
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Atividades Suspeitas (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.suspiciousLast24h}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      De um total de {stats.totalSuspicious} atividades
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pontuação de Confiança Média
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.trustScoreAverage}/100</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Baseado em {stats.totalLogs} logs de segurança
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Tipos de Ataques Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recentAttackTypes.length > 0 ? (
                      <ul className="space-y-2">
                        {stats.recentAttackTypes.map((attack, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span>{attack.type}</span>
                            <Badge variant="outline">{attack.count}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum ataque recente registrado
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Distribuição de Severidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.severityDistribution.length > 0 ? (
                      <ul className="space-y-2">
                        {stats.severityDistribution.map((severity, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span>{severity.severity}</span>
                            <Badge variant="outline">{severity.count}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhuma atividade registrada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  Não foi possível carregar as estatísticas de segurança
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Atividades Suspeitas
              </CardTitle>
              <CardDescription>
                Lista de atividades suspeitas detectadas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : suspiciousActivities && suspiciousActivities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspiciousActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.ipAddress}</TableCell>
                        <TableCell>{activity.activityType}</TableCell>
                        <TableCell>{renderSeverityBadge(activity.severity)}</TableCell>
                        <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-10 text-muted-foreground">
                  Nenhuma atividade suspeita encontrada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                IPs Bloqueados
              </CardTitle>
              <CardDescription>
                Lista de IPs bloqueados pelo sistema de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedIPsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : blockedIPs && blockedIPs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Data do Bloqueio</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-medium">{ip.ipAddress}</TableCell>
                        <TableCell>{ip.reason}</TableCell>
                        <TableCell>{new Date(ip.blockedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          {ip.expiresAt 
                            ? new Date(ip.expiresAt).toLocaleString() 
                            : 'Permanente'}
                        </TableCell>
                        <TableCell>
                          {ip.isActive 
                            ? <Badge className="bg-red-100 text-red-500">Ativo</Badge>
                            : <Badge className="bg-green-100 text-green-500">Inativo</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          {ip.isActive && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => unblockIP(ip.id, ip.ipAddress)}
                              className="h-8 p-2"
                            >
                              Desbloquear
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-10 text-muted-foreground">
                  Nenhum IP bloqueado encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="block">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bloquear IP
              </CardTitle>
              <CardDescription>
                Bloqueie manualmente um endereço IP suspeito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="ip-address" className="text-sm font-medium">
                    Endereço IP
                  </label>
                  <Input
                    id="ip-address"
                    placeholder="ex: 192.168.1.1"
                    value={ipToBlock}
                    onChange={(e) => setIpToBlock(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="block-reason" className="text-sm font-medium">
                    Motivo do Bloqueio
                  </label>
                  <Input
                    id="block-reason"
                    placeholder="ex: Tentativa de ataque XSS"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="block-duration" className="text-sm font-medium">
                    Duração do Bloqueio (horas, 0 para permanente)
                  </label>
                  <Input
                    id="block-duration"
                    type="number"
                    min="0"
                    placeholder="24"
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={blockIP}>
                Bloquear IP
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="simulate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BugPlay className="h-5 w-5" />
                Simulação de Ataques
              </CardTitle>
              <CardDescription>
                Simule diferentes tipos de ataques para testar o sistema de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="sim-ip-address" className="text-sm font-medium">
                    Endereço IP
                  </label>
                  <Input
                    id="sim-ip-address"
                    placeholder="ex: 192.168.1.1"
                    value={simulationIP}
                    onChange={(e) => setSimulationIP(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="attack-type" className="text-sm font-medium">
                    Tipo de Ataque
                  </label>
                  <Select 
                    defaultValue={attackType} 
                    onValueChange={(value) => setAttackType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de ataque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sql-injection">Injeção SQL</SelectItem>
                      <SelectItem value="xss">Cross-Site Scripting (XSS)</SelectItem>
                      <SelectItem value="brute-force">Força Bruta</SelectItem>
                      <SelectItem value="ddos">DDoS</SelectItem>
                      <SelectItem value="path-traversal">Path Traversal</SelectItem>
                      <SelectItem value="csrf">CSRF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="attack-count" className="text-sm font-medium">
                    Número de Tentativas
                  </label>
                  <Input
                    id="attack-count"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="5"
                    value={attackCount}
                    onChange={(e) => setAttackCount(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantidade de tentativas de ataque a serem simuladas (1-100)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => simulateAttackMutation.mutate({
                  ip: simulationIP,
                  attackType,
                  count: attackCount
                })}
                disabled={simulateAttackMutation.isPending}
              >
                {simulateAttackMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Simulando...
                  </>
                ) : (
                  <>Simular Ataque</>
                )}
              </Button>
            </CardFooter>
            <div className="p-4 border-t border-border">
              <div className="text-sm">
                <p className="font-medium mb-2">Como funciona:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Esta simulação envia requisições que simulam padrões de ataque reais</li>
                  <li>O sistema de detecção automática de ameaças irá identificar e registrar as tentativas</li>
                  <li>Se o número ou severidade dos ataques exceder os limites, o IP pode ser bloqueado automaticamente</li>
                  <li>Use esta ferramenta para testar a eficácia das suas configurações de segurança</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}