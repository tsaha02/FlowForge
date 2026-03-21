// ============================================
// FlowForge — API Client
// ============================================
// This is the bridge between the frontend and the backend.
// All API calls go through this client.
//
// HOW IT WORKS:
// 1. It wraps the native `fetch` API
// 2. Automatically adds the auth token to every request
// 3. Handles errors consistently
// 4. Provides typed methods for each endpoint

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Get the auth token from localStorage
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('flowforge-token');
  }
  return null;
}

// Save the auth token to localStorage
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('flowforge-token', token);
  }
}

// Remove the auth token (on logout)
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('flowforge-token');
  }
}

// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

// The main fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

// ---- Auth API ----

export interface LoginData {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  workspaces: Array<{ id: string; name: string; slug: string; role: string }>;
  token: string;
}

export interface RegisterData {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  workspace: { id: string; name: string; slug: string };
  token: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<LoginData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  loginWithGoogle: (credential: string) =>
    apiRequest<LoginData>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  register: (name: string, email: string, password: string) =>
    apiRequest<RegisterData>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
};

// ---- Workflows API ----

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  triggerType: 'MANUAL' | 'CRON' | 'WEBHOOK';
  cronExpression?: string | null;
  createdAt: string;
  updatedAt: string;
  nodesJson?: unknown[];
  edgesJson?: unknown[];
  createdBy?: { id: string; name: string; avatarUrl: string | null };
  _count?: { executions: number };
}

export const workflowApi = {
  list: (workspaceId: string) =>
    apiRequest<Workflow[]>(`/api/workflows?workspaceId=${workspaceId}`),

  get: (id: string) => apiRequest<Workflow>(`/api/workflows/${id}`),

  create: (data: { name: string; description?: string; workspaceId: string }) =>
    apiRequest<Workflow>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Workflow>) =>
    apiRequest<Workflow>(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/workflows/${id}`, {
      method: 'DELETE',
    }),
};

// ---- Execution API ----

export interface Execution {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  errorMessage: string | null;
  workflow?: { id: string; name: string; nodesJson?: any; edgesJson?: any };
  nodeExecutions?: NodeExecution[];
  _count?: { nodeExecutions: number };
}

export interface PaginatedExecutions {
  executions: Execution[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NodeExecution {
  id: string;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  outputData: unknown;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
}

export const executionApi = {
  execute: (workflowId: string) =>
    apiRequest<{ executionId: string; status: string }>(
      `/api/workflows/${workflowId}/execute`,
      { method: 'POST' },
    ),

  list: (workspaceId: string, page = 1, limit = 20, status?: string, workflowId?: string) => {
    const params = new URLSearchParams({ workspaceId, page: String(page), limit: String(limit) });
    if (status && status !== 'ALL') params.append('status', status);
    if (workflowId && workflowId !== 'ALL') params.append('workflowId', workflowId);
    return apiRequest<PaginatedExecutions>(`/api/executions?${params.toString()}`);
  },

  get: (id: string) => apiRequest<Execution>(`/api/executions/${id}`),
};

// ---- Credentials API ----

export interface Credential {
  id: string;
  name: string;
  type: 'API_KEY' | 'OAUTH' | 'BASIC_AUTH' | 'CUSTOM';
  createdAt: string;
  workspaceId: string;
  createdById: string;
}

export const credentialsApi = {
  list: (workspaceId: string) =>
    apiRequest<Credential[]>(`/api/credentials?workspaceId=${workspaceId}`),

  create: (data: { workspaceId: string; name: string; type: string; data: Record<string, string> }) =>
    apiRequest<Credential>('/api/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/credentials/${id}`, {
      method: 'DELETE',
    }),
};

// ---- Users API ----
export const usersApi = {
  updateMe: (data: { name?: string; avatarUrl?: string; notifications?: any }) =>
    apiRequest<{ id: string; name: string; email: string; avatarUrl: string | null; notifications: any }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ---- Workspaces API ----
export const workspacesApi = {
  update: (id: string, data: { name: string }) =>
    apiRequest<{ id: string; name: string; slug: string }>(`/api/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (id: string) =>
    apiRequest<{ deletedId: string }>(`/api/workspaces/${id}`, {
      method: 'DELETE',
    }),
};
