import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';
import { RegisterSchema, LoginSchema, VerifyEmailSchema, RequestResetSchema, ResetPasswordSchema, CompleteGoogleRegistrationSchema } from '@arena/shared';
import { getDb } from '../db/client';
import { users, authCodes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../lib/hash';
import { createSessionToken } from '../lib/jwt';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimit';
import { Env } from '../worker-env';
import { sendEmail, generateVerificationCode, getVerificationEmailHtml, getResetPasswordHtml } from '../lib/email';
import type { ZodSchema } from 'zod';

const auth = new Hono<{ Bindings: Env }>();

// Wrapper that returns the first Zod issue message as a user-friendly { error } JSON response
const validate = <T extends ZodSchema>(schema: T) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue?.message ?? 'Geçersiz istek';
      return c.json({ error: message }, 400);
    }
  });

// Cookie helper: dev uses Lax+insecure so HTTP cross-port works; prod uses Strict+secure
function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string, viteUrl: string) {
  const isDev = viteUrl.includes('localhost');
  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: !isDev,
    sameSite: isDev ? 'Lax' : 'Strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

auth.post('/register', registerRateLimiter, validate(RegisterSchema), async (c) => {
  const data = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);
  
  const existing = await db.select().from(users).where(eq(users.email, data.email));
  if (existing.length > 0) {
    return c.json({ error: 'Bu email zaten kullanılıyor' }, 400);
  }

  const hashedPassword = await hashPassword(data.password);
  
  const [user] = await db.insert(users).values({
    email: data.email,
    username: data.username,
    displayName: data.displayName,
    passwordHash: hashedPassword,
    isEmailVerified: false
  }).returning();

  // Create verification code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  
  await db.insert(authCodes).values({
    userId: user.id,
    code,
    type: 'email_verification',
    expiresAt,
  });

  // Send email
  await sendEmail(
    c.env.RESEND_API_KEY as any,
    user.email,
    'Negotiation Arena - Kimlik Doğrulama Kodu',
    getVerificationEmailHtml(code)
  );

  return c.json({ success: true, requireVerification: true, email: user.email });
});

auth.post('/verify-email', validate(VerifyEmailSchema), async (c) => {
  const { email, code } = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return c.json({ error: 'Kullanıcı bulunamadı' }, 404);

  const [validCode] = await db.select().from(authCodes)
    .where(and(eq(authCodes.userId, user.id), eq(authCodes.code, code), eq(authCodes.type, 'email_verification')));

  if (!validCode) return c.json({ error: 'Geçersiz veya süresi dolmuş kod' }, 400);
  if (new Date() > validCode.expiresAt) return c.json({ error: 'Kodun süresi dolmuş' }, 400);

  // Mark as verified
  await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, user.id));
  await db.delete(authCodes).where(eq(authCodes.id, validCode.id));

  // Auto-login after verification
  const token = await createSessionToken({ sub: user.id, email: user.email, displayName: user.displayName }, c.env.JWT_SECRET);
  setSessionCookie(c, token, c.env.VITE_URL);

  return c.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
});

auth.post('/resend-code', registerRateLimiter, validate(RequestResetSchema), async (c) => {
  const { email } = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return c.json({ success: true }); // Avoid leaking user existence

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  // Clean up old verification codes
  await db.delete(authCodes).where(and(eq(authCodes.userId, user.id), eq(authCodes.type, 'email_verification')));

  await db.insert(authCodes).values({
    userId: user.id,
    code,
    type: 'email_verification',
    expiresAt,
  });

  await sendEmail(
    c.env.RESEND_API_KEY as any,
    user.email,
    'Negotiation Arena - Yeni Kimlik Doğrulama Kodu',
    getVerificationEmailHtml(code)
  );

  return c.json({ success: true });
});

auth.post('/login', loginRateLimiter, validate(LoginSchema), async (c) => {
  const data = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);

  const [user] = await db.select().from(users).where(eq(users.email, data.email));
  if (!user || (!user.passwordHash && !user.googleId)) {
    return c.json({ error: 'Geçersiz bilgiler' }, 401);
  }

  // If google user tries to login via password
  if (!user.passwordHash) {
    return c.json({ error: 'Lütfen Google ile giriş yapın' }, 400);
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return c.json({ error: 'Geçersiz bilgiler' }, 401);
  }

  if (!user.isEmailVerified) {
    // Re-trigger code sending
    const code = generateVerificationCode();
    await db.delete(authCodes).where(and(eq(authCodes.userId, user.id), eq(authCodes.type, 'email_verification')));
    await db.insert(authCodes).values({
      userId: user.id, code, type: 'email_verification', expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });
    // Fire and forget email
    c.executionCtx.waitUntil(sendEmail(c.env.RESEND_API_KEY as any, user.email, 'Negotiation Arena - Kimlik Doğrulama Kodu', getVerificationEmailHtml(code)));
    
    return c.json({ error: 'E-posta henüz doğrulanmadı. Yeni kod gönderildi.', requireVerification: true }, 403);
  }

  const token = await createSessionToken({ sub: user.id, email: user.email, displayName: user.displayName }, c.env.JWT_SECRET);
  setSessionCookie(c, token, c.env.VITE_URL);

  return c.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
});

