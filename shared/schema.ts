import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import crypto from "crypto";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(), // Immutable UUID for long-term identification
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  passwordSalt: text("password_salt").notNull(), // Salt for password hashing
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  email: text("email").unique(),
  birthdate: date("birthdate"), // Data de nascimento para verificação de idade
  isBanned: boolean("is_banned").default(false).notNull(), // Se o usuário está banido
  banReason: text("ban_reason"), // Razão do banimento
  bannedAt: timestamp("banned_at"), // Quando foi banido
  isAdmin: boolean("is_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(), // Account active status
  location: text("location"),
  lastLoginAt: timestamp("last_login_at"), // Track login activity
  lastActiveAt: timestamp("last_active_at"), // Track user activity
  forcedPasswordChangeAt: timestamp("forced_password_change_at"), // For security policies
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  accountDeactivatedAt: timestamp("account_deactivated_at"), // When account was deactivated
  accountDeactivationReason: text("account_deactivation_reason"), // Why account was deactivated
  dataRetentionDate: date("data_retention_date"), // For GDPR/data retention policies
  googleId: text("google_id").unique(), // ID from Google OAuth
  profileImageUrl: text("profile_image_url"), // Profile image from Google OAuth
  displayName: text("display_name"), // Name from Google OAuth
  userType: text("user_type").default("citizen"), // Type of user: 'citizen' or 'spiderman'
  ageVerified: boolean("age_verified").default(false), // Verificação de idade realizada
  ageVerificationMethod: text("age_verification_method"), // Método usado para verificar a idade
});

export const crimeTypes = [
  "Assault",
  "Robbery",
  "Vandalism",
  "Theft",
  "Drug Activity",
  "Suspicious Activity",
  "Other"
] as const;

export type CrimeType = typeof crimeTypes[number];

export const priorityLevels = ["Low", "Medium", "High"] as const;
export type PriorityLevel = typeof priorityLevels[number];

export const statusTypes = [
  "Pending",
  "In Progress",
  "Spider-Man En Route",
  "Resolved",
  "Cancelled"
] as const;

export type StatusType = typeof statusTypes[number];

export const crimes = pgTable("crimes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  crimeType: text("crime_type").notNull(),
  priorityLevel: text("priority_level").notNull(),
  status: text("status").notNull().default("Pending"),
  reportedById: integer("reported_by_id").notNull().references(() => users.id),
  photos: json("photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  crimeId: integer("crime_id").references(() => crimes.id),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  crimeId: integer("crime_id").notNull().references(() => crimes.id),
  message: text("message").notNull(),
  isFromSpiderman: boolean("is_from_spiderman").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session management for very long-term persistence
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sid: text("sid").notNull().unique(), // Session ID
  userId: integer("user_id").references(() => users.id),
  userUuid: uuid("user_uuid").references(() => users.uuid), // Immutable reference to user
  data: json("data").notNull(), // Session data
  expiresAt: timestamp("expires_at").notNull(), // When session expires
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastExtendedAt: timestamp("last_extended_at").defaultNow().notNull(), // Last time session was extended
  ipAddress: text("ip_address"), // IP address of the session
  userAgent: text("user_agent"), // User agent of the session
  deviceIdentifier: text("device_identifier"), // Unique device identifier
  isValid: boolean("is_valid").default(true).notNull(), // Whether session is valid
});

// Login history for security audit and long term tracking
export const loginHistory = pgTable("login_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userUuid: uuid("user_uuid").references(() => users.uuid),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceIdentifier: text("device_identifier"),
  status: text("status").notNull(), // Success, failure, etc.
  failureReason: text("failure_reason"), // Reason for failure
  geoLocation: json("geo_location"), // Location data based on IP
});

