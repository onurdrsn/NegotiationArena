import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string | null;
  type: ToastType;
  isVisible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  isVisible: false,
  showToast: (message, type = 'info') => {
    set({ message, type, isVisible: true });
    // Auto hide after 3 seconds
    setTimeout(() => {
      set({ isVisible: false });
    }, 3000);
  },
  hideToast: () => set({ isVisible: false }),
}));