auth.post('/forgot-password', loginRateLimiter, validate(RequestResetSchema), async (c) => {
  const { email } = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return c.json({ success: true });

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  await db.delete(authCodes).where(and(eq(authCodes.userId, user.id), eq(authCodes.type, 'password_reset')));
  await db.insert(authCodes).values({ userId: user.id, code, type: 'password_reset', expiresAt });

  c.executionCtx.waitUntil(sendEmail(
    c.env.RESEND_API_KEY as any,
    user.email,
    'Negotiation Arena - Şifre Sıfırlama İstemi',
    getResetPasswordHtml(code)
  ));

  return c.json({ success: true });
});

auth.post('/reset-password', validate(ResetPasswordSchema), async (c) => {
  const { email, code, newPassword } = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return c.json({ error: 'Kullanıcı bulunamadı' }, 404);

  const [validCode] = await db.select().from(authCodes)
    .where(and(eq(authCodes.userId, user.id), eq(authCodes.code, code), eq(authCodes.type, 'password_reset')));

  if (!validCode) return c.json({ error: 'Geçersiz veya süresi dolmuş kod' }, 400);
  if (new Date() > validCode.expiresAt) return c.json({ error: 'Kodun süresi dolmuş' }, 400);

  const hashedPassword = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, user.id));
  await db.delete(authCodes).where(eq(authCodes.id, validCode.id));

  return c.json({ success: true });
});

// Real Google OAuth2 Flow
auth.get('/google', (c) => {
  // Generate a random state token for CSRF protection
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state,
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');

  // User denied access or Google returned an error
  if (error || !code) {
    return c.redirect(`${c.env.VITE_URL}/auth?error=google_denied`);
  }

  // 1. Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect(`${c.env.VITE_URL}/auth?error=google_token_failed`);
  }

  const tokenData = await tokenRes.json<{ access_token: string }>();

  // 2. Fetch real user info from Google
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userInfoRes.ok) {
    return c.redirect(`${c.env.VITE_URL}/auth?error=google_userinfo_failed`);
  }

  const googleUser = await userInfoRes.json<{
    id: string;
    email: string;
    name: string;
  }>();

  const googleId = googleUser.id;
  const email = googleUser.email;

  const db = getDb(c.env.NEON_DATABASE_URL);
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));

  if (existingUser) {
    // Link Google ID if not already linked
    if (!existingUser.googleId) {
      await db.update(users).set({ googleId, isEmailVerified: true }).where(eq(users.id, existingUser.id));
    }
    const token = await createSessionToken({ sub: existingUser.id, email: existingUser.email, displayName: existingUser.displayName }, c.env.JWT_SECRET);
    setSessionCookie(c, token, c.env.VITE_URL);
    return c.redirect(`${c.env.VITE_URL}/select-mode`);
  } else {
    // New Google user — needs to choose a username & password
    return c.redirect(`${c.env.VITE_URL}/auth/google-complete?googleId=${encodeURIComponent(googleId)}&email=${encodeURIComponent(email)}`);
  }
});

auth.post('/google-complete', validate(CompleteGoogleRegistrationSchema), async (c) => {
  const data = c.req.valid('json');
  const db = getDb(c.env.NEON_DATABASE_URL);
  
  const existing = await db.select().from(users).where(eq(users.username, data.username));
  if (existing.length > 0) {
    return c.json({ error: 'Bu kullanıcı adı alınmış' }, 400);
  }

  const hashedPassword = await hashPassword(data.password);
  
  const [user] = await db.insert(users).values({
    email: data.email,
    username: data.username,
    displayName: data.displayName,
    passwordHash: hashedPassword,
    googleId: data.googleId,
    isEmailVerified: true // Google authenticated emails are verified inherently
  }).returning();

  const token = await createSessionToken({ sub: user.id, email: user.email, displayName: user.displayName }, c.env.JWT_SECRET);
  setSessionCookie(c, token, c.env.VITE_URL);

  return c.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
});

auth.post('/logout', async (c) => {
  deleteCookie(c, 'session');
  return c.json({ success: true });
});

export const authRoutes = auth;
