/* ============================================================
   eDoc HMS — Authentication Guard & Session Helper
   ============================================================ */

const Auth = {
  // Parse JWT details to extract payloads safely without a heavy library
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  },

  // Save authentication details after successful login
  saveSession(data) {
    API.setTokens(data.access, data.refresh);
    
    // Extract user info from token or direct API response
    const payload = this.parseJwt(data.access);
    const user = {
      id: payload.user_id,
      email: payload.email,
      role: payload.role, // 'super-admin', 'hospital-admin', 'frontdesk', 'doctor', 'nurse', 'pharmacy', 'lab', 'patient'
      name: payload.name || data.name || 'User',
      hospital_id: payload.hospital_id || null
    };

    localStorage.setItem('edoc_user', JSON.stringify(user));
    localStorage.setItem('edoc_user_role', user.role);
    if (user.hospital_id) {
      localStorage.setItem('edoc_active_hospital_id', user.hospital_id);
    }
    return user;
  },

  // Get active session user details
  getUser() {
    const userStr = localStorage.getItem('edoc_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if authenticated
  isAuthenticated() {
    const tokens = API.getTokens();
    return !!tokens.access;
  },

  // Page Auth Guard - redirects if role mismatches or unauthorized
  guard(allowedRoles = []) {
    const user = this.getUser();
    const currentPath = window.location.pathname;

    // Skip auth page redirects
    if (currentPath.includes('/login.html') || currentPath.includes('/register.html') || currentPath.includes('/verify-otp.html')) {
      if (user && this.isAuthenticated()) {
        this.redirectToDashboard(user.role);
      }
      return;
    }

    if (!user || !this.isAuthenticated()) {
      // Find fallback route based on folder structure
      let folderRole = 'patient';
      const portals = ['super-admin', 'hospital-admin', 'frontdesk', 'doctor', 'nurse', 'pharmacy', 'lab', 'patient'];
      for (const portal of portals) {
        if (currentPath.includes(`/${portal}/`)) {
          folderRole = portal;
          break;
        }
      }
      window.location.href = `../${folderRole}/login.html`;
      return;
    }

    // Verify role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      this.redirectToDashboard(user.role);
    }
  },

  // Redirect role to appropriate dashboard landing path
  redirectToDashboard(role) {
    // Legacy role mapping from previous system version
    const roleMapping = {
      'p': 'patient',
      'd': 'doctor',
      'a': 'hospital-admin', // or super-admin, assuming hospital-admin for 'a'
      'n': 'nurse',
      'r': 'frontdesk', // receptionist
      'l': 'lab',
      'ph': 'pharmacy'
    };
    
    const normalizedRole = roleMapping[role] || role;

    const dashboardRoutes = {
      'super-admin': '../super-admin/dashboard.html',
      'hospital-admin': '../hospital-admin/dashboard.html',
      'frontdesk': '../frontdesk/dashboard.html',
      'doctor': '../doctor/dashboard.html',
      'nurse': '../nurse/dashboard.html',
      'pharmacy': '../pharmacy/dashboard.html',
      'lab': '../lab/dashboard.html',
      'patient': '../patient/index.html',
    };
    
    if (dashboardRoutes[normalizedRole]) {
      window.location.href = dashboardRoutes[normalizedRole];
    } else {
      // Unknown role, clear session to prevent redirect loops
      API.clearTokens();
      window.location.href = '../index.html';
    }
  },

  // Log User out
  logout() {
    API.clearTokens();
    window.location.href = '../index.html';
  },

  // Theme Management removed per requirement
};
