import { create } from 'zustand';
import { rpc } from '../lib/rpc';

type User = {
  id: string;
  username: string;
  displayName: string;
  isEmailVerified?: boolean;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  requireVerification: boolean;
  unverifiedEmail: string | null;
  fetchMe: () => Promise<void>;
  login: (data: any) => Promise<User | null>;
  register: (data: any) => Promise<User | null | { requireVerification: true }>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<User | null>;
  resendVerification: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (data: any) => Promise<boolean>;
  completeGoogleAuth: (data: any) => Promise<User | null>;
  clearError: () => void;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  requireVerification: false,
  unverifiedEmail: null,

  clearError: () => set({ error: null }),

  fetchMe: async () => {
    try {
      const res = await rpc.api.leaderboard.me.$get();
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user as User, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const res = await rpc.api.auth.login.$post({ json: data });
      if (res.status === 403) {
        // Verification required
        const resData = await res.json() as any;
        set({ requireVerification: true, unverifiedEmail: data.email, error: resData.error || 'Doğrulama gerekli', loading: false });
        return null;
      }
      if (!res.ok) {
        const err = await res.json() as any;
        set({ error: err.error || 'Giriş başarısız', loading: false });
        return null;
      }
      const val = await res.json() as any;
      set({ user: val.user, loading: false, requireVerification: false, unverifiedEmail: null });
      return val.user;
    } catch (err: any) {
      set({ error: err.message || 'Giriş hatası', loading: false });
      return null;
    }
  },

  register: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const res = await rpc.api.auth.register.$post({ json: data });
      if (!res.ok) {
        const err = await res.json() as any;
        set({ error: err.error || 'Kayıt başarısız', loading: false });
        return null;
      }
      const val = await res.json() as any;
      if (val.requireVerification) {
        set({ requireVerification: true, unverifiedEmail: data.email, loading: false });
        return { requireVerification: true };
      }
      return null;
    } catch (err: any) {
      set({ error: err.message || 'Kayıt hatası', loading: false });
      return null;
    }
  },

  verifyEmail: async (code: string) => {
    const { unverifiedEmail } = get();
    if (!unverifiedEmail) return null;

    set({ loading: true, error: null });
    try {
      const res = await rpc.api.auth['verify-email'].$post({ json: { email: unverifiedEmail, code } });
      if (!res.ok) {
        const err = await res.json() as any;
        set({ error: err.error || 'Doğrulama başarısız', loading: false });
        return null;
      }
      const val = await res.json() as any;
      set({ user: val.user, requireVerification: false, unverifiedEmail: null, loading: false });
      return val.user;
    } catch (err: any) {
      set({ error: err.message || 'Bilinmeyen hata', loading: false });
      return null;
    }
  },

  resendVerification: async () => {
    const { unverifiedEmail } = get();
    if (!unverifiedEmail) return false;

    try {
      await rpc.api.auth['resend-code'].$post({ json: { email: unverifiedEmail } });
      return true;
    } catch {
      return false;
    }
  },

  forgotPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const res = await rpc.api.auth['forgot-password'].$post({ json: { email } });
      set({ loading: false });
      return res.ok;
    } catch {
      set({ error: 'Mail gönderilemedi', loading: false });
      return false;
    }
  },

  resetPassword: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const res = await rpc.api.auth['reset-password'].$post({ json: data });
      if (!res.ok) {
        const err = await res.json() as any;
        set({ error: err.error || 'Hata oluştu', loading: false });
        return false;
      }
      set({ loading: false });
      return true;
    } catch {
      set({ error: 'İşlem başarısız', loading: false });
      return false;
    }
  },

  completeGoogleAuth: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const res = await rpc.api.auth['google-complete'].$post({ json: data });
      if (!res.ok) {
        const err = await res.json() as any;
        set({ error: err.error || 'İşlem başarısız', loading: false });
        return null;
      }
      const val = await res.json() as any;
      set({ user: val.user, loading: false });
      return val.user;
    } catch (err: any) {
      set({ error: err.message || 'Bilinmeyen hata', loading: false });
      return null;
    }
  },

  logout: async () => {
    await rpc.api.auth.logout.$post();
    set({ user: null });
  }
}));
