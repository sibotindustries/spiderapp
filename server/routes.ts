import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import { insertUserSchema, insertCrimeSchema, updateCrimeSchema, insertChatMessageSchema } from "@shared/schema";
import { db } from "./db";
import { generateAIResponse, AIRequestPayload } from "./ai";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);



  // Configure session
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "spider-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 3153600000000 // 100 anos em milissegundos = persistência "infinita"
    },
    store: new SessionStore({ 
      checkPeriod: 86400000, // Mantém período de verificação diário
      // A sessão em si nunca expira devido ao maxAge acima
    }),
  }));

  // Configure passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log("[auth] Tentativa de login para usuário:", username);
      const user = await storage.getUserByUsername(username);

      if (!user) {
        console.log("[auth] Usuário não encontrado:", username);
        return done(null, false, { message: "Usuário não encontrado" });
      }

      // Tentamos validar com PBKDF2 + salt
      try {
        const { validatePassword } = await import('./storage');
        if (validatePassword) {
          const isValid = validatePassword(password, user.passwordSalt, user.password);

          if (isValid) {
            console.log("[auth] Login bem-sucedido com validação hash para usuário:", username);

            // Atualizar timestamp de último login
            try {
              // Registrar login apenas se o método existir
              if (storage.recordLogin) {
                await storage.recordLogin({
                  userId: user.id,
                  ipAddress: '127.0.0.1', // Idealmente, obter do request
                  userAgent: 'API Client', // Idealmente, obter do request
                  status: 'Success' // Status de login bem-sucedido
                });
              }

              // Atualizar último login do usuário se o método existir
              if ('updateUser' in storage) {
                await storage.updateUser({
                  ...user,
                  lastLoginAt: new Date(),
                  lastActiveAt: new Date()
                });
              }
            } catch (updateError) {
              console.error("[auth] Erro ao atualizar dados de login:", updateError);
              // Continuar mesmo com erro na atualização
            }

            return done(null, user);
          }
        }
      } catch (validationError) {
        console.error("[auth] Erro na validação:", validationError);
      }

      // Para compatibilidade com os usuários de teste, manter temporariamente:

      // Autenticação especial para usuário Caio (temporário)
      if (username === "caio" && password === "admin123") {
        console.log("[auth] Login especial aceito para administrador Caio");
        return done(null, user);
      }

      // Autenticação especial para Spider-Man (temporário)
      if (username === "spiderman" && password === "web-slinger") {
        console.log("[auth] Login especial aceito para Spider-Man");
        return done(null, user);
      }

      console.log("[auth] Falha na autenticação para usuário:", username);
      return done(null, false, { message: "Senha inválida" });
    } catch (err) {
      console.error("[auth] Erro durante autenticação:", err);
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google OAuth Strategy (opcional)
  const CALLBACK_URL = 'https://efc38770-40c4-47c3-a6f9-16b478bf5e6e-00-23dxn5xl6n2x8.kirk.replit.dev/api/auth/google/callback';

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("[auth] Configurando Google OAuth Strategy");
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      scope: ['profile', 'email']
    },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
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
        console.log("[auth] Criando novo usuário com Google:", email);

        // Gera uma senha aleatória forte que não será usada
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = crypto.randomUUID().substring(0, 8);
        const { hashPassword } = await import('./storage');
        const hashedPassword = hashPassword(randomPassword, salt);

        try {
          user = await storage.createUser({
            username: email,
            password: hashedPassword,
            passwordSalt: salt,
            displayName: profile.displayName || email.split('@')[0],
            email: email,
            profileImageUrl: profile.photos?.[0]?.value || '',
            userType: 'citizen', // Padrão para novos usuários
            isAdmin: false,
            googleId: profile.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date()
          });

          console.log("[auth] Usuário criado com sucesso via Google:", email);
        } catch (createError) {
          console.error("[auth] Erro ao criar usuário via Google:", createError);
          return done(createError);
        }
      } else {
        // Atualiza os dados do Google para o usuário existente
        user = await storage.updateUser({
          ...user,
          googleId: profile.id,
          profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
          lastLoginAt: new Date(),
          lastActiveAt: new Date()
        });

        console.log("[auth] Usuário existente atualizado com dados do Google:", email);
      }

      // Registra o login
      if (storage.recordLogin) {
        await storage.recordLogin({
          userId: user.id,
          ipAddress: '127.0.0.1', // Idealmente, obter do request
          userAgent: 'Google OAuth', // Idealmente, obter do request
          status: 'Success',
          authMethod: 'google'
        });
      }

      return done(null, user);
    } catch (err) {
      console.error("[auth] Erro na autenticação via Google:", err);
      return done(err);
    }
  }));

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && (req.user as any)?.isAdmin) return next();
    res.status(403).json({ message: "Forbidden" });
  };

  // AUTHROUTES
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userInput = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userInput.username);

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // A verificação de email banido foi movida para o método createUser do DatabaseStorage

      const user = await storage.createUser(userInput);

      // Remove password from response
      const { password, ...userResponse } = user;

      res.status(201).json(userResponse);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    // Remove password from response
    const { password, ...user } = req.user as any;
    res.json(user);
  });

  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    // Remove password from response
    const { password, ...user } = req.user as any;
    res.json(user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Rota para verificação de idade
  app.post("/api/auth/verify-age", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { birthdate } = req.body;

      if (!birthdate) {
        return res.status(400).json({ message: "Data de nascimento é obrigatória" });
      }

      // Verifica se o formato da data está correto
      const birthdateObj = new Date(birthdate);
      if (isNaN(birthdateObj.getTime())) {
        return res.status(400).json({ message: "Data de nascimento inválida" });
      }

      // Verifica a idade usando a função do storage
      const isOldEnough = await storage.verifyUserAge(userId, birthdateObj);

      if (!isOldEnough) {
        return res.status(403).json({ 
          message: "Acesso negado: você precisa ter pelo menos 12 anos para usar este aplicativo",
          ageVerified: true,
          isOldEnough: false
        });
      }

      res.json({ 
        message: "Verificação de idade concluída com sucesso",
        ageVerified: true,
        isOldEnough: true
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Google OAuth Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication, redirect home.
      res.redirect("/");
    }
  );

  app.patch("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const updateData = req.body;

      // Validações básicas
      if (updateData.password && updateData.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Se estiver atualizando a senha, hash ela primeiro
      if (updateData.password) {
        // Importa a função de hash da storage
        const { hashPassword } = await import('./storage');
        // Usa o salt existente ou gera um novo
        const salt = user.passwordSalt || crypto.randomUUID().substring(0, 8);
        // Hash a senha
        updateData.password = hashPassword(updateData.password, salt);
        updateData.passwordSalt = salt;
      }

      // Atualiza os campos fornecidos
      const updatedUser = {
        ...user,
        ...updateData,
        updatedAt: new Date() // Garante que o timestamp de atualização seja definido
      };

      // Atualiza usuário no storage
      await storage.updateUser(updatedUser);

      // Remove senha da resposta
      const { password, ...userResponse } = updatedUser;

      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Rota para administradores alterarem senha de qualquer usuário
  app.post("/api/auth/reset-password", isAdmin, async (req, res) => {
    try {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ message: "userId and newPassword are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Importa a função de hash
      const { hashPassword } = await import('./storage');
      // Usa o salt existente ou gera um novo
      const salt = user.passwordSalt || crypto.randomUUID().substring(0, 8);
      // Hash a nova senha
      const hashedPassword = hashPassword(newPassword, salt);

      // Atualiza os campos do usuário
      const updatedUser = {
        ...user,
        password: hashedPassword,
        passwordSalt: salt,
        forcedPasswordChangeAt: new Date(), // Marca quando a senha foi forçada a mudar
        updatedAt: new Date()
      };

      // Atualiza usuário no storage
      await storage.updateUser(updatedUser);

      // Remove senha da resposta
      const { password, ...userResponse } = updatedUser;

      res.json({ 
        success: true, 
        message: "Password reset successfully", 
        user: userResponse 
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // CRIME ROUTES
  app.get("/api/crimes", async (req, res) => {
    try {
      const crimes = await storage.getAllCrimes();
      res.json(crimes);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.get("/api/crimes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const crime = await storage.getCrimeById(id);

      if (!crime) {
        return res.status(404).json({ message: "Crime not found" });
      }

      res.json(crime);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.post("/api/crimes", isAuthenticated, async (req, res) => {
    try {
      const crimeInput = insertCrimeSchema.parse(req.body);
      const userId = (req.user as any).id;

      const crime = await storage.createCrime(crimeInput, userId);
      res.status(201).json(crime);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.patch("/api/crimes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const crime = await storage.getCrimeById(id);

      if (!crime) {
        return res.status(404).json({ message: "Crime not found" });
      }

      // Only admin or the user who reported the crime can update it
      const userId = (req.user as any).id;
      const isUserAdmin = (req.user as any).isAdmin;

      if (crime.reportedById !== userId && !isUserAdmin) {
        return res.status(403).json({ message: "Not authorized to update this crime" });
      }

      const updateData = updateCrimeSchema.parse({ id, ...req.body });
      const updatedCrime = await storage.updateCrime(updateData);

      res.json(updatedCrime);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/my-crimes", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const crimes = await storage.getCrimesByUser(userId);
      res.json(crimes);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // NOTIFICATION ROUTES
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // CHAT ROUTES
  app.get("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const crimeId = req.query.crimeId ? parseInt(req.query.crimeId as string) : undefined;

      let messages;
      if (crimeId) {
        // Se crimeId foi fornecido, busca mensagens específicas desse crime
        // Você precisará implementar este método na sua interface de storage
        messages = await storage.getChatMessagesByCrime(crimeId);
      } else {
        // Senão, busca todas as mensagens do usuário
        messages = await storage.getChatMessagesByUser(userId);
      }

      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;

      // Verifica se crimeId foi fornecido
      if (!req.body.crimeId) {
        return res.status(400).json({ message: "crimeId is required" });
      }

      // Verifica se o crime existe
      const crime = await storage.getCrimeById(req.body.crimeId);
      if (!crime) {
        return res.status(404).json({ message: "Crime not found" });
      }

      // Verifica se o usuário tem permissão para enviar mensagens neste chat
      // (deve ser o Spider-Man ou o usuário que reportou o crime)
      if (!isAdmin && crime.reportedById !== userId) {
        return res.status(403).json({ 
          message: "You don't have permission to chat about this crime" 
        });
      }

      // Adiciona dados ao objeto da mensagem
      const messageData = {
        ...req.body,
        userId,
        isFromSpiderman: isAdmin
      };

      // Valida com o schema
      const messageInput = insertChatMessageSchema.parse(messageData);

      // Cria a mensagem
      const message = await storage.createChatMessage(messageInput);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // AI ASSISTANT ROUTES
  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const isAdmin = (req.user as any).isAdmin;
      const { messages } = req.body;

      if (!Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array is required" });
      }

      const aiRequestPayload: AIRequestPayload = {
        messages: messages,
        userType: isAdmin ? 'spiderman' : 'citizen'
      };

      const aiResponse = await generateAIResponse(aiRequestPayload);
      res.json({ response: aiResponse });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Error generating AI response" });
    }
  });

  // ===== GAMIFICATION ROUTES =====

  app.get("/api/stats/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      let stats = await storage.getUserStats?.(userId);

      if (!stats && storage.createUserStats) {
        stats = await storage.createUserStats({
          userId,
          level: 1,
          experiencePoints: 0,
          totalReports: 0,
          resolvedReports: 0,
          helpfulReports: 0,
          streak: 0,
          longestStreak: 0,
          reputation: 0,
          rank: "Citizen"
        });
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // XP is now ONLY added through server-verified actions (crime reporting, resolution, etc.)
  // This endpoint has been removed to prevent privilege escalation
  // XP is automatically awarded when users perform legitimate actions

  // ===== ACHIEVEMENT ROUTES =====

  app.get("/api/achievements", async (req, res) => {
    try {
      if (storage.getAllAchievements) {
        const achievements = await storage.getAllAchievements();
        res.json(achievements);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.get("/api/achievements/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      if (storage.getUserAchievements) {
        const userAchievements = await storage.getUserAchievements(userId);
        res.json(userAchievements);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.post("/api/achievements/check", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      if (storage.checkAndUnlockAchievements) {
        const newAchievements = await storage.checkAndUnlockAchievements(userId);
        res.json({ unlocked: newAchievements });
      } else {
        res.json({ unlocked: [] });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // ===== TAG ROUTES =====

  app.get("/api/tags", async (req, res) => {
    try {
      if (storage.getAllTags) {
        const tags = await storage.getAllTags();
        res.json(tags);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.post("/api/tags", isAdmin, async (req, res) => {
    try {
      const { name, color, icon, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }

      if (storage.createTag) {
        const tag = await storage.createTag({ name, color, icon, description });
        res.status(201).json(tag);
      } else {
        res.status(501).json({ message: "Feature not implemented" });
      }
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/crimes/:id/tags", isAuthenticated, async (req, res) => {
    try {
      const crimeId = parseInt(req.params.id);
      const { tagId } = req.body;

      if (!tagId) {
        return res.status(400).json({ message: "Tag ID is required" });
      }

      if (storage.addTagToCrime) {
        const crimeTag = await storage.addTagToCrime(crimeId, tagId);
        res.status(201).json(crimeTag);
      } else {
        res.status(501).json({ message: "Feature not implemented" });
      }
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/crimes/:id/tags", async (req, res) => {
    try {
      const crimeId = parseInt(req.params.id);

      if (storage.getCrimeTags) {
        const tags = await storage.getCrimeTags(crimeId);
        res.json(tags);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // ===== ANALYTICS ROUTES =====

  app.get("/api/analytics/summary", isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      if (storage.getAnalyticsSummary) {
        const summary = await storage.getAnalyticsSummary(start, end);
        res.json(summary);
      } else {
        res.json({ totalEvents: 0, eventsByType: {}, events: [] });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.get("/api/analytics/daily/:date", isAdmin, async (req, res) => {
    try {
      const date = new Date(req.params.date);

      if (storage.getDailyStats) {
        const stats = await storage.getDailyStats(date);
        res.json(stats || {});
      } else {
        res.json({});
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // ===== LEADERBOARD ROUTES =====

  app.get("/api/leaderboard/:period", async (req, res) => {
    try {
      const { period } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!["daily", "weekly", "monthly", "all-time"].includes(period)) {
        return res.status(400).json({ message: "Invalid period" });
      }

      if (storage.getLeaderboard) {
        const leaderboard = await storage.getLeaderboard(period, limit);
        res.json(leaderboard);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // ===== ACTIVITY LOG ROUTES =====

  app.get("/api/activity/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      if (storage.getUserActivity) {
        const activities = await storage.getUserActivity(userId, limit);
        res.json(activities);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // ===== REVIEW ROUTES =====

  app.post("/api/crimes/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const crimeId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { rating, comment, responseTime } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const crime = await storage.getCrimeById(crimeId);
      if (!crime) {
        return res.status(404).json({ message: "Crime not found" });
      }

      if (crime.reportedById !== userId) {
        return res.status(403).json({ message: "You can only review your own crimes" });
      }

      if (storage.createCrimeReview) {
        const review = await storage.createCrimeReview({
          crimeId,
          userId,
          rating,
          comment,
          responseTime
        });
        res.status(201).json(review);
      } else {
        res.status(501).json({ message: "Feature not implemented" });
      }
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/crimes/:id/reviews", async (req, res) => {
    try {
      const crimeId = parseInt(req.params.id);

      if (storage.getCrimeReviews) {
        const reviews = await storage.getCrimeReviews(crimeId);
        res.json(reviews);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // ===== NOTIFICATION PREFERENCES =====

  app.get("/api/preferences/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      if (storage.getNotificationPreferences) {
        let prefs = await storage.getNotificationPreferences(userId);

        if (!prefs && storage.updateNotificationPreferences) {
          prefs = await storage.updateNotificationPreferences(userId, {});
        }

        res.json(prefs);
      } else {
        res.json({});
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  app.patch("/api/preferences/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const updates = req.body;

      if (storage.updateNotificationPreferences) {
        const prefs = await storage.updateNotificationPreferences(userId, updates);
        res.json(prefs);
      } else {
        res.status(501).json({ message: "Feature not implemented" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Rotas para download do APK/EXE
  app.get('/download', (req, res) => {
    res.sendFile('download.html', { root: '.' });
  });

  app.get('/android-download', (req, res) => {
    res.sendFile('public/android-download/index.html', { root: '.' });
  });

  // Sistema anti-hacker removido conforme solicitado

  return httpServer;
}
}