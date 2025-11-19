import { log } from "./vite";
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { db } from './db';
import * as crypto from 'crypto';
import {
  User, InsertUser,
  Crime, InsertCrime, UpdateCrime,
  Notification, InsertNotification,
  ChatMessage, InsertChatMessage,
  Session, InsertSession,
  LoginHistory, InsertLoginHistory,
  DeviceKey, InsertDeviceKey,
  BannedIdentifier, InsertBannedIdentifier,
  UserStats, InsertUserStats,
  Achievement, InsertAchievement,
  UserAchievement, InsertUserAchievement,
  Tag, InsertTag,
  CrimeTag, InsertCrimeTag,
  Analytics, InsertAnalytics,
  DailyStats, InsertDailyStats,
  ActivityLog, InsertActivityLog,
  CrimeReview, InsertCrimeReview,
  LeaderboardEntry, InsertLeaderboardEntry,
  NotificationPreferences, InsertNotificationPreferences,
  users, crimes, notifications, chatMessages, sessions, loginHistory, deviceKeys, bannedIdentifiers,
  userStats, achievements, userAchievements, tags, crimeTags, analytics, dailyStats,
  activityLog, crimeReviews, leaderboardEntries, notificationPreferences,
  CrimeType, PriorityLevel, StatusType,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(user: User): Promise<User>;
  
  // Crime methods
  getAllCrimes(): Promise<Crime[]>;
  getCrimesByUser(userId: number): Promise<Crime[]>;
  getCrimeById(id: number): Promise<Crime | undefined>;
  createCrime(crime: InsertCrime, userId: number): Promise<Crime>;
  updateCrime(crime: UpdateCrime): Promise<Crime | undefined>;
  
  // Notification methods
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Chat methods
  getChatMessagesByUser(userId: number): Promise<ChatMessage[]>;
  getChatMessagesByCrime(crimeId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Session and authentication methods (for 500-year persistence)
  createSession?(session: InsertSession): Promise<Session>;
  getSession?(sid: string): Promise<Session | undefined>;
  extendSession?(sid: string): Promise<Session | undefined>;
  invalidateSession?(sid: string): Promise<boolean>;
  getSessions?(userId: number): Promise<Session[]>;
  
  // Login history methods (for 500-year persistence)
  recordLogin?(loginData: InsertLoginHistory): Promise<LoginHistory>;
  getLoginHistory?(userId: number): Promise<LoginHistory[]>;
  
  // Device key methods (for 500-year persistence)
  createDeviceKey?(deviceKey: InsertDeviceKey): Promise<DeviceKey>;
  getDeviceKey?(deviceIdentifier: string): Promise<DeviceKey | undefined>;
  revokeDeviceKey?(id: number): Promise<DeviceKey | undefined>;
  getDeviceKeys?(userId: number): Promise<DeviceKey[]>;
  
  // Métodos de verificação de idade e banimento
  isUserBanned?(userId: number): Promise<boolean>;
  isIdentifierBanned?(identifier: string, type: string): Promise<boolean>;
  banUser?(userId: number, reason: string): Promise<User>;
  banIdentifier?(identifier: string, type: string, reason: string, associatedUserIds?: number[]): Promise<BannedIdentifier>;
  verifyUserAge?(userId: number, birthdate: Date): Promise<boolean>;
  calculateAge?(birthdate: Date): number;
  
  // Gamification methods
  getUserStats?(userId: number): Promise<UserStats | undefined>;
  createUserStats?(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats?(userId: number, updates: Partial<UserStats>): Promise<UserStats>;
  addExperience?(userId: number, xp: number): Promise<UserStats>;
  updateStreak?(userId: number): Promise<UserStats>;
  
  // Achievement methods
  getAllAchievements?(): Promise<Achievement[]>;
  getUserAchievements?(userId: number): Promise<UserAchievement[]>;
  unlockAchievement?(userId: number, achievementId: number): Promise<UserAchievement>;
  checkAndUnlockAchievements?(userId: number): Promise<UserAchievement[]>;
  
  // Tag methods
  getAllTags?(): Promise<Tag[]>;
  createTag?(tag: InsertTag): Promise<Tag>;
  addTagToCrime?(crimeId: number, tagId: number): Promise<CrimeTag>;
  getCrimeTags?(crimeId: number): Promise<Tag[]>;
  
  // Analytics methods
  logAnalyticsEvent?(event: InsertAnalytics): Promise<Analytics>;
  getDailyStats?(date: Date): Promise<DailyStats | undefined>;
  updateDailyStats?(): Promise<void>;
  getAnalyticsSummary?(startDate: Date, endDate: Date): Promise<any>;
  
  // Activity Log methods
  logActivity?(activity: InsertActivityLog): Promise<ActivityLog>;
  getUserActivity?(userId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Review methods
  createCrimeReview?(review: InsertCrimeReview): Promise<CrimeReview>;
  getCrimeReviews?(crimeId: number): Promise<CrimeReview[]>;
  
  // Leaderboard methods
  getLeaderboard?(period: string, limit?: number): Promise<LeaderboardEntry[]>;
  updateLeaderboard?(period: string): Promise<void>;
  
  // Notification preferences
  getNotificationPreferences?(userId: number): Promise<NotificationPreferences | undefined>;
  updateNotificationPreferences?(userId: number, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
}

// Utility functions for secure password handling
export function hashPassword(password: string, salt: string): string {
  // Use PBKDF2 with high iteration count for very slow password hashing
  // This makes brute force attacks extremely difficult
  // With this level of security, even quantum computers in 500 years would struggle
  return crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
}

function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validatePassword(password: string, salt: string, hashedPassword: string): boolean {
  console.log('[validatePassword] Iniciando validação para senha com salt:', salt);
  console.log('[validatePassword] Tentativa de validação com senha de comprimento:', password.length);
  
  // Gera o hash para a senha fornecida
  const calculatedHash = hashPassword(password, salt);
  
  // Para depuração - mostrar os primeiros 20 caracteres de ambos os hashes
  console.log('[validatePassword] Hash armazenado (20 chars):', hashedPassword.substring(0, 20));
  console.log('[validatePassword] Hash calculado (20 chars):', calculatedHash.substring(0, 20));
  
  // Verificação de igualdade
  const isEqual = calculatedHash === hashedPassword;
  console.log('[validatePassword] Resultado da comparação:', isEqual);
  
  return isEqual;
}

// Long-term database storage implementation with 500-year persistence capabilities
export class DatabaseStorage implements IStorage {
  // Constructor establishes database connection
  constructor() {
    log("PostgreSQL database storage initialized for ultra-long-term persistence", "database-storage");
    this.initAdminUser().catch(err => console.error("Error initializing admin user:", err));
  }
  
  // Métodos de verificação de idade e banimento
  async isUserBanned(userId: number): Promise<boolean> {
    try {
      // Primeiro verificamos se o usuário existe no sistema
      const user = await this.getUser(userId);
      if (!user) return false;
      
      // Como a coluna isBanned ainda não existe no banco de dados,
      // vamos verificar se o usuário está na tabela bannedIdentifiers
      const result = await db
        .select()
        .from(bannedIdentifiers)
        .where(
          or(
            sql`${bannedIdentifiers.associatedUserIds} @> ARRAY[${userId}]::INTEGER[]`,
            and(
              eq(bannedIdentifiers.identifier, userId.toString()), 
              eq(bannedIdentifiers.identifierType, "userId")
            )
          )
        );
      
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if user is banned:", error);
      return false;
    }
  }
  
  async isIdentifierBanned(identifier: string, type: string): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(bannedIdentifiers)
        .where(
          and(
            eq(bannedIdentifiers.identifier, identifier),
            eq(bannedIdentifiers.identifierType, type)
          )
        );
        
      if (result.length === 0) return false;
      
      const bannedIdentifier = result[0];
      
      // Se tem data de expiração e já passou, não está mais banido
      if (bannedIdentifier.expiresAt && new Date() > new Date(bannedIdentifier.expiresAt)) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error checking if identifier is banned:", error);
      return false;
    }
  }
  
  async banUser(userId: number, reason: string): Promise<User> {
    try {
      // Primeiro, obtenha o usuário
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Como as colunas isBanned, banReason e bannedAt não existem ainda,
      // vamos marcar o usuário na tabela de banned_identifiers
      await db
        .insert(bannedIdentifiers)
        .values({
          identifier: userId.toString(),
          identifierType: "userId",
          reason: reason,
          associatedUserIds: [userId],
          bannedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // Atualiza apenas a data de atualização do usuário
      const [updatedUser] = await db
        .update(users)
        .set({
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser || user;
    } catch (error) {
      console.error("Error banning user:", error);
      throw error;
    }
  }
  
  async banIdentifier(identifier: string, type: string, reason: string, associatedUserIds: number[] = []): Promise<BannedIdentifier> {
    try {
      // Verifica se já existe um banimento para esse identificador
      const existingBan = await db
        .select()
        .from(bannedIdentifiers)
        .where(
          and(
            eq(bannedIdentifiers.identifier, identifier),
            eq(bannedIdentifiers.identifierType, type)
          )
        );
        
      if (existingBan.length > 0) {
        // Atualiza o banimento existente
        const [updatedBan] = await db
          .update(bannedIdentifiers)
          .set({
            reason,
            associatedUserIds,
            updatedAt: new Date()
          })
          .where(eq(bannedIdentifiers.id, existingBan[0].id))
          .returning();
          
        return updatedBan;
      }
      
      // Cria um novo banimento
      const [newBan] = await db
        .insert(bannedIdentifiers)
        .values({
          identifier,
          identifierType: type,
          reason,
          associatedUserIds,
          bannedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      return newBan;
    } catch (error) {
      console.error("Error banning identifier:", error);
      throw error;
    }
  }
  
  // Verifica a idade do usuário com base na data de nascimento
  calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const m = today.getMonth() - birthdate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  // Verifica e atualiza o status de verificação de idade do usuário
  async verifyUserAge(userId: number, birthdate: Date): Promise<boolean> {
    try {
      const age = this.calculateAge(birthdate);
      const isOldEnough = age >= 12; // 12 anos ou mais
      
      // Atualiza o usuário com a data de nascimento e status de verificação
      // Não podemos atualizar diretamente a coluna birthdate pois ela ainda não existe no banco
      // Em vez disso, vamos apenas atualizar os campos que sabemos que existem
      await db
        .update(users)
        .set({
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      // Se for menor de 12 anos, bane o usuário
      if (!isOldEnough) {
        await this.banUser(userId, "Usuário menor de 12 anos");
        
        // Obter o usuário para extrair identificadores
        const user = await this.getUser(userId);
        if (user) {
          // Bane os identificadores associados
          if (user.email) {
            await this.banIdentifier(user.email, "email", "Usuário menor de 12 anos", [userId]);
          }
        }
      }
      
      return isOldEnough;
    } catch (error) {
      console.error("Error verifying user age:", error);
      return false;
    }
  }
  
  // Initialize admin user if it doesn't exist
  private async initAdminUser() {
    try {
      const existingAdmin = await this.getUserByUsername("spiderman");
      if (!existingAdmin) {
        const salt = crypto.randomUUID().substring(0, 8);
        const hashedPassword = hashPassword("web-slinger", salt);
        
        await db.insert(users).values({
          username: "spiderman",
          uuid: crypto.randomUUID(),
          password: hashedPassword,
          passwordSalt: salt,
          location: "São Paulo, SP - Brasil",
          isActive: true,
          isAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        log("Admin user created successfully", "database-storage");
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      throw error;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Selecionando apenas colunas que sabemos que existem no banco de dados
      const result = await db.select({
        id: users.id,
        uuid: users.uuid,
        username: users.username,
        password: users.password,
        passwordSalt: users.passwordSalt,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        email: users.email,
        isAdmin: users.isAdmin,
        isActive: users.isActive,
        location: users.location,
        lastLoginAt: users.lastLoginAt,
        lastActiveAt: users.lastActiveAt,
        forcedPasswordChangeAt: users.forcedPasswordChangeAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        accountDeactivatedAt: users.accountDeactivatedAt,
        accountDeactivationReason: users.accountDeactivationReason,
        dataRetentionDate: users.dataRetentionDate,
        googleId: users.googleId,
        profileImageUrl: users.profileImageUrl,
        displayName: users.displayName,
        userType: users.userType
      }).from(users).where(eq(users.id, id));
      
      return result.length > 0 ? result[0] as User : undefined;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Selecionando apenas colunas que sabemos que existem no banco de dados
      const result = await db.select({
        id: users.id,
        uuid: users.uuid,
        username: users.username,
        password: users.password,
        passwordSalt: users.passwordSalt,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        email: users.email,
        isAdmin: users.isAdmin,
        isActive: users.isActive,
        location: users.location,
        lastLoginAt: users.lastLoginAt,
        lastActiveAt: users.lastActiveAt,
        forcedPasswordChangeAt: users.forcedPasswordChangeAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        accountDeactivatedAt: users.accountDeactivatedAt,
        accountDeactivationReason: users.accountDeactivationReason,
        dataRetentionDate: users.dataRetentionDate,
        googleId: users.googleId,
        profileImageUrl: users.profileImageUrl,
        displayName: users.displayName,
        userType: users.userType
      }).from(users).where(eq(users.username, username));
      
      return result.length > 0 ? result[0] as User : undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const now = new Date();
      // Hash the password if it's not already hashed
      let password = insertUser.password;
      let salt = insertUser.passwordSalt;
      
      if (!salt) {
        salt = crypto.randomUUID().substring(0, 8);
      }
      
      // Check if we need to hash the password (if it's not 128 chars, it's not hashed)
      if (password.length !== 128) {
        password = hashPassword(password, salt);
      }
      
      // Comentamos a verificação abaixo temporariamente até a implementação completa do schema
      /*
      // Verificar se o email está banido (verificação de idade)
      if (insertUser.email) {
        const isEmailBanned = await this.isIdentifierBanned(insertUser.email, "email");
        if (isEmailBanned) {
          throw new Error("Este email não pode ser usado para registrar uma conta");
        }
      }
      */
      
      // Inserir apenas campos que sabemos que existem no banco de dados atual
      const [user] = await db
        .insert(users)
        .values({
          username: insertUser.username,
          uuid: crypto.randomUUID(),
          password: password,
          passwordSalt: salt,
          email: insertUser.email || null,
          isAdmin: false,
          isActive: true,
          location: insertUser.location || null,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(user: User): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...user,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`User with ID ${user.id} not found`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Crime methods
  async getAllCrimes(): Promise<Crime[]> {
    try {
      return await db
        .select()
        .from(crimes)
        .orderBy(desc(crimes.createdAt));
    } catch (error) {
      console.error("Error getting all crimes:", error);
      throw error;
    }
  }

  async getCrimesByUser(userId: number): Promise<Crime[]> {
    try {
      return await db
        .select()
        .from(crimes)
        .where(eq(crimes.reportedById, userId))
        .orderBy(desc(crimes.createdAt));
    } catch (error) {
      console.error("Error getting crimes by user:", error);
      throw error;
    }
  }

  async getCrimeById(id: number): Promise<Crime | undefined> {
    try {
      const result = await db
        .select()
        .from(crimes)
        .where(eq(crimes.id, id));
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting crime by ID:", error);
      throw error;
    }
  }

  async createCrime(insertCrime: InsertCrime, userId: number): Promise<Crime> {
    try {
      const now = new Date();
      
      // Garantir que os tipos estejam corretos e adequados ao schema
      const crimeData = {
        ...insertCrime,
        crimeType: insertCrime.crimeType as CrimeType,
        priorityLevel: insertCrime.priorityLevel as PriorityLevel,
        photos: insertCrime.photos || []
      };
      
      const [newCrime] = await db
        .insert(crimes)
        .values({
          ...crimeData,
          reportedById: userId,
          status: "Pending" as StatusType,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // Create notification for user
      await this.createNotification({
        userId,
        crimeId: newCrime.id,
        message: `Your crime report "${newCrime.title}" has been submitted.`,
      });
      
      // Notify admin
      const adminUser = await this.getUserByUsername("spiderman");
      if (adminUser) {
        await this.createNotification({
          userId: adminUser.id,
          crimeId: newCrime.id,
          message: `New crime reported: ${newCrime.title} (${newCrime.crimeType}) at ${newCrime.location}`
        });
      }
      
      // GAMIFICATION: Update user stats
      try {
        let stats = await this.getUserStats(userId);
        
        if (!stats) {
          stats = await this.createUserStats({
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
        
        // Add XP for reporting
        const baseXP = 50; // Base XP for reporting a crime
        let bonusXP = 0;
        
        // Bonus XP for detailed reports
        if (insertCrime.photos && insertCrime.photos.length > 0) {
          bonusXP += 20;
        }
        if (insertCrime.description && insertCrime.description.length > 100) {
          bonusXP += 10;
        }
        
        await this.addExperience(userId, baseXP + bonusXP);
        
        // Update streak
        await this.updateStreak(userId);
        
        // Increment total reports
        await this.updateUserStats(userId, {
          totalReports: stats.totalReports + 1
        });
        
        // Check and unlock achievements
        await this.checkAndUnlockAchievements(userId);
        
        // Log analytics event
        if (this.logAnalyticsEvent) {
          await this.logAnalyticsEvent({
            eventType: "crime_reported",
            userId,
            crimeId: newCrime.id,
            location: newCrime.location,
            eventData: {
              crimeType: newCrime.crimeType,
              priorityLevel: newCrime.priorityLevel,
              xpAwarded: baseXP + bonusXP
            }
          });
        }
        
        // Log activity
        if (this.logActivity) {
          await this.logActivity({
            userId,
            action: "report_crime",
            entityType: "crime",
            entityId: newCrime.id,
            description: `Reported crime: ${newCrime.title}`,
            metadata: {
              crimeType: newCrime.crimeType,
              priorityLevel: newCrime.priorityLevel
            }
          });
        }
      } catch (gamificationError) {
        console.error("Error updating gamification stats:", gamificationError);
        // Don't throw - crime was already created successfully
      }
      
      return newCrime;
    } catch (error) {
      console.error("Error creating crime:", error);
      throw error;
    }
  }

  async updateCrime(updateData: UpdateCrime): Promise<Crime | undefined> {
    try {
      const existingCrime = await this.getCrimeById(updateData.id);
      if (!existingCrime) return undefined;
      
      const [updatedCrime] = await db
        .update(crimes)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(crimes.id, updateData.id))
        .returning();
      
      if (!updatedCrime) return undefined;
      
      // Create notification about status change if status changed
      if (updateData.status && updateData.status !== existingCrime.status) {
        await this.createNotification({
          userId: existingCrime.reportedById,
          crimeId: existingCrime.id,
          message: `Your crime report "${existingCrime.title}" is now ${updateData.status}.`,
        });
        
        // GAMIFICATION: Reward for resolved crimes
        if (updateData.status === "Resolved") {
          try {
            const stats = await this.getUserStats(existingCrime.reportedById);
            
            if (stats) {
              // Award XP for crime resolution
              await this.addExperience(existingCrime.reportedById, 100);
              
              // Update resolved reports count
              await this.updateUserStats(existingCrime.reportedById, {
                resolvedReports: stats.resolvedReports + 1,
                reputation: stats.reputation + 10
              });
              
              // Check for new achievements
              await this.checkAndUnlockAchievements(existingCrime.reportedById);
              
              // Log analytics
              if (this.logAnalyticsEvent) {
                await this.logAnalyticsEvent({
                  eventType: "crime_resolved",
                  userId: existingCrime.reportedById,
                  crimeId: existingCrime.id,
                  location: existingCrime.location,
                  eventData: {
                    crimeType: existingCrime.crimeType,
                    xpAwarded: 100
                  }
                });
              }
              
              // Log activity
              if (this.logActivity) {
                await this.logActivity({
                  userId: existingCrime.reportedById,
                  action: "crime_resolved",
                  entityType: "crime",
                  entityId: existingCrime.id,
                  description: `Crime resolved: ${existingCrime.title}`,
                  metadata: {
                    crimeType: existingCrime.crimeType
                  }
                });
              }
            }
          } catch (gamificationError) {
            console.error("Error updating gamification stats on resolution:", gamificationError);
          }
        }
      }
      
      return updatedCrime;
    } catch (error) {
      console.error("Error updating crime:", error);
      throw error;
    }
  }

  // Notification methods
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error("Error getting notifications by user:", error);
      throw error;
    }
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    try {
      const [newNotification] = await db
        .insert(notifications)
        .values({
          ...insertNotification,
          crimeId: insertNotification.crimeId || null,
          read: false,
          createdAt: new Date()
        })
        .returning();
      
      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    try {
      const [updatedNotification] = await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id))
        .returning();
      
      return updatedNotification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
  
  // Chat methods
  async getChatMessagesByUser(userId: number): Promise<ChatMessage[]> {
    try {
      return await db
        .select()
        .from(chatMessages)
        .where(or(
          eq(chatMessages.userId, userId),
          eq(chatMessages.toUserId, userId)
        ))
        .orderBy(chatMessages.createdAt);
    } catch (error) {
      console.error("Error getting chat messages by user:", error);
      throw error;
    }
  }
  
  async getChatMessagesByCrime(crimeId: number): Promise<ChatMessage[]> {
    try {
      return await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.crimeId, crimeId))
        .orderBy(chatMessages.createdAt);
    } catch (error) {
      console.error("Error getting chat messages by crime:", error);
      throw error;
    }
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    try {
      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          ...insertMessage,
          createdAt: new Date()
        })
        .returning();
      
      // Busca informações do crime para personalizar a notificação
      const crime = await this.getCrimeById(insertMessage.crimeId);
      
      // Create notification for the receiving user
      await this.createNotification({
        userId: insertMessage.toUserId,
        crimeId: insertMessage.crimeId,
        message: `Nova mensagem sobre o caso "${crime?.title || 'Não identificado'}"`,
      });
      
      return newMessage;
    } catch (error) {
      console.error("Error creating chat message:", error);
      throw error;
    }
  }
  
  // Session management methods for long-term persistence
  async createSession(sessionData: InsertSession): Promise<Session> {
    try {
      const now = new Date();
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(now.getFullYear() + 1);
      
      const [newSession] = await db
        .insert(sessions)
        .values({
          ...sessionData,
          createdAt: now,
          lastExtendedAt: now,
          expiresAt: sessionData.expiresAt || oneYearFromNow,
          isValid: true
        })
        .returning();
      
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }
  
  async getSession(sid: string): Promise<Session | undefined> {
    try {
      const result = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.sid, sid),
          eq(sessions.isValid, true)
        ));
      
      if (result.length === 0) return undefined;
      
      const session = result[0];
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateSession(sid);
        return undefined;
      }
      
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      throw error;
    }
  }
  
  async extendSession(sid: string): Promise<Session | undefined> {
    try {
      const session = await this.getSession(sid);
      if (!session) return undefined;
      
      const now = new Date();
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(now.getFullYear() + 1);
      
      const [updatedSession] = await db
        .update(sessions)
        .set({
          lastExtendedAt: now,
          expiresAt: oneYearFromNow
        })
        .where(eq(sessions.sid, sid))
        .returning();
      
      return updatedSession;
    } catch (error) {
      console.error("Error extending session:", error);
      throw error;
    }
  }
  
  async invalidateSession(sid: string): Promise<boolean> {
    try {
      await db
        .update(sessions)
        .set({ isValid: false })
        .where(eq(sessions.sid, sid));
      
      return true;
    } catch (error) {
      console.error("Error invalidating session:", error);
      return false;
    }
  }
  
  async getSessions(userId: number): Promise<Session[]> {
    try {
      return await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.userId, userId),
          eq(sessions.isValid, true)
        ))
        .orderBy(desc(sessions.lastExtendedAt));
    } catch (error) {
      console.error("Error getting user sessions:", error);
      throw error;
    }
  }
  
  // Login history methods for comprehensive security auditing
  async recordLogin(loginData: InsertLoginHistory): Promise<LoginHistory> {
    try {
      const [record] = await db
        .insert(loginHistory)
        .values({
          ...loginData,
          timestamp: new Date()
        })
        .returning();
      
      return record;
    } catch (error) {
      console.error("Error recording login:", error);
      throw error;
    }
  }
  
  async getLoginHistory(userId: number): Promise<LoginHistory[]> {
    try {
      return await db
        .select()
        .from(loginHistory)
        .where(eq(loginHistory.userId, userId))
        .orderBy(desc(loginHistory.timestamp));
    } catch (error) {
      console.error("Error getting login history:", error);
      throw error;
    }
  }
  
  // Device key methods for long-term device authentication
  async createDeviceKey(deviceKeyData: InsertDeviceKey): Promise<DeviceKey> {
    try {
      const [deviceKey] = await db
        .insert(deviceKeys)
        .values({
          ...deviceKeyData,
          createdAt: new Date(),
          isRevoked: false
        })
        .returning();
      
      return deviceKey;
    } catch (error) {
      console.error("Error creating device key:", error);
      throw error;
    }
  }
  
  async getDeviceKey(deviceIdentifier: string): Promise<DeviceKey | undefined> {
    try {
      const result = await db
        .select()
        .from(deviceKeys)
        .where(and(
          eq(deviceKeys.deviceIdentifier, deviceIdentifier),
          eq(deviceKeys.isRevoked, false)
        ));
      
      if (result.length === 0) return undefined;
      
      // Update last used timestamp
      const [deviceKey] = await db
        .update(deviceKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(deviceKeys.id, result[0].id))
        .returning();
      
      return deviceKey;
    } catch (error) {
      console.error("Error getting device key:", error);
      throw error;
    }
  }
  
  async revokeDeviceKey(id: number): Promise<DeviceKey | undefined> {
    try {
      const [deviceKey] = await db
        .update(deviceKeys)
        .set({
          isRevoked: true,
          revokedAt: new Date()
        })
        .where(eq(deviceKeys.id, id))
        .returning();
      
      return deviceKey;
    } catch (error) {
      console.error("Error revoking device key:", error);
      throw error;
    }
  }
  
  async getDeviceKeys(userId: number): Promise<DeviceKey[]> {
    try {
      return await db
        .select()
        .from(deviceKeys)
        .where(and(
          eq(deviceKeys.userId, userId),
          eq(deviceKeys.isRevoked, false)
        ))
        .orderBy(desc(deviceKeys.lastUsedAt));
    } catch (error) {
      console.error("Error getting device keys:", error);
      throw error;
    }
  }
  
  // ===== GAMIFICATION METHODS =====
  
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    try {
      const result = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId));
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }
  
  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    try {
      const [newStats] = await db
        .insert(userStats)
        .values({
          ...stats,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newStats;
    } catch (error) {
      console.error("Error creating user stats:", error);
      throw error;
    }
  }
  
  async updateUserStats(userId: number, updates: Partial<UserStats>): Promise<UserStats> {
    try {
      const [updated] = await db
        .update(userStats)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId))
        .returning();
      
      if (!updated) {
        throw new Error(`User stats not found for user ${userId}`);
      }
      
      return updated;
    } catch (error) {
      console.error("Error updating user stats:", error);
      throw error;
    }
  }
  
  async addExperience(userId: number, xp: number): Promise<UserStats> {
    try {
      let stats = await this.getUserStats(userId);
      
      if (!stats) {
        stats = await this.createUserStats({
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
      
      const newXP = stats.experiencePoints + xp;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      let newRank = stats.rank;
      if (newLevel >= 50) newRank = "Legend";
      else if (newLevel >= 30) newRank = "Hero";
      else if (newLevel >= 15) newRank = "Crime Fighter";
      else if (newLevel >= 5) newRank = "Reporter";
      
      return await this.updateUserStats(userId, {
        experiencePoints: newXP,
        level: newLevel,
        rank: newRank
      });
    } catch (error) {
      console.error("Error adding experience:", error);
      throw error;
    }
  }
  
  async updateStreak(userId: number): Promise<UserStats> {
    try {
      let stats = await this.getUserStats(userId);
      
      if (!stats) {
        stats = await this.createUserStats({
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
      
      const today = new Date();
      const lastReport = stats.lastReportDate ? new Date(stats.lastReportDate) : null;
      
      let newStreak = stats.streak;
      
      if (lastReport) {
        const daysDiff = Math.floor((today.getTime() - lastReport.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          newStreak = stats.streak + 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      
      const newLongestStreak = Math.max(newStreak, stats.longestStreak);
      
      return await this.updateUserStats(userId, {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastReportDate: today
      });
    } catch (error) {
      console.error("Error updating streak:", error);
      throw error;
    }
  }
  
  // ===== ACHIEVEMENT METHODS =====
  
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      return await db.select().from(achievements);
    } catch (error) {
      console.error("Error getting achievements:", error);
      throw error;
    }
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    try {
      return await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.unlockedAt));
    } catch (error) {
      console.error("Error getting user achievements:", error);
      throw error;
    }
  }
  
  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    try {
      const existing = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        ));
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      const [unlocked] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          unlockedAt: new Date(),
          progress: 100
        })
        .returning();
      
      const achievement = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, achievementId));
      
      if (achievement.length > 0 && achievement[0].xpReward > 0) {
        await this.addExperience(userId, achievement[0].xpReward);
      }
      
      await this.createNotification({
        userId,
        message: `Achievement Unlocked: ${achievement[0]?.name || 'New Achievement'}!`,
      });
      
      return unlocked;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      throw error;
    }
  }
  
  async checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]> {
    try {
      const stats = await this.getUserStats(userId);
      if (!stats) return [];
      
      const allAchievements = await this.getAllAchievements();
      const userAchs = await this.getUserAchievements(userId);
      const unlockedIds = new Set(userAchs.map(a => a.achievementId));
      
      const newlyUnlocked: UserAchievement[] = [];
      
      for (const ach of allAchievements) {
        if (unlockedIds.has(ach.id)) continue;
        
        let shouldUnlock = false;
        
        switch (ach.type) {
          case "First Report":
            shouldUnlock = stats.totalReports >= 1;
            break;
          case "Reporter":
            shouldUnlock = stats.totalReports >= ach.requirement;
            break;
          case "Crime Fighter":
            shouldUnlock = stats.resolvedReports >= ach.requirement;
            break;
          case "Hero":
            shouldUnlock = stats.level >= ach.requirement;
            break;
          case "Streak Master":
            shouldUnlock = stats.longestStreak >= ach.requirement;
            break;
        }
        
        if (shouldUnlock) {
          const unlocked = await this.unlockAchievement(userId, ach.id);
          newlyUnlocked.push(unlocked);
        }
      }
      
      return newlyUnlocked;
    } catch (error) {
      console.error("Error checking achievements:", error);
      throw error;
    }
  }
  
  // ===== TAG METHODS =====
  
  async getAllTags(): Promise<Tag[]> {
    try {
      return await db
        .select()
        .from(tags)
        .orderBy(desc(tags.usageCount));
    } catch (error) {
      console.error("Error getting tags:", error);
      throw error;
    }
  }
  
  async createTag(tag: InsertTag): Promise<Tag> {
    try {
      const [newTag] = await db
        .insert(tags)
        .values({
          ...tag,
          createdAt: new Date()
        })
        .returning();
      
      return newTag;
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  }
  
  async addTagToCrime(crimeId: number, tagId: number): Promise<CrimeTag> {
    try {
      const [crimeTag] = await db
        .insert(crimeTags)
        .values({
          crimeId,
          tagId,
          createdAt: new Date()
        })
        .returning();
      
      await db
        .update(tags)
        .set({
          usageCount: sql`${tags.usageCount} + 1`
        })
        .where(eq(tags.id, tagId));
      
      return crimeTag;
    } catch (error) {
      console.error("Error adding tag to crime:", error);
      throw error;
    }
  }
  
  async getCrimeTags(crimeId: number): Promise<Tag[]> {
    try {
      const result = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
          icon: tags.icon,
          description: tags.description,
          usageCount: tags.usageCount,
          createdAt: tags.createdAt
        })
        .from(crimeTags)
        .innerJoin(tags, eq(crimeTags.tagId, tags.id))
        .where(eq(crimeTags.crimeId, crimeId));
      
      return result;
    } catch (error) {
      console.error("Error getting crime tags:", error);
      throw error;
    }
  }
  
  // ===== ANALYTICS METHODS =====
  
  async logAnalyticsEvent(event: InsertAnalytics): Promise<Analytics> {
    try {
      const [newEvent] = await db
        .insert(analytics)
        .values({
          ...event,
          timestamp: new Date()
        })
        .returning();
      
      return newEvent;
    } catch (error) {
      console.error("Error logging analytics event:", error);
      throw error;
    }
  }
  
  async getDailyStats(date: Date): Promise<DailyStats | undefined> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const result = await db
        .select()
        .from(dailyStats)
        .where(eq(dailyStats.date, dateStr));
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting daily stats:", error);
      throw error;
    }
  }
  
  async updateDailyStats(): Promise<void> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const allCrimes = await this.getAllCrimes();
      const todayCrimes = allCrimes.filter(c => 
        new Date(c.createdAt).toISOString().split('T')[0] === todayStr
      );
      
      const resolvedToday = todayCrimes.filter(c => c.status === "Resolved");
      
      const crimeTypeCount: Record<string, number> = {};
      todayCrimes.forEach(c => {
        crimeTypeCount[c.crimeType] = (crimeTypeCount[c.crimeType] || 0) + 1;
      });
      
      const topCrimeType = Object.entries(crimeTypeCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      
      await db
        .insert(dailyStats)
        .values({
          date: todayStr,
          totalCrimes: todayCrimes.length,
          resolvedCrimes: resolvedToday.length,
          newUsers: 0,
          activeUsers: 0,
          avgResponseTime: 0,
          topCrimeType,
          topLocation: null,
          createdAt: new Date()
        })
        .onConflictDoUpdate({
          target: dailyStats.date,
          set: {
            totalCrimes: todayCrimes.length,
            resolvedCrimes: resolvedToday.length,
            topCrimeType
          }
        });
    } catch (error) {
      console.error("Error updating daily stats:", error);
      throw error;
    }
  }
  
  async getAnalyticsSummary(startDate: Date, endDate: Date): Promise<any> {
    try {
      const events = await db
        .select()
        .from(analytics)
        .where(and(
          sql`${analytics.timestamp} >= ${startDate}`,
          sql`${analytics.timestamp} <= ${endDate}`
        ));
      
      return {
        totalEvents: events.length,
        eventsByType: events.reduce((acc: any, e) => {
          acc[e.eventType] = (acc[e.eventType] || 0) + 1;
          return acc;
        }, {}),
        events: events.slice(0, 100)
      };
    } catch (error) {
      console.error("Error getting analytics summary:", error);
      throw error;
    }
  }
  
  // ===== ACTIVITY LOG METHODS =====
  
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    try {
      const [newActivity] = await db
        .insert(activityLog)
        .values({
          ...activity,
          timestamp: new Date()
        })
        .returning();
      
      return newActivity;
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  }
  
  async getUserActivity(userId: number, limit: number = 50): Promise<ActivityLog[]> {
    try {
      return await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.userId, userId))
        .orderBy(desc(activityLog.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("Error getting user activity:", error);
      throw error;
    }
  }
  
  // ===== REVIEW METHODS =====
  
  async createCrimeReview(review: InsertCrimeReview): Promise<CrimeReview> {
    try {
      const [newReview] = await db
        .insert(crimeReviews)
        .values({
          ...review,
          createdAt: new Date()
        })
        .returning();
      
      return newReview;
    } catch (error) {
      console.error("Error creating crime review:", error);
      throw error;
    }
  }
  
  async getCrimeReviews(crimeId: number): Promise<CrimeReview[]> {
    try {
      return await db
        .select()
        .from(crimeReviews)
        .where(eq(crimeReviews.crimeId, crimeId))
        .orderBy(desc(crimeReviews.createdAt));
    } catch (error) {
      console.error("Error getting crime reviews:", error);
      throw error;
    }
  }
  
  // ===== LEADERBOARD METHODS =====
  
  async getLeaderboard(period: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      return await db
        .select()
        .from(leaderboardEntries)
        .where(eq(leaderboardEntries.period, period))
        .orderBy(leaderboardEntries.rank)
        .limit(limit);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }
  
  async updateLeaderboard(period: string): Promise<void> {
    try {
      const allStats = await db.select().from(userStats);
      
      const sorted = allStats.sort((a, b) => {
        if (period === "all-time") {
          return b.experiencePoints - a.experiencePoints;
        }
        return b.totalReports - a.totalReports;
      });
      
      const today = new Date();
      const periodStart = today.toISOString().split('T')[0];
      const periodEnd = today.toISOString().split('T')[0];
      
      for (let i = 0; i < sorted.length; i++) {
        await db
          .insert(leaderboardEntries)
          .values({
            userId: sorted[i].userId,
            period,
            score: sorted[i].experiencePoints,
            rank: i + 1,
            periodStart,
            periodEnd,
            createdAt: new Date()
          })
          .onConflictDoUpdate({
            target: [leaderboardEntries.userId, leaderboardEntries.period],
            set: {
              score: sorted[i].experiencePoints,
              rank: i + 1
            }
          });
      }
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      throw error;
    }
  }
  
  // ===== NOTIFICATION PREFERENCES =====
  
  async getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined> {
    try {
      const result = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      throw error;
    }
  }
  
  async updateNotificationPreferences(userId: number, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      let existing = await this.getNotificationPreferences(userId);
      
      if (!existing) {
        const [created] = await db
          .insert(notificationPreferences)
          .values({
            userId,
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            crimeUpdates: true,
            nearbyAlerts: true,
            achievementUnlocks: true,
            weeklyDigest: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        existing = created;
      }
      
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          ...prefs,
          updatedAt: new Date()
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  }
}

// Export the database storage implementation for ultra-long-term persistence
export const storage = new DatabaseStorage();
