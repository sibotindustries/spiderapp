# Documentação de Autenticação Google OAuth

## Visão Geral

Este documento descreve a implementação da autenticação via Google OAuth no Sistema de Autenticação de Longa Duração (500 Anos). Esta funcionalidade permite que usuários façam login utilizando suas contas Google, adicionando uma camada adicional de segurança e conveniência.

## Configuração no Google Cloud Console

Para configurar o Google OAuth, é necessário seguir os seguintes passos no Google Cloud Console:

1. Acesse https://console.cloud.google.com/apis/credentials
2. Selecione ou crie um projeto
3. Em "Credenciais", clique em "Criar credenciais" e selecione "ID de cliente OAuth"
4. Selecione "Aplicativo da Web" como tipo de aplicativo
5. Defina as seguintes URLs:
   - **Origens JavaScript autorizadas**: `https://efc38770-40c4-47c3-a6f9-16b478bf5e6e-00-23dxn5xl6n2x8.kirk.replit.dev`
   - **URIs de redirecionamento autorizados**: `https://efc38770-40c4-47c3-a6f9-16b478bf5e6e-00-23dxn5xl6n2x8.kirk.replit.dev/api/auth/google/callback`
6. Anote o Client ID e Client Secret gerados

## Configuração do Servidor

### Dependências

A autenticação Google OAuth utiliza os seguintes pacotes:
- `passport`: Framework de autenticação para Node.js
- `passport-google-oauth20`: Estratégia de autenticação específica para Google OAuth 2.0

### Variáveis de Ambiente

O sistema requer duas variáveis de ambiente para funcionar:
- `GOOGLE_CLIENT_ID`: O ID do cliente gerado no Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: O segredo do cliente gerado no Google Cloud Console

### Implementação no Servidor

A estratégia de autenticação Google é configurada no arquivo `server/routes.ts`:

```typescript
// Google OAuth Strategy
const CALLBACK_URL = 'https://efc38770-40c4-47c3-a6f9-16b478bf5e6e-00-23dxn5xl6n2x8.kirk.replit.dev/api/auth/google/callback';
  
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: CALLBACK_URL,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("[auth] Tentativa de login via Google:", profile.displayName);
    
    // Procura o usuário pelo email do Google
    const email = profile.emails?.[0]?.value;
    
    if (!email) {
      console.log("[auth] Email não fornecido pelo Google");
      return done(null, false, { message: "Email não fornecido pelo Google" });
    }
    
    // Tenta encontrar o usuário pelo email ou nome de usuário
    let user = await storage.getUserByUsername(email);
    
    // Se o usuário não existe, cria um novo
    if (!user) {
      // Lógica para criar um novo usuário
      // ...
    } else {
      // Atualiza os dados do Google para o usuário existente
      // ...
    }
    
    // Registra o login
    // ...
    
    return done(null, user);
  } catch (err) {
    console.error("[auth] Erro na autenticação via Google:", err);
    return done(err);
  }
}));
```

### Rotas de Autenticação

As seguintes rotas são configuradas para o fluxo de autenticação Google:

```typescript
// Inicia o fluxo de autenticação Google
app.get("/api/auth/google", 
  passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback para receber o resultado da autenticação
app.get("/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Redireciona para a página inicial após sucesso
    res.redirect("/");
  }
);
```

## Implementação no Frontend

### Botão de Login com Google

Na página de login (`client/src/pages/login.tsx`), adicionamos um botão para autenticação com Google:

```tsx
<Button
  type="button"
  variant="outline"
  className="w-full mt-4 bg-white text-gray-800 border border-gray-300"
  onClick={handleGoogleLogin}
>
  <FcGoogle className="mr-2 h-5 w-5" />
  Sign in with Google
</Button>
```

### Função para Iniciar o Login Google

A função que inicia o fluxo de autenticação Google:

```typescript
const handleGoogleLogin = () => {
  window.location.href = "/api/auth/google";
};
```

## Modelo de Dados

Para suportar autenticação via Google, adicionamos os seguintes campos à tabela `users`:

```sql
ALTER TABLE users 
  ADD COLUMN google_id TEXT UNIQUE,
  ADD COLUMN profile_image_url TEXT,
  ADD COLUMN display_name TEXT,
  ADD COLUMN user_type TEXT DEFAULT 'citizen';
```

Além disso, adicionamos um campo `auth_method` à tabela `login_history`:

```sql
ALTER TABLE login_history
  ADD COLUMN auth_method TEXT;
```

## Fluxo de Autenticação

1. Usuário clica no botão "Entrar com Google" na página de login
2. O navegador redireciona para a URL `/api/auth/google`
3. Passport redireciona o usuário para a página de consentimento do Google
4. Usuário faz login e autoriza o aplicativo
5. Google redireciona para o callback URL com um código de autorização
6. Servidor troca o código por tokens de acesso e atualização
7. Servidor extrai informações do perfil do usuário
8. Sistema verifica se já existe um usuário com o email fornecido:
   - Se existe: atualiza as informações do usuário com dados do Google
   - Se não existe: cria um novo usuário com os dados do Google
9. Sistema autentica o usuário e redireciona para a página inicial

## Diagnóstico de Problemas

### Erro: redirect_uri_mismatch

Este erro ocorre quando o URL de callback configurado no Google Cloud Console não corresponde ao URL usado pelo aplicativo.

**Solução**: Verifique se o URL de callback no código (`CALLBACK_URL`) corresponde exatamente ao URI de redirecionamento configurado no Google Cloud Console.

### Erro: invalid_client

Este erro ocorre quando as credenciais do cliente (ID do cliente e segredo) não são reconhecidas pelo Google.

**Solução**: Verifique se as variáveis de ambiente `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` contêm os valores corretos e atualizados do Google Cloud Console.

## Considerações de Segurança

1. **Proteção de Credenciais**: As credenciais OAuth do Google são informações sensíveis e devem ser armazenadas como segredos/variáveis de ambiente, nunca no código-fonte.

2. **Validação de Email**: É importante verificar se o Google forneceu um email antes de prosseguir com a autenticação.

3. **Associação de Contas**: O sistema permite associar contas Google a usuários existentes, mantendo o histórico e dados do usuário.

4. **Rastreamento de Método de Autenticação**: O sistema registra explicitamente qual método de autenticação foi usado (local ou Google) para auditoria e segurança.

## Conclusão

A autenticação via Google OAuth complementa o Sistema de Autenticação de Longa Duração, fornecendo um método alternativo e seguro para usuários acessarem o sistema. Isso aumenta a usabilidade e a segurança geral, permitindo que usuários utilizem suas contas Google existentes para acessar o aplicativo.