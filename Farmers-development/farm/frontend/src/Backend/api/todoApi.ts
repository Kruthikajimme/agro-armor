import { TodoItem } from '../models/TodoItem';

interface TodoResponse {
  _id: string;
  title: string;
  description?: string;
  done?: boolean;
  completed?: boolean;
  isImportant?: boolean;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

// API for todo operations using HTTP requests to backend
const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const API_BASE = !rawBase ? '/api' : (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`);
// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Get headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const todoApi = {
  // Get all todos
  getAll: async (): Promise<TodoItem[]> => {
    const response = await fetch(`${API_BASE}/todos`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch todos: ${response.statusText}`);
    }
    const data = (await response.json()) as TodoResponse[];
    // Map _id to id for frontend compatibility
    return data.map((item) => ({
      id: item._id,
      title: item.title,
      description: item.description,
      completed: Boolean(item.done ?? item.completed),
      isImportant: item.isImportant,
      priority: item.priority,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  },
  
  // Add a new todo
  add: async (title: string, description?: string, isImportant?: boolean): Promise<TodoItem> => {
    const response = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, description, isImportant }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add todo: ${response.statusText}`);
    }
    const data = (await response.json()) as TodoResponse;
    // Map _id to id
    return {
      id: data._id,
      title: data.title,
      description: data.description,
      completed: Boolean(data.done ?? data.completed),
      isImportant: data.isImportant,
      priority: data.priority,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  },
  
  // Update a todo
  update: async (id: string, updates: { title?: string; description?: string; completed?: boolean; isImportant?: boolean }): Promise<TodoItem | null> => {
    const payload: Record<string, unknown> = { ...updates };
    if (payload.completed !== undefined) {
      payload.done = payload.completed;
      delete payload.completed;
    }

    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to update todo: ${response.statusText}`);
    }
    const data = (await response.json()) as TodoResponse;
    // Map _id to id
    return {
      id: data._id,
      title: data.title,
      description: data.description,
      completed: Boolean(data.done ?? data.completed),
      isImportant: data.isImportant,
      priority: data.priority,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  },
  
  // Toggle todo completion status
  toggleComplete: async (id: string): Promise<TodoItem | null> => {
    const todos = await todoApi.getAll();
    const item = todos.find(item => item.id === id);
    if (!item) return null;
    return todoApi.update(id, { completed: !item.completed });
  },
  
  // Delete a todo
  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 404) return false;
      throw new Error(`Failed to delete todo: ${response.statusText}`);
    }
    return true;
  },
  
  // Subscribe to changes (placeholder: in production, use WebSockets or polling)
  subscribe: (listener: () => void): (() => void) => {
    // For now, manual refetch trigger; integrate with React Query for auto-updates
    const interval = setInterval(listener, 5000); // Poll every 5s as fallback
    return () => clearInterval(interval);
  },
};

// Authentication API
export const authApi = {
  // Register new user
  register: async (phone: string, password: string, name: string, email?: string, role?: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, name, email, role }),
      });
      // Safely parse – server may return empty body or HTML on errors/cold-starts
      const text = await response.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON body */ }
      if (!response.ok) {
        throw new Error(data.error || `Registration failed: ${response.status} ${response.statusText}`);
      }
      if (!data || !data.token) {
        throw new Error('Server returned an unexpected response. Please try again in a moment.');
      }
      localStorage.setItem('authToken', data.token);
      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },

  // Login user
  login: async (phone: string, password: string, email?: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, email }),
      });
      // Safely parse – server may return empty body or HTML on errors/cold-starts
      const text = await response.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON body */ }
      if (!response.ok) {
        throw new Error(data.error || `Login failed: ${response.status} ${response.statusText}`);
      }
      if (!data || !data.token) {
        throw new Error('Server returned an unexpected response. Please try again in a moment.');
      }
      localStorage.setItem('authToken', data.token);
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to get profile: ${response.statusText}`);
    }
    return response.json();
  },

  // Update user profile
  updateProfile: async (data: { name?: string; email?: string; photo?: string }) => {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update profile: ${response.statusText}`);
    }
    return response.json();
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  }
};

// Notifications API
export const notificationApi = {
  // Get all notifications for the authenticated user
  getAll: async (unreadOnly = false): Promise<any> => {
    const url = unreadOnly ? `${API_BASE}/notifications?unreadOnly=true` : `${API_BASE}/notifications`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }
    return response.json();
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to get unread count: ${response.statusText}`);
    }
    return response.json();
  },

  // Mark as read
  markAsRead: async (notificationId: string) => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to mark as read: ${response.statusText}`);
    }
    return response.json();
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to mark all as read: ${response.statusText}`);
    }
    return response.json();
  },

  // Delete a notification
  delete: async (notificationId: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 404) return false;
      throw new Error(`Failed to delete notification: ${response.statusText}`);
    }
    return true;
  },

  // Create a custom notification
  create: async (data: { type?: string; title: string; message: string; priority?: string; metadata?: Record<string, unknown> }) => {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.statusText}`);
    }
    return response.json();
  }
};

// Disease Detection API
export const detectionApi = {
  // Save a detection result
  save: async (data: {
    imageUrl: string;
    disease: string;
    confidence: number;
    allPredictions: Record<string, number>;
    recommendation?: string;
  }) => {
    const response = await fetch(`${API_BASE}/detections`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to save detection: ${response.statusText}`);
    }
    return response.json();
  },

  // Get detection history
  getHistory: async () => {
    const response = await fetch(`${API_BASE}/detections/history`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    return response.json();
  }
};

// Animal Management API
export const animalApi = {
  // Get all animals for the logged-in farmer
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE}/animals`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch animals: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map((item: any) => ({
      id: item._id,
      name: item.name,
      type: item.type,
      age: item.age,
      weight: item.weight,
      healthStatus: item.status,
      notes: item.history?.[0]?.description || "",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  },

  // Get animal statistics
  getStats: async () => {
    const response = await fetch(`${API_BASE}/animals/stats`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch animal stats: ${response.statusText}`);
    }
    return response.json();
  },

  // Add a new animal
  add: async (data: any) => {
    const response = await fetch(`${API_BASE}/animals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        status: data.healthStatus, // Map healthStatus to status for backend
        history: data.notes ? [{ description: data.notes }] : []
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add animal: ${response.statusText}`);
    }
    return response.json();
  },

  // Update animal details
  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE}/animals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        status: data.healthStatus,
        history: data.notes ? [{ description: data.notes }] : []
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update animal: ${response.statusText}`);
    }
    return response.json();
  },

  // Delete an animal
  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/animals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 404) return false;
      throw new Error(`Failed to delete animal: ${response.statusText}`);
    }
    return true;
  }
};
