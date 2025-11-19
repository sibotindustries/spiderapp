
# SpiderAPP - Configuração para Windows (VSCode)

## Pré-requisitos

1. **Node.js 20+**: Baixe em https://nodejs.org/
2. **PostgreSQL 16**: Baixe em https://www.postgresql.org/download/windows/
3. **Git**: Baixe em https://git-scm.com/download/win
4. **VSCode**: Baixe em https://code.visualstudio.com/

## Instalação

### 1. Extrair o Projeto

Extraia o arquivo ZIP em uma pasta de sua preferência (ex: `C:\Projects\SpiderAPP`)

### 2. Abrir no VSCode

```bash
cd C:\Projects\SpiderAPP
code .
```

### 3. Instalar Extensões Recomendadas

Quando o VSCode abrir, ele sugerirá instalar as extensões recomendadas. Clique em **Install All**.

### 4. Configurar PostgreSQL

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE spiderapp;
```

### 5. Configurar Variáveis de Ambiente

Edite o arquivo `.env` e preencha:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/spiderapp"
PGDATABASE="spiderapp"
PGUSER="seu_usuario"
PGPORT="5432"
PGHOST="localhost"
PGPASSWORD="sua_senha"
SESSION_SECRET="45OONoCdlcTwqywEzdH7mOE9NNYJiyP47CozkXclfAzw0WqwUM41+ekcYjqX6FE8TBLHGwm9L7yk1G4G95emlg=="
```

### 6. Instalar Dependências

No terminal integrado do VSCode (Ctrl + `):

```bash
npm install
```

### 7. Inicializar o Banco de Dados

```bash
npm run db:push
```

### 8. Iniciar o Servidor

Para desenvolvimento:

```bash
npm run dev
```

Para produção:

```bash
npm run build
npm run start
```

## Acessar a Aplicação

Abra o navegador em: `http://localhost:5000`

## Credenciais Padrão

- **Usuário**: spiderman
- **Senha**: web-slinger

## Atalhos Úteis do VSCode

- **Ctrl + `**: Abrir/Fechar terminal
- **F5**: Iniciar debug
- **Ctrl + Shift + B**: Build do projeto
- **Ctrl + P**: Buscar arquivos
- **Ctrl + Shift + F**: Buscar em todos os arquivos
- **Ctrl + Shift + P**: Paleta de comandos

## Estrutura Completa do Projeto

```
SpiderAPP/
├── .vscode/              # Configurações VSCode
│   ├── settings.json     # Configurações do editor
│   ├── launch.json       # Configurações de debug
│   ├── tasks.json        # Tarefas automatizadas
│   └── extensions.json   # Extensões recomendadas
├── build/                # Projetos compilados
│   ├── android/          # Projeto Android completo
│   ├── final/            # Builds finais (APK/EXE)
│   ├── temp/             # Arquivos temporários
│   └── windows/          # Projeto Windows
├── client/               # Frontend React + TypeScript
│   ├── src/              # Código-fonte
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── hooks/        # React Hooks customizados
│   │   ├── lib/          # Bibliotecas utilitárias
│   │   └── features/     # Features modulares
│   └── public/           # Arquivos públicos
├── server/               # Backend Express + TypeScript
│   ├── db/               # Configuração do banco
│   ├── routes/           # Rotas da API
│   ├── services/         # Serviços (AI, Health)
│   └── features/         # Features do backend
├── shared/               # Código compartilhado
│   └── schema.ts         # Schemas Zod/Drizzle
├── database/             # Configuração do banco de dados
├── scripts/              # Scripts de build e utilitários
│   ├── android/          # Scripts de build Android
│   ├── windows/          # Scripts de build Windows
│   └── utils/            # Utilitários diversos
├── config/               # Configurações gerais
├── docs/                 # Documentação
├── public/               # Assets públicos
├── temp/                 # Arquivos temporários
├── .env                  # Variáveis de ambiente
├── package.json          # Dependências Node.js
├── tsconfig.json         # Configuração TypeScript
├── vite.config.ts        # Configuração Vite
├── tailwind.config.ts    # Configuração Tailwind CSS
├── drizzle.config.ts     # Configuração Drizzle ORM
├── capacitor.config.ts   # Configuração Capacitor (Mobile)
└── SETUP_WINDOWS.md      # Este arquivo
```

## Troubleshooting

### Porta 5000 em uso

Se a porta 5000 estiver ocupada, você pode alterá-la editando o arquivo `server/index.ts` na linha que define `const port = 5000;`

### Erro de conexão com PostgreSQL

Verifique se:
- O PostgreSQL está rodando
- As credenciais no `.env` estão corretas
- O banco de dados foi criado

### Erro ao instalar dependências

Execute como administrador:

```bash
npm install --legacy-peer-deps
```

## Suporte

Para mais informações, consulte a documentação completa em `/docs`
