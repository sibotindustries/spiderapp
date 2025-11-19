import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';

// Importamos um pacote para visualizar as moléculas
// (simulando uma biblioteca de química - em produção usaríamos algo real como RDKit ou ChemDoodle)
const TEIA_FORMULAS = [
  {
    id: 'teia-padrao',
    nome: 'Teia Padrão',
    elasticidade: 80,
    durabilidade: 70,
    tensao: 75,
    formula: 'C12H18N2O4S + NaCl + H2O',
    descricao: 'Fórmula padrão com boa elasticidade e durabilidade média.'
  },
  {
    id: 'teia-impacto',
    nome: 'Teia de Impacto',
    elasticidade: 40,
    durabilidade: 95,
    tensao: 90,
    formula: 'C14H22N4O3S2 + CaCl2',
    descricao: 'Teia reforçada para alto impacto e absorção de energia cinética.'
  },
  {
    id: 'teia-condutor',
    nome: 'Teia Condutora',
    elasticidade: 60,
    durabilidade: 65,
    tensao: 70,
    formula: 'C10H15N3O3S + Cu2O',
    descricao: 'Teia com propriedades condutoras de eletricidade.'
  },
  {
    id: 'teia-adesiva',
    nome: 'Teia Ultra-adesiva',
    elasticidade: 85,
    durabilidade: 50,
    tensao: 60,
    formula: 'C16H20N2O6S3',
    descricao: 'Teia com maior poder de adesão para imobilizar adversários.'
  }
];

const DISPOSITIVOS = [
  {
    id: 'lanca-teias',
    nome: 'Lançadores de Teia Padrão',
    tipo: 'Ofensivo',
    potencia: 75,
    descricao: 'Dispositivos de pulso que disparam teias de forma precisa e rápida.',
    status: 'Operacional'
  },
  {
    id: 'rastreador-aranha',
    nome: 'Rastreadores-Aranha',
    tipo: 'Vigilância',
    potencia: 60,
    descricao: 'Mini-dispositivos em forma de aranha que podem rastrear alvos e transmitir localização.',
    status: 'Operacional'
  },
  {
    id: 'lentes-hud',
    nome: 'Lentes com HUD Integrado',
    tipo: 'Apoio',
    potencia: 90,
    descricao: 'Lentes especiais que fornecem informações em tempo real e visão aumentada.',
    status: 'Em manutenção'
  },
  {
    id: 'teia-eletrificada',
    nome: 'Sistema de Teia Eletrificada',
    tipo: 'Ofensivo',
    potencia: 85,
    descricao: 'Modificação que permite carregar as teias com eletricidade para maior eficácia.',
    status: 'Em desenvolvimento'
  }
];

interface MoleculaVisualizadorProps {
  formula: string;
}

