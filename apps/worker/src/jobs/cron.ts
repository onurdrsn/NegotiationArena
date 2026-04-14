import { Env } from '../worker-env';
import { getDb } from '../db/client';
import { tournaments, tournamentScores, users } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export const scheduledHandler = async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
  // CRON triggers every Monday at 00:00 (0 0 * * MON)
  // Close the active tournament
  const db = getDb(env.NEON_DATABASE_URL);
  
  const [activeTournament] = await db.select().from(tournaments).where(eq(tournaments.status, 'active'));

  if (activeTournament) {
    // Determine winner
    const topScore = await db.select()
      .from(tournamentScores)
      .where(eq(tournamentScores.tournamentId, activeTournament.id))
      .orderBy(desc(tournamentScores.weeklyScore))
      .limit(1);

    const winnerId = topScore.length > 0 ? topScore[0].userId : null;

    // End tournament
    await db.update(tournaments)
      .set({ status: 'completed', winnerId })
      .where(eq(tournaments.id, activeTournament.id));

    // Send emails if winnerId
    if (winnerId) {
      // Mock Resend Email: Notify all subscribed users that week is over
      // const subscribers = await db.select().from(users).where(eq(users.emailNotificationsEnabled, true));
      // fetch('https://api.resend.com/emails', { ... })
    }
  }

  // Create new tournament for the week
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(tournaments).values({
    weekStart: now,
    weekEnd: nextWeek,
    status: 'active',
    prizeDescription: 'Altın Müzakereci Rozeti',
  });
};
