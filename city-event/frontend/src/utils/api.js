import { auth, app } from './firebase';
import { getToken } from 'firebase/app-check';

// Validate API URL is configured
const BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'https://api.cityevent.com')
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

const API_URL = `${BASE_URL}/api`;

// Log API configuration in development
if (import.meta.env.DEV) {
  console.log('🔗 API Configuration:', { BASE_URL, API_URL });
}

let csrfTokenCache = null;
let csrfTokenPromise = null;

const fetchCsrfToken = async () => {
  if (csrfTokenCache) return csrfTokenCache;
  if (csrfTokenPromise) return csrfTokenPromise;
  csrfTokenPromise = fetch(`${API_URL}/csrf-token`, { credentials: 'include' })
    .then(r => r.json())
    .then(d => { csrfTokenCache = d.csrfToken; return d.csrfToken; })
    .catch(() => null);
  return csrfTokenPromise;
};

const getAuthHeader = async () => {
  const headers = {};
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    // Add App Check token if available
    try {
      const appCheckTokenResponse = await getToken(app);
      if (appCheckTokenResponse?.token) {
        headers['X-Firebase-AppCheck'] = appCheckTokenResponse.token;
      }
    } catch { /* App Check not initialized */ }
    // Add CSRF token for state-changing requests
    const csrf = await fetchCsrfToken();
    if (csrf) headers['csrf-token'] = csrf;
  } catch { /* noop */ }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Request failed');
  return data;
};

export const authAPI = {
  getCurrentUser: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/auth/me`, { headers });
    return handleResponse(res);
  },
  updateProfile: async (data) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};

export const eventsAPI = {
  // Public - no auth required for browsing
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events${query ? `?${query}` : ''}`, { headers });
    const data = await handleResponse(res);
    // If pagination params were passed, return full response object
    if (params.page || params.limit) {
      return data;
    }
    // Backward compatibility: return just the array
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  },
  getById: async (id) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${id}`, { headers });
    return handleResponse(res);
  },
  create: async (eventData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(eventData)
    });
    return handleResponse(res);
  },
  update: async (id, eventData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(eventData)
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse(res);
  },
  getMyEvents: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/my-events`, { headers });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },
  getAnalytics: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/analytics`, { headers });
    return handleResponse(res);
  },
  getAttendees: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/attendees`, { headers });
    return handleResponse(res);
  },
  getTicketTiers: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/ticket-tiers`, { headers });
    return handleResponse(res);
  },
  createTicketTier: async (eventId, tierData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/ticket-tiers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(tierData)
    });
    return handleResponse(res);
  },
  createPromoCode: async (eventId, promoData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/promo-codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(promoData)
    });
    return handleResponse(res);
  },
  validatePromoCode: async (eventId, code) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/validate-promo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ code })
    });
    return handleResponse(res);
  }
};

export const registrationsAPI = {
  register: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ eventId })
    });
    return handleResponse(res);
  },
  checkout: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/registrations/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ eventId })
    });
    return handleResponse(res);
  },
  getMyTickets: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/registrations/my-tickets`, { headers });
    const data = await handleResponse(res);
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  },
  cancel: async (registrationId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/registrations/${registrationId}/cancel`, {
      method: 'POST',
      headers
    });
    return handleResponse(res);
  }
};

export const uploadAPI = {
  upload: async (file) => {
    const headers = await getAuthHeader();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { ...headers },
      body: formData
    });
    return handleResponse(res);
  }
};

export const waitlistAPI = {
  join: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ eventId })
    });
    return handleResponse(res);
  },
  leave: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/waitlist/${eventId}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse(res);
  },
  status: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/waitlist/${eventId}/status`, { headers });
    return handleResponse(res);
  },
  getMyList: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/waitlist/my-list`, { headers });
    return handleResponse(res);
  }
};

export const billingAPI = {
  createPortalSession: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/billing/portal`, {
      method: 'POST',
      headers
    });
    return handleResponse(res);
  }
};

export const gdprAPI = {
  exportData: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/gdpr/export`, { headers });
    return handleResponse(res);
  },
  deleteAccount: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/gdpr/delete-account`, {
      method: 'DELETE',
      headers
    });
    return handleResponse(res);
  }
};

export const icsAPI = {
  downloadUrl: (eventId) => `${API_URL}/events/${eventId}/ics`
};

export const seriesAPI = {
  getBySeriesId: async (seriesId) => {
    const res = await fetch(`${API_URL}/series/${seriesId}`);
    return handleResponse(res);
  }
};

export const checkinAPI = {
  scan: async (qrCodeData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/checkin/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ qrCodeData })
    });
    return handleResponse(res);
  },
  getEventStats: async (eventId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/checkin/event/${eventId}`, { headers });
    return handleResponse(res);
  }
};

export const adminAPI = {
  getUsers: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/admin/users`, { headers });
    return handleResponse(res);
  },
  getAnalytics: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/admin/analytics`, { headers });
    return handleResponse(res);
  },
  updateUserRole: async (userId, role) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ role })
    });
    return handleResponse(res);
  },
  getPendingEvents: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/admin/events/pending`, { headers });
    return handleResponse(res);
  },
  updateEventStatus: async (eventId, status) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/admin/events/${eventId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  }
};

export const reviewsAPI = {
  getByEvent: async (eventId) => {
    const res = await fetch(`${API_URL}/events/${eventId}/reviews`);
    const data = await handleResponse(res);
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  },
  getStats: async (eventId) => {
    const res = await fetch(`${API_URL}/events/${eventId}/reviews/stats`);
    return handleResponse(res);
  },
  create: async (eventId, { rating, comment }) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ rating, comment })
    });
    return handleResponse(res);
  },
  delete: async (eventId, reviewId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/events/${eventId}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse(res);
  }
};

export const ticketsAPI = {
  downloadPdf: async (ticketId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/tickets/${ticketId}/pdf`, { headers });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to download ticket');
    }
    return res.blob();
  }
};
