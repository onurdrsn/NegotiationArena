interface Env {
  NEON_DATABASE_URL: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  NEGOTIATION_ARENA_KV: KVNamespace;
  AI: any;
}
