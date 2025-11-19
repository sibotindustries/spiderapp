
# SpiderAPP - Projeto VSCode para Windows

## 🎯 Sobre este Pacote

Este é o projeto SpiderAPP completo configurado para desenvolvimento no VSCode em Windows.

## 📋 O que está incluído

- ✅ Código-fonte completo (Frontend + Backend)
- ✅ Configurações VSCode otimizadas
- ✅ Extensões recomendadas
- ✅ Scripts de build e desenvolvimento
- ✅ Documentação completa
- ✅ Arquivo .env de exemplo

## 🚀 Início Rápido

### 1. Pré-requisitos

Instale os seguintes programas:

- **Node.js 20+**: https://nodejs.org/
- **PostgreSQL 16**: https://www.postgresql.org/download/windows/
- **Git**: https://git-scm.com/download/win
- **VSCode**: https://code.visualstudio.com/

### 2. Configuração

```bash
# 1. Extrair o ZIP
# 2. Abrir pasta no VSCode
# 3. Instalar extensões recomendadas (VSCode irá sugerir)

# 4. Instalar dependências
npm install

# 5. Configurar .env (ver SETUP_WINDOWS.md)

# 6. Inicializar banco de dados
npm run db:push

# 7. Iniciar servidor
npm run dev
```

### 3. Acessar

Abra http://localhost:5000 no navegador

**Credenciais padrão:**
- Usuário: `spiderman`
- Senha: `web-slinger`

## 📚 Documentação

Leia `SETUP_WINDOWS.md` para instruções detalhadas de instalação e configuração.

## 🛠️ Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Compila para produção
npm run start    # Inicia servidor de produção
npm run check    # Verifica tipos TypeScript
npm run db:push  # Atualiza schema do banco
```

## 📁 Estrutura

```
SpiderAPP/
├── .vscode/          # Configurações VSCode
├── client/           # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── public/
├── server/           # Backend (Express + TypeScript)
│   ├── db/
│   ├── routes/
│   └── services/
├── shared/           # Código compartilhado
├── database/         # Configuração do banco
└── docs/             # Documentação
```

## 🔧 Recursos VSCode

### Extensões Instaladas

- ESLint - Linting de código
- Prettier - Formatação automática
- Tailwind CSS IntelliSense
- TypeScript
- React Snippets

### Atalhos Úteis

- `Ctrl + \`` - Terminal integrado
- `F5` - Debug
- `Ctrl + Shift + B` - Build
- `Ctrl + P` - Buscar arquivo
- `Ctrl + Shift + F` - Buscar no projeto

## ❓ Troubleshooting

### PostgreSQL não conecta

Verifique:
1. PostgreSQL está rodando
2. Credenciais no `.env` corretas
3. Banco `spiderapp` foi criado

### Porta 5000 ocupada

Edite `server/index.ts` e mude `const port = 5000;`

### Erro ao instalar dependências

```bash
npm install --legacy-peer-deps
```

## 📞 Suporte

Consulte a documentação em `/docs` ou o arquivo `SETUP_WINDOWS.md`

## 📄 Licença

Proprietary - SpiderAPP Technologies
