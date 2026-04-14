import { pgTable, text, integer, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').unique(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),          // null if Google auth
  googleId: text('google_id').unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  totalScore: integer('total_score').default(0),
  gamesPlayed: integer('games_played').default(0),
  isEmailVerified: boolean('is_email_verified').default(false),
  emailNotificationsEnabled: boolean('email_notifications_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const authCodes = pgTable('auth_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  code: text('code').notNull(),
  type: text('type').notNull(), // 'email_verification', 'password_reset'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  modeId: text('mode_id').notNull(),            // 'kiyamet' | 'referans' | 'sikayet' | 'suc' | 'terfi'
  characterType: text('character_type').notNull(), // 'angry' | 'cold' | 'manipulative' | 'passive'
  round1Score: integer('round1_score'),
  round2Score: integer('round2_score'),
  round3Score: integer('round3_score'),
  finalScore: integer('final_score'),
  outcome: text('outcome'),                     // 'success' | 'failure' | 'partial'
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const roundMessages = pgTable('round_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => gameSessions.id).notNull(),
  round: integer('round').notNull(),
  userMessage: text('user_message').notNull(),
  aiResponse: text('ai_response').notNull(),
  roundScore: integer('round_score').notNull(),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const leaderboard = pgTable('leaderboard', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  modeId: text('mode_id').notNull(),
  bestScore: integer('best_score').notNull(),
  rank: integer('rank'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// V2 SCHEMA ADDITIONS

export const customScenarios = pgTable('custom_scenarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  icon: text('icon').notNull(),
  characterName: text('character_name').notNull(),
  characterTitle: text('character_title').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  isPublished: boolean('is_published').default(false),
  playCount: integer('play_count').default(0),
  avgScore: integer('avg_score'),
  likeCount: integer('like_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scenarioLikes = pgTable('scenario_likes', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  scenarioId: uuid('scenario_id').references(() => customScenarios.id).notNull(),
});

export const tournaments = pgTable('tournaments', {
  id: uuid('id').primaryKey().defaultRandom(),
  weekStart: timestamp('week_start').notNull(),
  weekEnd: timestamp('week_end').notNull(),
  modeId: text('mode_id'),        // null -> tüm modlar
  winnerId: uuid('winner_id').references(() => users.id),
  prizeDescription: text('prize_description'),
  status: text('status').default('active'), // active | completed
});

export const tournamentScores = pgTable('tournament_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  weeklyScore: integer('weekly_score').default(0),
  gamesThisWeek: integer('games_this_week').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const badges = pgTable('badges', {
  id: text('id').primaryKey(),        // 'ice_cold' | 'closer_3' vb.
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),       // emoji or SVG path
  rarity: text('rarity').notNull(),   // 'common' | 'rare' | 'legendary'
});

export const userBadges = pgTable('user_badges', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  badgeId: text('badge_id').references(() => badges.id).notNull(),
  earnedAt: timestamp('earned_at').defaultNow(),
});

