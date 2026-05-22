/* ============================================================
   eDoc HMS — API Client
   Wrapper for fetch, auto header injection, JWT handling, token refreshes
   ============================================================ */

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://127.0.0.1:8000/api'
  : '/api';

const API = {
  // Get Access and Refresh Tokens
  getTokens() {
    return {
      access: localStorage.getItem('edoc_access_token'),
      refresh: localStorage.getItem('edoc_refresh_token'),
    };
  },

  // Set Access and Refresh Tokens
  setTokens(access, refresh) {
    if (access) localStorage.setItem('edoc_access_token', access);
    if (refresh) localStorage.setItem('edoc_refresh_token', refresh);
  },

  // Clear Tokens
  clearTokens() {
    localStorage.removeItem('edoc_access_token');
    localStorage.removeItem('edoc_refresh_token');
    localStorage.removeItem('edoc_user');
  },

  // Refresh Token
  async refreshToken() {
    const { refresh } = this.getTokens();
    if (!refresh) {
      this.clearTokens();
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        throw new Error('Refresh expired');
      }

      const data = await response.json();
      this.setTokens(data.access, data.refresh);
      return data.access;
    } catch (err) {
      this.clearTokens();
      return null;
    }
  },

  // Core Request Wrapper
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    options.headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    }

    // Inject Hospital Scope if present
    const activeHospitalId = localStorage.getItem('edoc_active_hospital_id');
    if (activeHospitalId) {
      options.headers['X-Hospital-ID'] = activeHospitalId;
    }

    // Inject Auth header if token exists
    let { access } = this.getTokens();
    if (access) {
      options.headers['Authorization'] = `Bearer ${access}`;
    }

    let response = await fetch(url, options);

    // If unauthorized, attempt to refresh token
    if (response.status === 401 && access) {
      const newAccess = await this.refreshToken();
      if (newAccess) {
        options.headers['Authorization'] = `Bearer ${newAccess}`;
        response = await fetch(url, options);
      } else {
        // Refresh token failed, redirect to login
        const role = localStorage.getItem('edoc_user_role') || 'patient';
        this.clearTokens();
        window.location.href = `../${role}/login.html`;
        return null;
      }
    }

    // Handle standard API errors
    if (!response.ok) {
      let errData = {};
      try {
        errData = await response.json();
      } catch (e) {}
      
      const error = new Error(errData.detail || errData.message || 'API request failed');
      error.status = response.status;
      error.errors = errData.errors || errData;
      throw error;
    }

    if (response.status === 204) return { success: true };
    const data = await response.json();
    return { success: true, data: data, ...data };
  },

  // Convenience Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

// --- Global duplicate Dr. prefix cleanup script ---
if (typeof window !== 'undefined') {
  (function() {
    function cleanDrText(text) {
      return text.replace(/\b(dr\.?\s+)+dr\b\.?/gi, 'Dr. ');
    }

    function cleanNode(node) {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const oldText = node.nodeValue;
        const newText = cleanDrText(oldText);
        if (oldText !== newText) {
          node.nodeValue = newText;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Ignore script and style tags
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;

        if (node.placeholder) {
          const oldPl = node.placeholder;
          const newPl = cleanDrText(oldPl);
          if (oldPl !== newPl) node.placeholder = newPl;
        }
        if (node.value && typeof node.value === 'string' && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')) {
          const oldVal = node.value;
          const newVal = cleanDrText(oldVal);
          if (oldVal !== newVal) node.value = newVal;
        }
        for (let child of node.childNodes) {
          cleanNode(child);
        }
      }
    }

    function runGlobalDrClean() {
      cleanNode(document.body || document.documentElement);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runGlobalDrClean);
    } else {
      runGlobalDrClean();
    }

    const drObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => cleanNode(node));
        } else if (mutation.type === 'characterData') {
          cleanNode(mutation.target);
        }
      }
    });

    drObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  })();
}
