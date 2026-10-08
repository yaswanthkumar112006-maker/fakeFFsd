const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('rx_data');
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data.currentUser) return data.currentUser;
      }
      const userItem = localStorage.getItem('currentUser');
      if (userItem) return JSON.parse(userItem);
    } catch (e) {
      console.error('Error reading current user from storage:', e);
    }
    return null;
  }

  getHeaders(customHeaders = {}) {
    const user = this.getCurrentUser();
    const headers = { ...customHeaders };
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    return headers;
  }

  buildQuery(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        search.append(key, value);
      }
    });
    const queryString = search.toString();
    return queryString ? `?${queryString}` : '';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(options.headers || {});

    const config = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body !== undefined) {
      if (options.body instanceof FormData) {
        config.body = options.body;
      } else {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(options.body);
      }
    }

    try {
      const res = await fetch(url, config);
      if (!res.ok) {
        let errMsg = `Request failed with status ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (res.status === 204) return null;
      const contentType = res.headers.get('content-type') || '';
      return contentType.includes('application/json') ? await res.json() : null;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'}] ${url}:`, error);
      throw error;
    }
  }

  get(endpoint, params) {
    const query = params ? this.buildQuery(params) : '';
    return this.request(`${endpoint}${query}`, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