// Componente simples para simular a visualização de moléculas
function MoleculaVisualizador({ formula }: MoleculaVisualizadorProps) {
  return (
    <div className="relative h-40 w-full bg-black/10 rounded-md overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-xs font-mono text-muted-foreground">{formula}</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {formula.split('+').map((composto, i) => (
          <div key={i} className="relative mx-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary/40 animate-pulse"></div>
            </div>
            {i < formula.split('+').length - 1 && (
              <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 text-xl">+</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpiderLab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formulas, setFormulas] = useState(TEIA_FORMULAS);
  const [dispositivos, setDispositivos] = useState(DISPOSITIVOS);
  const [formulaAtual, setFormulaAtual] = useState<string>('');
  const [novoDispositivo, setNovoDispositivo] = useState({
    nome: '',
    tipo: 'Ofensivo',
    potencia: 70,
    descricao: '',
    status: 'Em desenvolvimento'
  });

  const [novaFormula, setNovaFormula] = useState({
    nome: '',
    elasticidade: 50,
    durabilidade: 50,
    tensao: 50,
    formula: '', // Será gerada automaticamente
    descricao: ''
  });
  
  // Função para gerar a fórmula química baseada nas propriedades
  const gerarFormulaQuimica = (elasticidade: number, durabilidade: number, tensao: number): string => {
    // Base da fórmula para todas as teias
    let baseFormula = "C";
    
    // Carbono varia com elasticidade
    const carbonoBase = 10;
    const carbono = carbonoBase + Math.floor(elasticidade / 10);
    baseFormula += carbono;
    
    // Hidrogênio varia com durabilidade
    const hidrogenioBase = 14;
    const hidrogenio = hidrogenioBase + Math.floor(durabilidade / 12);
    baseFormula += `H${hidrogenio}`;
    
    // Nitrogênio varia com tensão
    const nitrogenioBase = 2;
    const nitrogenio = nitrogenioBase + Math.floor(tensao / 25);
    baseFormula += `N${nitrogenio}`;
    
    // Oxigênio varia com combinação de propriedades
    const oxigenioBase = 2;
    const oxigenio = oxigenioBase + Math.floor((elasticidade + durabilidade + tensao) / 60);
    baseFormula += `O${oxigenio}`;
    
    // Adiciona componentes extras baseados nas propriedades
    if (elasticidade > 70) {
      baseFormula += "S";
    }
    
    if (durabilidade > 70) {
      baseFormula += " + CaCl2";
    }
    
    if (tensao > 70) {
      baseFormula += " + Fe2O3";
    }
    
    // Componente de água para teias muito elásticas
    if (elasticidade > 85) {
      baseFormula += " + H2O";
    }
    
    // Componente metálico para teias muito tensas
    if (tensao > 85) {
      baseFormula += " + Cu2O";
    }
    
    return baseFormula;
  };

  // Verifica se o usuário é o Spider-Man
  const isSpiderman = user && (user as any).username === 'spiderman';

  // Redireciona caso não seja o Spider-Man
  if (!isSpiderman) {
    return <Redirect to="/dashboard" />;
  }

  const handleSalvarFormula = () => {
    if (!novaFormula.nome) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o nome da fórmula química',
        variant: 'destructive'
      });
      return;
    }

    // Gera a fórmula química baseada nas propriedades
    const formulaGerada = gerarFormulaQuimica(
      novaFormula.elasticidade, 
      novaFormula.durabilidade, 
      novaFormula.tensao
    );

    const novaFormulaCompleta = {
      id: `teia-${Date.now()}`,
      ...novaFormula,
      formula: formulaGerada // Usa a fórmula gerada automaticamente
    };

    setFormulas([...formulas, novaFormulaCompleta]);
    
    toast({
      title: 'Fórmula Salva',
      description: `A fórmula ${novaFormula.nome} foi salva com sucesso!`
    });

    // Reseta o formulário
    setNovaFormula({
      nome: '',
      elasticidade: 50,
      durabilidade: 50,
      tensao: 50,
      formula: '',
      descricao: ''
    });
  };

  const handleSalvarDispositivo = () => {
    if (!novoDispositivo.nome || !novoDispositivo.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e a descrição do dispositivo',
        variant: 'destructive'
      });
      return;
    }

    const novoDispositivoCompleto = {
      id: `dispositivo-${Date.now()}`,
      ...novoDispositivo
    };

    setDispositivos([...dispositivos, novoDispositivoCompleto]);
    
    toast({
      title: 'Dispositivo Salvo',
      description: `O dispositivo ${novoDispositivo.nome} foi salvo com sucesso!`
    });

    // Reseta o formulário
    setNovoDispositivo({
      nome: '',
      tipo: 'Ofensivo',
      potencia: 70,
      descricao: '',
      status: 'Em desenvolvimento'
    });
  };

  const handleTestarFormula = (formula: string) => {
    setFormulaAtual(formula);
    
    // Simula um teste
    toast({
      title: 'Teste iniciado',
      description: 'Testando propriedades químicas da fórmula...'
    });
    
    // Após um delay, mostra resultado
    setTimeout(() => {
      toast({
        title: 'Teste concluído',
        description: 'Fórmula válida e pronta para uso!'
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Laboratório Aranha" 
        subtitle="Desenvolvimento de teias e equipamentos especiais"
      />
      
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <div className="border border-foreground/10 rounded-lg p-4 bg-background shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-2 flex items-center">
            <span className="mr-2">🧪</span> 
            Bem-vindo ao seu laboratório secreto, Homem-Aranha
          </h2>
          <p className="text-muted-foreground">
            Este é o seu espaço seguro para desenvolver, testar e aprimorar suas tecnologias. 
            Todos os dados são criptografados e apenas você tem acesso.
          </p>
        </div>
        
        <Tabs defaultValue="formulas" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="formulas">Fórmulas Químicas</TabsTrigger>
            <TabsTrigger value="dispositivos">Dispositivos Tecnológicos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="formulas" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formulas.map(formula => (
                <Card key={formula.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{formula.nome}</CardTitle>
                    <CardDescription className="text-xs font-mono">{formula.formula}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <MoleculaVisualizador formula={formula.formula} />
                    <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                      <div>
                        <span className="text-muted-foreground">Elasticidade:</span>
                        <div className="h-1.5 w-full bg-secondary mt-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${formula.elasticidade}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Durabilidade:</span>
                        <div className="h-1.5 w-full bg-secondary mt-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${formula.durabilidade}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tensão:</span>
                        <div className="h-1.5 w-full bg-secondary mt-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${formula.tensao}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{formula.descricao}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestarFormula(formula.formula)}>
                      Testar Fórmula
                    </Button>
                    <Button variant="default" size="sm">
                      Usar em Dispositivo
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <Card>
              <CardHeader>
                <CardTitle>Nova Fórmula de Teia</CardTitle>
                <CardDescription>
                  Desenvolva uma nova composição química para suas teias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Nome da fórmula" 
                      value={novaFormula.nome}
                      onChange={e => setNovaFormula({...novaFormula, nome: e.target.value})}
                    />
                    <Textarea 
                      placeholder="Descrição e propriedades" 
                      className="h-20"
                      value={novaFormula.descricao}
                      onChange={e => setNovaFormula({...novaFormula, descricao: e.target.value})}
                    />
                    <div className="p-2 border border-primary/20 rounded-md bg-secondary/10">
                      <p className="text-xs text-muted-foreground mb-1">Fórmula gerada automaticamente:</p>
                      <code className="text-xs font-mono">
                        {gerarFormulaQuimica(novaFormula.elasticidade, novaFormula.durabilidade, novaFormula.tensao)}
                      </code>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Elasticidade</span>
                        <span>{novaFormula.elasticidade}%</span>
                      </div>
                      <Slider 
                        value={[novaFormula.elasticidade]} 
                        min={0} 
                        max={100} 
                        step={1}
                        onValueChange={([value]) => setNovaFormula({...novaFormula, elasticidade: value})}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Durabilidade</span>
                        <span>{novaFormula.durabilidade}%</span>
                      </div>
                      <Slider 
                        value={[novaFormula.durabilidade]} 
                        min={0} 
                        max={100} 
                        step={1}
                        onValueChange={([value]) => setNovaFormula({...novaFormula, durabilidade: value})}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Tensão</span>
                        <span>{novaFormula.tensao}%</span>
                      </div>
                      <Slider 
                        value={[novaFormula.tensao]} 
                        min={0} 
                        max={100} 
                        step={1}
                        onValueChange={([value]) => setNovaFormula({...novaFormula, tensao: value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Visualização da molécula:</h4>
                  <MoleculaVisualizador formula={gerarFormulaQuimica(novaFormula.elasticidade, novaFormula.durabilidade, novaFormula.tensao)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSalvarFormula}
                  className="w-full"
                >
                  Salvar Nova Fórmula
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="dispositivos" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dispositivos.map(dispositivo => (
                <Card key={dispositivo.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{dispositivo.nome}</CardTitle>
                    <div className="flex justify-between">
                      <CardDescription>Tipo: {dispositivo.tipo}</CardDescription>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        dispositivo.status === 'Operacional' 
                          ? 'bg-green-500/20 text-green-600'
                          : dispositivo.status === 'Em manutenção'
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-blue-500/20 text-blue-600'
                      }`}>
                        {dispositivo.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-xs">
                        <span>Potência</span>
                        <span>{dispositivo.potencia}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary mt-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${dispositivo.potencia}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{dispositivo.descricao}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm">
                      Diagnosticar
                    </Button>
                    <Button variant="default" size="sm">
                      Modificar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <Card>
              <CardHeader>
                <CardTitle>Novo Dispositivo</CardTitle>
                <CardDescription>
                  Projete um novo gadget para seu arsenal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Input 
                      placeholder="Nome do dispositivo" 
                      value={novoDispositivo.nome}
                      onChange={e => setNovoDispositivo({...novoDispositivo, nome: e.target.value})}
                    />
                    
                    <Select 
                      value={novoDispositivo.tipo}
                      onValueChange={value => setNovoDispositivo({...novoDispositivo, tipo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de dispositivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ofensivo">Ofensivo</SelectItem>
                        <SelectItem value="Defensivo">Defensivo</SelectItem>
                        <SelectItem value="Vigilância">Vigilância</SelectItem>
                        <SelectItem value="Mobilidade">Mobilidade</SelectItem>
                        <SelectItem value="Apoio">Apoio</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={novoDispositivo.status}
                      onValueChange={value => setNovoDispositivo({...novoDispositivo, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em desenvolvimento">Em desenvolvimento</SelectItem>
                        <SelectItem value="Protótipo">Protótipo</SelectItem>
                        <SelectItem value="Em testes">Em testes</SelectItem>
                        <SelectItem value="Operacional">Operacional</SelectItem>
                        <SelectItem value="Em manutenção">Em manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Potência</span>
                        <span>{novoDispositivo.potencia}%</span>
                      </div>
                      <Slider 
                        value={[novoDispositivo.potencia]} 
                        min={0} 
                        max={100} 
                        step={1}
                        onValueChange={([value]) => setNovoDispositivo({...novoDispositivo, potencia: value})}
                      />
                    </div>
                    
                    <Textarea 
                      placeholder="Descrição e funcionalidades" 
                      className="h-28"
                      value={novoDispositivo.descricao}
                      onChange={e => setNovoDispositivo({...novoDispositivo, descricao: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSalvarDispositivo}
                  className="w-full"
                >
                  Salvar Novo Dispositivo
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {formulaAtual && (
          <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 mt-4">
            <h3 className="text-sm font-medium mb-2">Análise química em tempo real:</h3>
            <code className="text-xs block font-mono bg-background p-2 rounded">{formulaAtual}</code>
            
            <div className="grid grid-cols-4 gap-2 mt-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-6 bg-primary/10 rounded-md animate-pulse" style={{
                  animationDelay: `${i * 0.1}s`
                }}></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}