// ============================================
// FlowForge — Auth Store (Zustand)
// ============================================
// This store manages the authentication state globally.
//
// WHAT IS ZUSTAND?
// Zustand is a tiny state management library. Think of it like React Context
// but much simpler. You create a "store" (a container of state), and any
// component can read from it or update it.
//
// Usage in components:
//   const { user, login, logout } = useAuthStore();

import { create } from 'zustand';
import { authApi, setToken, removeToken, LoginData, RegisterData } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  notifications?: any;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

interface AuthState {
  // State
  user: User | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setActiveWorkspace: (workspaceId: string) => void;
  loadFromStorage: () => void;
  updateUser: (data: Partial<User>) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,
  error: null,

  // Login action
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      const data = response.data as LoginData;

      // Save token & user data
      setToken(data.token);
      localStorage.setItem('flowforge-user', JSON.stringify(data.user));
      localStorage.setItem('flowforge-workspaces', JSON.stringify(data.workspaces));

      set({
        user: data.user,
        workspaces: data.workspaces,
        activeWorkspaceId: data.workspaces[0]?.id || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  // Google Login action
  loginWithGoogle: async (credential: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.loginWithGoogle(credential);
      const data = response.data as LoginData;

      // Save token & user data
      setToken(data.token);
      localStorage.setItem('flowforge-user', JSON.stringify(data.user));
      localStorage.setItem('flowforge-workspaces', JSON.stringify(data.workspaces));

      set({
        user: data.user,
        workspaces: data.workspaces,
        activeWorkspaceId: data.workspaces[0]?.id || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Google login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  // Register action
  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(name, email, password);
      const data = response.data as RegisterData;

      // Save token & user data
      setToken(data.token);
      localStorage.setItem('flowforge-user', JSON.stringify(data.user));
      const workspaces = [{ id: data.workspace.id, name: data.workspace.name, slug: data.workspace.slug }];
      localStorage.setItem('flowforge-workspaces', JSON.stringify(workspaces));

      set({
        user: data.user,
        workspaces,
        activeWorkspaceId: data.workspace.id,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  // Logout action
  logout: () => {
    removeToken();
    localStorage.removeItem('flowforge-user');
    localStorage.removeItem('flowforge-workspaces');
    set({
      user: null,
      workspaces: [],
      activeWorkspaceId: null,
      error: null,
    });
  },

  // Set active workspace
  setActiveWorkspace: (workspaceId: string) => {
    set({ activeWorkspaceId: workspaceId });
  },

  // Load user data from localStorage (for page refresh persistence)
  loadFromStorage: () => {
    try {
      const userStr = localStorage.getItem('flowforge-user');
      const workspacesStr = localStorage.getItem('flowforge-workspaces');
      const token = localStorage.getItem('flowforge-token');

      if (userStr && token) {
        const user = JSON.parse(userStr);
        const workspaces = workspacesStr ? JSON.parse(workspacesStr) : [];
        set({
          user,
          workspaces,
          activeWorkspaceId: workspaces[0]?.id || null,
        });
      }
    } catch {
      // If localStorage is corrupted, just ignore
    }
  },

  // Update user in state and localStorage
  updateUser: (data: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...data };
      localStorage.setItem('flowforge-user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  // Update workspace in state and localStorage
  updateWorkspace: (id: string, data: Partial<Workspace>) => {
    set((state) => {
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === id ? { ...w, ...data } : w
      );
      localStorage.setItem('flowforge-workspaces', JSON.stringify(updatedWorkspaces));
      return { workspaces: updatedWorkspaces };
    });
  },

  // Remove workspace from state and localStorage
  removeWorkspace: (id: string) => {
    set((state) => {
      const remainingWorkspaces = state.workspaces.filter((w) => w.id !== id);
      localStorage.setItem('flowforge-workspaces', JSON.stringify(remainingWorkspaces));
      // If the active workspace was deleted, switch to the first available one
      const newActiveId = state.activeWorkspaceId === id
        ? (remainingWorkspaces[0]?.id || null)
        : state.activeWorkspaceId;
      return { workspaces: remainingWorkspaces, activeWorkspaceId: newActiveId };
    });
  },
}));
