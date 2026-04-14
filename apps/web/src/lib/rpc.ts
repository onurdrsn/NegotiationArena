import { hc } from 'hono/client';
import type { AppType } from '../../../worker/src/index';

// The base URL should be mapped to the deployed worker or local endpoint
// For local development, we'll assume the Vite proxy defaults or direct mapped.
// Since CORS is enabled to localhost:5173, we can point directly.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const client = hc<AppType>(API_URL, {
  init: {
    credentials: 'include',
  },
});
export const rpc: any = client;
