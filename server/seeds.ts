import { db } from './db';
import { achievements, tags } from '@shared/schema';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed Achievements
    const defaultAchievements = [
      {
        name: "First Report",
        description: "Submit your first crime report",
        icon: "🎯",
        category: "reporting",
        xpReward: 50,
        badgeUrl: null,
        requirement: { type: "totalReports", value: 1 },
        isSecret: false
      },
      {
        name: "Vigilant Citizen",
        description: "Submit 10 crime reports",
        icon: "👮",
        category: "reporting",
        xpReward: 100,
        badgeUrl: null,
        requirement: { type: "totalReports", value: 10 },
        isSecret: false
      },
      {
        name: "Crime Fighter",
        description: "Submit 50 crime reports",
        icon: "🦸",
        category: "reporting",
        xpReward: 250,
        badgeUrl: null,
        requirement: { type: "totalReports", value: 50 },
        isSecret: false
      },
      {
        name: "Spider-Sense",
        description: "Submit 100 crime reports",
        icon: "🕷️",
        category: "reporting",
        xpReward: 500,
        badgeUrl: null,
        requirement: { type: "totalReports", value: 100 },
        isSecret: false
      },
      {
        name: "Problem Solver",
        description: "Have 5 of your reports resolved",
        icon: "✅",
        category: "resolution",
        xpReward: 150,
        badgeUrl: null,
        requirement: { type: "resolvedReports", value: 5 },
        isSecret: false
      },
      {
        name: "Justice Seeker",
        description: "Have 25 of your reports resolved",
        icon: "⚖️",
        category: "resolution",
        xpReward: 300,
        badgeUrl: null,
        requirement: { type: "resolvedReports", value: 25 },
        isSecret: false
      },
      {
        name: "Dedicated Guardian",
        description: "Maintain a 7-day reporting streak",
        icon: "🔥",
        category: "streak",
        xpReward: 200,
        badgeUrl: null,
        requirement: { type: "streak", value: 7 },
        isSecret: false
      },
      {
        name: "Unstoppable",
        description: "Maintain a 30-day reporting streak",
        icon: "⚡",
        category: "streak",
        xpReward: 500,
        badgeUrl: null,
        requirement: { type: "streak", value: 30 },
        isSecret: false
      },
      {
        name: "Rising Star",
        description: "Reach level 5",
        icon: "⭐",
        category: "level",
        xpReward: 100,
        badgeUrl: null,
        requirement: { type: "level", value: 5 },
        isSecret: false
      },
      {
        name: "Elite Hero",
        description: "Reach level 10",
        icon: "💫",
        category: "level",
        xpReward: 300,
        badgeUrl: null,
        requirement: { type: "level", value: 10 },
        isSecret: false
      },
      {
        name: "Legendary",
        description: "Reach level 25",
        icon: "👑",
        category: "level",
        xpReward: 1000,
        badgeUrl: null,
        requirement: { type: "level", value: 25 },
        isSecret: false
      },
      {
        name: "Helpful Reporter",
        description: "Have 10 helpful reports",
        icon: "💪",
        category: "quality",
        xpReward: 150,
        badgeUrl: null,
        requirement: { type: "helpfulReports", value: 10 },
        isSecret: false
      },
      {
        name: "Trusted Source",
        description: "Gain 500 reputation points",
        icon: "🛡️",
        category: "reputation",
        xpReward: 250,
        badgeUrl: null,
        requirement: { type: "reputation", value: 500 },
        isSecret: false
      },
      {
        name: "Secret: The Web-Slinger",
        description: "A mysterious achievement...",
        icon: "🕸️",
        category: "secret",
        xpReward: 1000,
        badgeUrl: null,
        requirement: { type: "resolvedReports", value: 100 },
        isSecret: true
      }
    ];

    console.log('📝 Seeding achievements...');
    for (const achievement of defaultAchievements) {
      await db.insert(achievements).values(achievement).onConflictDoNothing();
    }
    console.log(`✅ Seeded ${defaultAchievements.length} achievements`);

    // Seed Tags
    const defaultTags = [
      { name: "Urgent", color: "#EF4444", icon: "🚨", description: "Requires immediate attention" },
      { name: "Violent Crime", color: "#DC2626", icon: "⚠️", description: "Involves violence or threat" },
      { name: "Property Crime", color: "#F59E0B", icon: "🏠", description: "Theft or property damage" },
      { name: "Drug Related", color: "#8B5CF6", icon: "💊", description: "Involves illegal substances" },
      { name: "Gang Activity", color: "#7C3AED", icon: "👥", description: "Gang-related crime" },
      { name: "Suspicious Activity", color: "#3B82F6", icon: "👀", description: "Unusual or suspicious behavior" },
      { name: "Traffic Violation", color: "#10B981", icon: "🚦", description: "Traffic-related incidents" },
      { name: "Vandalism", color: "#F97316", icon: "🎨", description: "Property defacement or damage" },
      { name: "Noise Complaint", color: "#6366F1", icon: "🔊", description: "Excessive noise disturbance" },
      { name: "Public Safety", color: "#EC4899", icon: "🛡️", description: "Concerns public safety" },
      { name: "Repeat Offense", color: "#EF4444", icon: "🔁", description: "Multiple reports at this location" },
      { name: "Resolved", color: "#22C55E", icon: "✅", description: "Successfully resolved" }
    ];

    console.log('🏷️ Seeding tags...');
    for (const tag of defaultTags) {
      await db.insert(tags).values(tag).onConflictDoNothing();
    }
    console.log(`✅ Seeded ${defaultTags.length} tags`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
