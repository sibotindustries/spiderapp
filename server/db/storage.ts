import { log } from "./vite";
import { eq, and, desc, or } from 'drizzle-orm';
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
  users, crimes, notifications, chatMessages, sessions, loginHistory, deviceKeys,
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
      const result = await db.select().from(users).where(eq(users.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result.length > 0 ? result[0] : undefined;
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
      
      const [user] = await db.insert(users).values({
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
      }).returning();
      
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
}

// Export the database storage implementation for ultra-long-term persistence
export const storage = new DatabaseStorage();
