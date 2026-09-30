import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated status
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and reload if unauthorized
      if (localStorage.getItem('pos_token')) {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Users Service
export const userService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

// Categories Service
export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Menu Service
export const menuService = {
  getAll: (params) => api.get('/menu', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  toggleAvailability: (id) => api.patch(`/menu/${id}/toggle-availability`),
};

// Tables Service
export const tableService = {
  getAll: () => api.get('/tables'),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  delete: (id) => api.delete(`/tables/${id}`),
  updateStatus: (id, data) => api.patch(`/tables/${id}/status`, data),
};

// Orders Service
export const orderService = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  pay: (id, data) => api.post(`/orders/${id}/pay`, data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
};

// Inventory Service
export const inventoryService = {
  getStatus: () => api.get('/inventory'),
  adjust: (data) => api.post('/inventory/adjust', data),
  getLogs: (params) => api.get('/inventory/logs', { params }),
};

// Reports Service
export const reportService = {
  getSales: (params) => api.get('/reports/sales', { params }),
};

// Settings Service
export const settingService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Backup Service
export const backupService = {
  getBackupUrl: '/api/backup/export',
  exportBackup: () => api.get('/backup/export'),
  restoreBackup: (data) => api.post('/backup/restore', { data }),
};

export default api;
