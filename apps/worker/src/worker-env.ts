/// <reference types="@cloudflare/workers-types" />

export interface Env {
  NEON_DATABASE_URL: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  NEGOTIATION_ARENA_KV: KVNamespace;
  AI: any;
  VITE_URL: string;
  RESEND_API_KEY: string;
  STORAGE: R2Bucket;
  SCORE_QUEUE: Queue;
  MULTIPLAYER: DurableObjectNamespace;
}
