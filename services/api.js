/**
 * eDoc HMS Centralized API Service Layer
 * Handles authentication, automatic JWT injection, token refresh, and all resource endpoints.
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const INDEX_URL = new URL('../index.html', import.meta.url).href;

// --- Button Loading State Handler ---
let activeSubmitButton = null;
let lastClickedButton = null;

function getLoadingText(originalText) {
    if (!originalText) return 'Loading...';
    const text = originalText.trim().toLowerCase().replace(/[+]/g, '').trim();
    if (text.includes('login') || text.includes('log in')) return 'Logging in...';
    if (text.includes('sign up') || text.includes('register') || text.includes('signup')) return 'Registering...';
    if (text.includes('create')) return 'Creating...';
    if (text.includes('save')) return 'Saving...';
    if (text.includes('add')) return 'Adding...';
    if (text.includes('search')) return 'Searching...';
    if (text.includes('delete')) return 'Deleting...';
    if (text.includes('remove')) return 'Removing...';
    if (text.includes('cancel')) return 'Canceling...';
    if (text.includes('confirm')) return 'Confirming...';
    if (text.includes('book')) return 'Booking...';
    if (text.includes('edit')) return 'Editing...';
    if (text.includes('view')) return 'Loading...';
    
    if (originalText.endsWith('...')) return originalText;
    return originalText + '...';
}

function setButtonLoading(btn) {
    let count = parseInt(btn.dataset.loadingCount || '0', 10);
    const isInput = btn.tagName.toLowerCase() === 'input';
    const originalText = count === 0 ? (isInput ? btn.value : btn.textContent) : btn.dataset.originalText;
    const originalHtml = count === 0 ? (isInput ? null : btn.innerHTML) : btn.dataset.originalHtml;
    
    if (count === 0) {
        btn.dataset.originalText = originalText;
        if (!isInput) {
            btn.dataset.originalHtml = originalHtml;
        }
        
        btn.disabled = true;
        btn.classList.add('btn-loading');
        
        const loadingText = getLoadingText(originalText);
        if (isInput) {
            btn.value = `⟳ ${loadingText}`;
        } else {
            btn.innerHTML = `<span class="btn-loading-spinner"></span><span>${loadingText}</span>`;
        }
    }
    
    count++;
    btn.dataset.loadingCount = count.toString();
    
    return () => {
        let currentCount = parseInt(btn.dataset.loadingCount || '0', 10);
        currentCount--;
        if (currentCount <= 0) {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
            if (isInput) {
                btn.value = btn.dataset.originalText || originalText;
            } else {
                btn.innerHTML = btn.dataset.originalHtml || originalHtml;
            }
            delete btn.dataset.originalText;
            delete btn.dataset.originalHtml;
            delete btn.dataset.loadingCount;
        } else {
            btn.dataset.loadingCount = currentCount.toString();
        }
    };
}

if (typeof document !== 'undefined') {
    // 1. Capture the last clicked button globally
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, input[type="submit"], input[type="button"]');
        if (btn) {
            if (btn.closest('a')) return;
            lastClickedButton = btn;
            
            setTimeout(() => {
                if (lastClickedButton === btn) {
                    lastClickedButton = null;
                }
            }, 1000);
        }
    }, true);

    // 2. Intercept form submits to find the active submit button
    document.addEventListener('submit', (e) => {
        const form = e.target;
        const submitBtn = form.querySelector('input[type="submit"], button[type="submit"], button:not([type])');
        if (submitBtn) {
            activeSubmitButton = submitBtn;
            
            setTimeout(() => {
                if (activeSubmitButton === submitBtn) {
                    activeSubmitButton = null;
                }
            }, 1000);
        }
    }, true);
}
// ------------------------------------

// Helper to get tokens
function getAccessToken() {
    return localStorage.getItem('edoc_access_token');
}

function getRefreshToken() {
    return localStorage.getItem('edoc_refresh_token');
}

function saveTokens(access, refresh) {
    if (access) localStorage.setItem('edoc_access_token', access);
    if (refresh) localStorage.setItem('edoc_refresh_token', refresh);
}

function clearTokens() {
    localStorage.removeItem('edoc_access_token');
    localStorage.removeItem('edoc_refresh_token');
    localStorage.removeItem('edoc_user');
}

function getUser() {
    const userStr = localStorage.getItem('edoc_user');
    return userStr ? JSON.parse(userStr) : null;
}

function saveUser(user) {
    localStorage.setItem('edoc_user', JSON.stringify(user));
}

// Global fetch wrapper with automatic token management and error handling
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    
    let token = getAccessToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Determine which button to put in loading state
    const targetBtn = activeSubmitButton || lastClickedButton;
    let restoreBtn = null;
    
    if (targetBtn && !targetBtn.disabled) {
        restoreBtn = setButtonLoading(targetBtn);
    }

    try {
        let response = await fetch(url, options);

        // If unauthorized, try to refresh token once
        if (response.status === 401 && getRefreshToken()) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: getRefreshToken() })
                });

                const refreshData = await refreshRes.json();
                if (refreshData.success) {
                    saveTokens(refreshData.data.access, refreshData.data.refresh);
                    
                    // Retry request with new token
                    options.headers['Authorization'] = `Bearer ${refreshData.data.access}`;
                    response = await fetch(url, options);
                } else {
                    // Refresh failed, logout
                    clearTokens();
                    window.location.href = INDEX_URL;
                    throw new Error('Session expired. Please login again.');
                }
            } catch (err) {
                clearTokens();
                window.location.href = INDEX_URL;
                throw err;
            }
        }

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw {
                status: response.status,
                message: data.message || 'An error occurred',
                errors: data.errors || {}
            };
        }

        return data;
    } finally {
        if (restoreBtn) {
            restoreBtn();
        }
    }
}

// Expose API methods
export const ApiService = {
    // Auth endpoints
    auth: {
        async login(email, password) {
            const res = await apiFetch('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            saveTokens(res.data.access, res.data.refresh);
            saveUser(res.data.user);
            return res.data;
        },
        async register(patientData) {
            const res = await apiFetch('/auth/register/', {
                method: 'POST',
                body: JSON.stringify(patientData)
            });
            saveTokens(res.data.access, res.data.refresh);
            saveUser(res.data.user);
            return res.data;
        },
        async registerDoctor(doctorData) {
            const res = await apiFetch('/auth/register-doctor/', {
                method: 'POST',
                body: JSON.stringify(doctorData)
            });
            saveTokens(res.data.access, res.data.refresh);
            saveUser(res.data.user);
            return res.data;
        },
        async registerAdmin(adminData) {
            const res = await apiFetch('/auth/register-admin/', {
                method: 'POST',
                body: JSON.stringify(adminData)
            });
            saveTokens(res.data.access, res.data.refresh);
            saveUser(res.data.user);
            return res.data;
        },
        async logout() {
            try {
                await apiFetch('/auth/logout/', {
                    method: 'POST',
                    body: JSON.stringify({ refresh: getRefreshToken() })
                });
            } catch (e) {
                console.warn("Logout request failed, clearing local session anyway.", e);
            }
            clearTokens();
            window.location.href = INDEX_URL;
        },
        getUser,
        isAuthenticated() {
            return !!getAccessToken();
        }
    },


    // Dashboard endpoints
    dashboard: {
        async getAdminStats() {
            return await apiFetch('/dashboard/admin/');
        },
        async getPatientStats() {
            return await apiFetch('/dashboard/patient/');
        },
        async getDoctorStats() {
            return await apiFetch('/dashboard/doctor/');
        }
    },

    // Doctors endpoints
    doctors: {
        async getAll(search = '') {
            return await apiFetch(`/doctors/?search=${encodeURIComponent(search)}`);
        },
        async getSpecialties() {
            return await apiFetch('/doctors/specialties/');
        },
        async get(id) {
            return await apiFetch(`/doctors/${id}/`);
        },
        async create(doctorData) {
            return await apiFetch('/doctors/', {
                method: 'POST',
                body: JSON.stringify(doctorData)
            });
        },
        async update(id, doctorData) {
            return await apiFetch(`/doctors/${id}/`, {
                method: 'PUT',
                body: JSON.stringify(doctorData)
            });
        },
        async delete(id) {
            return await apiFetch(`/doctors/${id}/`, {
                method: 'DELETE'
            });
        }
    },

    // Patients endpoints
    patients: {
        async getAll(search = '') {
            return await apiFetch(`/patients/?search=${encodeURIComponent(search)}`);
        },
        async get(id) {
            return await apiFetch(`/patients/${id}/`);
        },
        async getProfile() {
            return await apiFetch('/patients/me/');
        },
        async getHistory() {
            return await apiFetch('/patients/me/history/');
        },
        async updateProfile(profileData) {
            return await apiFetch('/patients/me/', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        },
        async deleteProfile() {
            return await apiFetch('/patients/me/', {
                method: 'DELETE'
            });
        },
        async deletePatientAdmin(id) {
            return await apiFetch(`/patients/${id}/`, {
                method: 'DELETE'
            });
        }
    },

    // Schedules (Sessions) endpoints
    schedules: {
        async getAll(filters = {}) {
            let query = '';
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            if (filters.date) query += `&date=${encodeURIComponent(filters.date)}`;
            if (filters.doctor) query += `&doctor=${encodeURIComponent(filters.doctor)}`;
            if (filters.upcoming) query += `&upcoming=true`;
            return await apiFetch(`/schedules/?${query.substring(1)}`);
        },
        async get(id) {
            return await apiFetch(`/schedules/${id}/`);
        },
        async getBookingInfo(id) {
            return await apiFetch(`/schedules/${id}/booking-info/`);
        },
        async getMyDoctorSchedules() {
            return await apiFetch('/schedules/my/');
        },
        async create(sessionData) {
            return await apiFetch('/schedules/', {
                method: 'POST',
                body: JSON.stringify(sessionData)
            });
        },
        async delete(id) {
            return await apiFetch(`/schedules/${id}/`, {
                method: 'DELETE'
            });
        }
    },

    // Appointments endpoints
    appointments: {
        async getAll(filters = {}) {
            let query = '';
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            if (filters.date) query += `&date=${encodeURIComponent(filters.date)}`;
            if (filters.doctor) query += `&doctor=${encodeURIComponent(filters.doctor)}`;
            if (filters.upcoming) query += `&upcoming=true`;
            return await apiFetch(`/appointments/?${query.substring(1)}`);
        },
        async book(scheduleId) {
            return await apiFetch('/appointments/book/', {
                method: 'POST',
                body: JSON.stringify({ schedule_id: scheduleId })
            });
        },
        async getMyAppointments() {
            return await apiFetch('/appointments/my/');
        },
        async getDoctorAppointments() {
            return await apiFetch('/appointments/doctor/');
        },
        async cancel(id) {
            return await apiFetch(`/appointments/${id}/`, {
                method: 'DELETE'
            });
        }
    },

    // Billing endpoints
    billing: {
        async getInvoices(filters = {}) {
            let query = '';
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            if (filters.status) query += `&status=${encodeURIComponent(filters.status)}`;
            return await apiFetch(`/billing/invoices/?${query.substring(1)}`);
        },
        async getMyInvoices() {
            return await apiFetch('/billing/my-invoices/');
        },
        async generateInvoice(payload) {
            return await apiFetch('/billing/invoices/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        },
        async compileIPDInvoice(admissionId) {
            return await apiFetch('/billing/invoices/compile-ipd/', {
                method: 'POST',
                body: JSON.stringify({ admission_id: admissionId })
            });
        },
        async payInvoice(id) {
            return await apiFetch(`/billing/invoices/${id}/pay/`, {
                method: 'POST'
            });
        }
    },

    // Support endpoints
    support: {
        async create(payload) {
            return await apiFetch('/support/tickets/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        },
        async getMyTickets() {
            return await apiFetch('/support/tickets/');
        },
        async resolve(id) {
            return await apiFetch(`/support/tickets/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'resolved' })
            });
        }
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
