import { z } from 'zod';

export const StartGameSchema = z.object({
  modeId: z.string(),
  difficulty: z.enum(['normal', 'hard']).default('normal'),
});

export const SendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(1000).trim(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .max(72)
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
  displayName: z.string().min(2).max(40),
}).superRefine((data, ctx) => {
  const pwdLower = data.password.toLowerCase();
  if (pwdLower.includes(data.username.toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Şifre kullanıcı adınızı içeremez', path: ['password'] });
  }
  if (pwdLower.includes(data.displayName.toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Şifre adınızı içeremez', path: ['password'] });
  }
});

export const VerifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const RequestResetSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .max(72)
    .regex(/[A-Z]/, 'En az bir büyük harf')
    .regex(/[a-z]/, 'En az bir küçük harf')
    .regex(/[0-9]/, 'En az bir rakam'),
});

export const CompleteGoogleRegistrationSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'En az bir büyük harf')
    .regex(/[a-z]/, 'En az bir küçük harf')
    .regex(/[0-9]/, 'En az bir rakam'),
  displayName: z.string().min(2).max(40),
}).superRefine((data, ctx) => {
  const pwdLower = data.password.toLowerCase();
  if (pwdLower.includes(data.username.toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Şifre kullanıcı adınızı içeremez', path: ['password'] });
  }
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