// Device keys for device-based authentication (for 500-year persistence)
export const deviceKeys = pgTable("device_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userUuid: uuid("user_uuid").references(() => users.uuid),
  deviceIdentifier: text("device_identifier").notNull(), // Unique device identifier
  publicKey: text("public_key").notNull(), // Public key for device
  deviceName: text("device_name"), // User-friendly device name
  lastUsedAt: timestamp("last_used_at"), // Last time device was used
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // When device key expires (can be null for non-expiring keys)
  isRevoked: boolean("is_revoked").default(false).notNull(), // Whether key is revoked
  revokedAt: timestamp("revoked_at"), // When key was revoked
  metadata: json("metadata"), // Additional metadata about device
});

// Tabela para rastrear banimentos (verificação de idade)
export const bannedIdentifiers = pgTable("banned_identifiers", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull().unique(), // Email, IP, Device ID, etc
  identifierType: text("identifier_type").notNull(), // "email", "ip", "device", "hwid", "mac"
  reason: text("reason").notNull(), // Por exemplo, "Usuário menor de 12 anos"
  associatedUserIds: json("associated_user_ids").$type<number[]>().default([]), // IDs de usuários associados
  bannedAt: timestamp("banned_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Null para ban permanente
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== SISTEMA ANTI-BYPASS DE BAN AVANÇADO =====

// Device Fingerprints - Armazena HWID, MAC address, IP e outros dados de fingerprinting
export const deviceFingerprints = pgTable("device_fingerprints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  hwid: text("hwid"), // Hardware ID criptografado
  macAddress: text("mac_address"), // MAC Address criptografado
  ipAddress: text("ip_address").notNull(), // IP Address criptografado
  canvasFingerprint: text("canvas_fingerprint"), // Canvas fingerprint
  webglFingerprint: text("webgl_fingerprint"), // WebGL fingerprint
  audioFingerprint: text("audio_fingerprint"), // Audio context fingerprint
  screenResolution: text("screen_resolution"), // Resolução da tela
  timezone: text("timezone"), // Timezone
  language: text("language"), // Idioma do navegador
  platform: text("platform"), // Plataforma (Windows, Linux, etc)
  userAgent: text("user_agent"), // User agent completo
  cpuCores: integer("cpu_cores"), // Número de cores da CPU
  deviceMemory: integer("device_memory"), // Memória do dispositivo em GB
  plugins: json("plugins").$type<string[]>(), // Lista de plugins instalados
  fonts: json("fonts").$type<string[]>(), // Lista de fontes disponíveis
  touchSupport: boolean("touch_support"), // Suporte a touch
  batteryLevel: integer("battery_level"), // Nível de bateria (se disponível)
  geoLocation: json("geo_location"), // Localização geográfica baseada em IP
  isp: text("isp"), // Provedor de internet
  isVpn: boolean("is_vpn").default(false), // Se está usando VPN
  isTor: boolean("is_tor").default(false), // Se está usando Tor
  isProxy: boolean("is_proxy").default(false), // Se está usando proxy
  riskScore: integer("risk_score").default(0), // Pontuação de risco (0-100)
  isBanned: boolean("is_banned").default(false), // Se este dispositivo está banido
  banReason: text("ban_reason"), // Razão do ban do dispositivo
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  timesUsed: integer("times_used").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Security Logs - Log completo de eventos de segurança
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(), // "login_attempt", "ban_bypass_attempt", "brute_force", "sql_injection", "xss_attempt", etc
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"), // Hash do fingerprint completo
  description: text("description").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(), // Dados adicionais do evento
  wasBlocked: boolean("was_blocked").default(false), // Se a ação foi bloqueada
  actionTaken: text("action_taken"), // Ação tomada pelo sistema
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suspicious Activities - Rastreia atividades suspeitas
export const suspiciousActivities = pgTable("suspicious_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(), // "multiple_accounts", "rapid_requests", "unusual_location", etc
  riskLevel: integer("risk_level").default(1).notNull(), // 1-10
  ipAddress: text("ip_address").notNull(),
  deviceFingerprintId: integer("device_fingerprint_id").references(() => deviceFingerprints.id),
  description: text("description").notNull(),
  evidenceData: json("evidence_data").$type<Record<string, any>>(),
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// IP Blacklist - Lista de IPs bloqueados
export const ipBlacklist = pgTable("ip_blacklist", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  reason: text("reason").notNull(),
  blockType: text("block_type").notNull(), // "temporary", "permanent"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  blockedBy: integer("blocked_by").references(() => users.id),
  expiresAt: timestamp("expires_at"),
  attemptCount: integer("attempt_count").default(1).notNull(),
  lastAttempt: timestamp("last_attempt").defaultNow().notNull(),
  associatedUserIds: json("associated_user_ids").$type<number[]>().default([]),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rate Limit Log - Log de rate limiting para detectar ataques
export const rateLimitLog = pgTable("rate_limit_log", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(), // IP, user ID, ou outro identificador
  identifierType: text("identifier_type").notNull(), // "ip", "user", "device"
  endpoint: text("endpoint").notNull(), // Endpoint acessado
  requestCount: integer("request_count").default(1).notNull(),
  windowStart: timestamp("window_start").defaultNow().notNull(),
  windowEnd: timestamp("window_end").notNull(),
  wasThrottled: boolean("was_throttled").default(false),
  wasBlocked: boolean("was_blocked").default(false),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Honeypot Traps - Armadilhas para detectar bots e atacantes
export const honeypotTraps = pgTable("honeypot_traps", {
  id: serial("id").primaryKey(),
  trapType: text("trap_type").notNull(), // "hidden_field", "fake_endpoint", "timing_trap"
  triggeredBy: text("triggered_by").notNull(), // IP ou identificador
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  trapData: json("trap_data").$type<Record<string, any>>(),
  actionTaken: text("action_taken"), // "ip_blocked", "user_flagged", "logged_only"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  crimes: many(crimes),
  notifications: many(notifications),
  chatMessages: many(chatMessages),
  sessions: many(sessions, { relationName: "userSessions" }),
  loginHistory: many(loginHistory, { relationName: "userLoginHistory" }),
  deviceKeys: many(deviceKeys, { relationName: "userDeviceKeys" }),
}));

export const crimesRelations = relations(crimes, ({ one, many }) => ({
  reportedBy: one(users, {
    fields: [crimes.reportedById],
    references: [users.id],
  }),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  crime: one(crimes, {
    fields: [notifications.crimeId],
    references: [crimes.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [chatMessages.toUserId],
    references: [users.id],
  }),
  crime: one(crimes, {
    fields: [chatMessages.crimeId],
    references: [crimes.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
    relationName: "userSessions"
  }),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
    relationName: "userLoginHistory"
  }),
}));

export const deviceKeysRelations = relations(deviceKeys, ({ one }) => ({
  user: one(users, {
    fields: [deviceKeys.userId],
    references: [users.id],
    relationName: "userDeviceKeys"
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  uuid: true,
  createdAt: true,
  updatedAt: true,
  isAdmin: true,
  lastLoginAt: true,
  lastActiveAt: true,
  forcedPasswordChangeAt: true,
  accountDeactivatedAt: true,
  accountDeactivationReason: true,
  dataRetentionDate: true
}).extend({
  passwordSalt: z.string().default(() => crypto.randomUUID().substring(0, 8)),
});

export const insertCrimeSchema = createInsertSchema(crimes).extend({
  crimeType: z.enum(crimeTypes),
  priorityLevel: z.enum(priorityLevels),
  status: z.enum(statusTypes),
  photos: z.array(z.string()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reportedById: true,
  status: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Session schema
export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  lastExtendedAt: true,
  isValid: true,
});

// Login history schema
export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  timestamp: true,
});

// Device keys schema
export const insertDeviceKeySchema = createInsertSchema(deviceKeys).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  isRevoked: true,
  revokedAt: true,
});

// Update schemas
export const updateCrimeSchema = z.object({
  id: z.number(),
  status: z.enum(statusTypes).optional(),
  priorityLevel: z.enum(priorityLevels).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

// Schema para a tabela de identificadores banidos
export const insertBannedIdentifierSchema = createInsertSchema(bannedIdentifiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Relações para tabelas de segurança removidas conforme solicitado

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Crime = typeof crimes.$inferSelect;
export type InsertCrime = z.infer<typeof insertCrimeSchema>;
export type UpdateCrime = z.infer<typeof updateCrimeSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type LoginHistory = typeof loginHistory.$inferSelect;
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;

export type DeviceKey = typeof deviceKeys.$inferSelect;
export type InsertDeviceKey = z.infer<typeof insertDeviceKeySchema>;

export type BannedIdentifier = typeof bannedIdentifiers.$inferSelect;
export type InsertBannedIdentifier = z.infer<typeof insertBannedIdentifierSchema>;

// ===== GAMIFICATION SYSTEM =====

// User Stats for Gamification
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  level: integer("level").default(1).notNull(),
  experiencePoints: integer("experience_points").default(0).notNull(),
  totalReports: integer("total_reports").default(0).notNull(),
  resolvedReports: integer("resolved_reports").default(0).notNull(),
  helpfulReports: integer("helpful_reports").default(0).notNull(),
  streak: integer("streak").default(0).notNull(), // Days in a row reporting
  longestStreak: integer("longest_streak").default(0).notNull(),
  reputation: integer("reputation").default(0).notNull(),
  rank: text("rank").default("Citizen"),
  lastReportDate: timestamp("last_report_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Achievement Types
export const achievementTypes = [
  "First Report",
  "Reporter",
  "Crime Fighter",
  "Hero",
  "Legend",
  "Streak Master",
  "Photo Pro",
  "Detailed Reporter",
  "Fast Responder",
  "Community Guardian"
] as const;

export type AchievementType = typeof achievementTypes[number];

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  type: text("type").notNull(),
  requirement: integer("requirement").notNull(), // Number needed to unlock
  xpReward: integer("xp_reward").default(0).notNull(),
  badgeColor: text("badge_color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Achievements (many-to-many)
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  progress: integer("progress").default(0),
});

// ===== TAGS SYSTEM =====

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").default("#6366f1"),
  icon: text("icon"),
  description: text("description"),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crimeTags = pgTable("crime_tags", {
  id: serial("id").primaryKey(),
  crimeId: integer("crime_id").notNull().references(() => crimes.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== ANALYTICS SYSTEM =====

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // "crime_reported", "crime_resolved", etc.
  eventData: json("event_data").$type<Record<string, any>>(),
  userId: integer("user_id").references(() => users.id),
  crimeId: integer("crime_id").references(() => crimes.id),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
});

// Daily Statistics
export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  totalCrimes: integer("total_crimes").default(0).notNull(),
  resolvedCrimes: integer("resolved_crimes").default(0).notNull(),
  newUsers: integer("new_users").default(0).notNull(),
  activeUsers: integer("active_users").default(0).notNull(),
  avgResponseTime: integer("avg_response_time").default(0), // in minutes
  topCrimeType: text("top_crime_type"),
  topLocation: text("top_location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== ACTIVITY LOG =====

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // "report_crime", "update_status", etc.
  entityType: text("entity_type"), // "crime", "user", etc.
  entityId: integer("entity_id"),
  description: text("description").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ===== REVIEWS & RATINGS =====

export const crimeReviews = pgTable("crime_reviews", {
  id: serial("id").primaryKey(),
  crimeId: integer("crime_id").notNull().references(() => crimes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  helpful: boolean("helpful").default(false),
  responseTime: integer("response_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== LEADERBOARD =====

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  period: text("period").notNull(), // "daily", "weekly", "monthly", "all-time"
  score: integer("score").notNull(),
  rank: integer("rank").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== NOTIFICATIONS ENHANCED =====

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  smsEnabled: boolean("sms_enabled").default(false).notNull(),
  crimeUpdates: boolean("crime_updates").default(true).notNull(),
  nearbyAlerts: boolean("nearby_alerts").default(true).notNull(),
  achievementUnlocks: boolean("achievement_unlocks").default(true).notNull(),
  weeklyDigest: boolean("weekly_digest").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== RELATIONS =====

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  crimeTags: many(crimeTags),
}));

export const crimeTagsRelations = relations(crimeTags, ({ one }) => ({
  crime: one(crimes, {
    fields: [crimeTags.crimeId],
    references: [crimes.id],
  }),
  tag: one(tags, {
    fields: [crimeTags.tagId],
    references: [tags.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  user: one(users, {
    fields: [analytics.userId],
    references: [users.id],
  }),
  crime: one(crimes, {
    fields: [analytics.crimeId],
    references: [crimes.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const crimeReviewsRelations = relations(crimeReviews, ({ one }) => ({
  crime: one(crimes, {
    fields: [crimeReviews.crimeId],
    references: [crimes.id],
  }),
  user: one(users, {
    fields: [crimeReviews.userId],
    references: [users.id],
  }),
}));

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  user: one(users, {
    fields: [leaderboardEntries.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Security System Relations
export const deviceFingerprintsRelations = relations(deviceFingerprints, ({ one }) => ({
  user: one(users, {
    fields: [deviceFingerprints.userId],
    references: [users.id],
  }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  user: one(users, {
    fields: [securityLogs.userId],
    references: [users.id],
  }),
}));

export const suspiciousActivitiesRelations = relations(suspiciousActivities, ({ one }) => ({
  user: one(users, {
    fields: [suspiciousActivities.userId],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [suspiciousActivities.resolvedBy],
    references: [users.id],
  }),
  deviceFingerprint: one(deviceFingerprints, {
    fields: [suspiciousActivities.deviceFingerprintId],
    references: [deviceFingerprints.id],
  }),
}));

export const ipBlacklistRelations = relations(ipBlacklist, ({ one }) => ({
  blockedByUser: one(users, {
    fields: [ipBlacklist.blockedBy],
    references: [users.id],
  }),
}));

// ===== INSERT SCHEMAS =====

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertCrimeTagSchema = createInsertSchema(crimeTags).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

export const insertCrimeReviewSchema = createInsertSchema(crimeReviews).omit({
  id: true,
  createdAt: true,
});

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Security System Insert Schemas
export const insertDeviceFingerprintSchema = createInsertSchema(deviceFingerprints).omit({
  id: true,
  firstSeen: true,
  lastSeen: true,
  timesUsed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  timestamp: true,
  createdAt: true,
});

export const insertSuspiciousActivitySchema = createInsertSchema(suspiciousActivities).omit({
  id: true,
  timestamp: true,
  createdAt: true,
  isResolved: true,
  resolvedAt: true,
});

export const insertIpBlacklistSchema = createInsertSchema(ipBlacklist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  attemptCount: true,
  lastAttempt: true,
});

export const insertRateLimitLogSchema = createInsertSchema(rateLimitLog).omit({
  id: true,
  createdAt: true,
  requestCount: true,
  windowStart: true,
  wasThrottled: true,
  wasBlocked: true,
});

export const insertHoneypotTrapSchema = createInsertSchema(honeypotTraps).omit({
  id: true,
  timestamp: true,
  createdAt: true,
});

// ===== TYPES =====

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type CrimeTag = typeof crimeTags.$inferSelect;
export type InsertCrimeTag = z.infer<typeof insertCrimeTagSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type CrimeReview = typeof crimeReviews.$inferSelect;
export type InsertCrimeReview = z.infer<typeof insertCrimeReviewSchema>;

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

// Security System Types
export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type InsertDeviceFingerprint = z.infer<typeof insertDeviceFingerprintSchema>;

export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;

export type SuspiciousActivity = typeof suspiciousActivities.$inferSelect;
export type InsertSuspiciousActivity = z.infer<typeof insertSuspiciousActivitySchema>;

export type IpBlacklist = typeof ipBlacklist.$inferSelect;
export type InsertIpBlacklist = z.infer<typeof insertIpBlacklistSchema>;

export type RateLimitLog = typeof rateLimitLog.$inferSelect;
export type InsertRateLimitLog = z.infer<typeof insertRateLimitLogSchema>;

export type HoneypotTrap = typeof honeypotTraps.$inferSelect;
export type InsertHoneypotTrap = z.infer<typeof insertHoneypotTrapSchema>;
