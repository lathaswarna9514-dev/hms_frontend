/* ============================================================
   eDoc HMS — Utilities & Shared UI Components Helper
   ============================================================ */

const Utils = {
  // Format Date (DD-MM-YYYY)
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  // Format Date and Time
  formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  // Format Currency (INR / Rupees)
  formatCurrency(amount) {
    const val = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  },

  // Show Toast Notification
  showToast(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Bind close click
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Debounce API queries (e.g. search bars)
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Toggle Modal open/close
  toggleModal(modalId, action = 'open') {
    const modalBackdrop = document.getElementById(modalId);
    if (!modalBackdrop) return;
    if (action === 'open') {
      modalBackdrop.classList.add('open');
    } else {
      modalBackdrop.classList.remove('open');
    }
  },

  // Parse Query Parameters from URL
  getQueryParams() {
    const params = {};
    const search = window.location.search.substring(1);
    if (!search) return params;
    const pairs = search.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    return params;
  },

  // Render Premium Side Menu Layout dynamically based on Portal
  renderSidebar(menuItems, activePath, brandTitle = 'eDoc HMS', brandSubtitle = '') {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const user = Auth.getUser() || { name: 'User', role: 'Staff' };

    let html = `
      <div class="sidebar-brand">
        <div class="sidebar-brand-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </div>
        <div>
          <div class="sidebar-brand-title" style="color: var(--foreground);">${brandTitle}</div>
          ${brandSubtitle ? `<div style="font-size: var(--text-xs); color: var(--muted); font-weight: 600;">${brandSubtitle}</div>` : ''}
        </div>
      </div>
      <ul class="sidebar-menu">
    `;

    menuItems.forEach((item, index) => {
      const hasSub = item.subItems && item.subItems.length > 0;
      const isActive = activePath === item.path || (hasSub && item.subItems.some(sub => sub.path === activePath));

      html += `
        <li>
          <div class="sidebar-item ${isActive ? 'active' : ''}" data-index="${index}" data-path="${item.path || ''}" onclick="Utils.handleSidebarItemClick(this, ${hasSub})">
            <span class="sidebar-item-icon">
              ${item.iconSvg}
            </span>
            <span class="flex-1">${item.label}</span>
            ${hasSub ? `
              <span class="sidebar-item-chevron" style="transition: transform var(--transition); transform: ${isActive ? 'rotate(90deg)' : 'rotate(0deg)'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            ` : ''}
          </div>
          ${hasSub ? `
            <ul class="sidebar-submenu ${isActive ? 'open' : ''}" id="submenu-${index}">
              ${item.subItems.map(sub => `
                <li>
                  <a href="${sub.path}" class="sidebar-subitem ${activePath === sub.path ? 'active' : ''}">
                    ${sub.label}
                  </a>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </li>
      `;
    });

    html += `
      </ul>
    `;

    sidebar.innerHTML = html;
  },

  handleSidebarItemClick(element, hasSub) {
    if (!hasSub) {
      const path = element.getAttribute('data-path');
      if (path && path !== 'undefined') window.location.href = path;
      return;
    }
    
    const idx = element.getAttribute('data-index');
    const submenu = document.getElementById(`submenu-${idx}`);
    const chevron = element.querySelector('.sidebar-item-chevron');
    
    if (submenu.classList.contains('open')) {
      submenu.classList.remove('open');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    } else {
      submenu.classList.add('open');
      if (chevron) chevron.style.transform = 'rotate(90deg)';
    }
  },

  // Render Top Header Area with dynamic title details
  renderHeader(title = 'Dashboard') {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    let header = document.querySelector('.header');
    if (!header) {
      header = document.createElement('header');
      header.className = 'header';
      mainContent.insertBefore(header, mainContent.firstChild);
    }

    const user = Auth.getUser() || { name: 'User', role: 'Staff' };

    header.innerHTML = `
      <div class="header-left">
        <button class="sidebar-toggle-btn" onclick="document.querySelector('.sidebar').classList.toggle('open')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
        <h3 class="font-bold">${title}</h3>
      </div>
      <div class="header-right">
        <div class="profile-dropdown">
          <button class="profile-trigger" onclick="document.querySelector('.profile-menu').classList.toggle('open')">
            <div class="profile-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="profile-info md:block hidden">
              <div class="profile-name">${user.name}</div>
              <div class="profile-role">${user.role}</div>
            </div>
          </button>
          <div class="profile-menu">
            <button class="profile-menu-item" onclick="window.location.href='profile.html'">My Profile</button>
            <div class="divider" style="margin: 0.25rem 0;"></div>
            <button class="profile-menu-item logout" onclick="Auth.logout()">Logout</button>
          </div>
        </div>
      </div>
    `;

    // Click outside to close profile dropdown
    document.addEventListener('click', (e) => {
      const drop = document.querySelector('.profile-dropdown');
      const menu = document.querySelector('.profile-menu');
      if (drop && menu && !drop.contains(e.target)) {
        menu.classList.remove('open');
      }
    });
  },

  // Render Custom Pagination Component
  renderPagination(containerId, totalCount, currentPage, pageSize, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Standardize variables to numbers
    const count = parseInt(totalCount || 0, 10);
    const pageVal = parseInt(currentPage || 1, 10);
    const sizeVal = parseInt(pageSize || 15, 10);

    const totalPages = Math.max(1, Math.ceil(count / sizeVal));
    const prevPagesCount = Math.max(0, pageVal - 1);
    const nextPagesCount = Math.max(0, totalPages - pageVal);

    container.className = 'pagination-wrapper';
    container.innerHTML = `
      <!-- Component 1: Pagination Controls -->
      <div class="pagination-container">
        <span class="pagination-count-label prev-count">${prevPagesCount} prev</span>
        <button class="pagination-btn prev-btn" ${pageVal <= 1 ? 'disabled' : ''} aria-label="Previous Page">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="pagination-current">Page ${pageVal} of ${totalPages}</span>
        <button class="pagination-btn next-btn" ${pageVal >= totalPages ? 'disabled' : ''} aria-label="Next Page">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <span class="pagination-count-label next-count">${nextPagesCount} next</span>
      </div>
      
      <!-- Component 2: Overall Records Count Stat (Separate Badge Component) -->
      <div class="pagination-records-badge">
        <span class="badge-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </span>
        <span class="badge-text">Total Records: <strong>${count}</strong></span>
      </div>
    `;

    // Dynamic placement: Put pagination in the same row as heading + button
    try {
      const candidates = document.querySelectorAll(
        '.content-wrapper h1, .content-wrapper h2, .content-wrapper h3, ' +
        '.dash-body h1, .dash-body h2, .dash-body h3, ' +
        '.dash-body p[style*="font-size: 20px"], .dash-body p[style*="font-size:20px"]'
      );
      let heading = null;
      for (const el of candidates) {
        if (!el.closest('.card') && !el.closest('.modal') && !el.closest('.popup') && !el.closest('.overlay')) {
          heading = el;
          break;
        }
      }

      if (heading) {
        // Find the main row — could be .flex.justify-between or heading's grandparent
        let titleRow = heading.closest('.flex.justify-between');
        if (!titleRow) titleRow = heading.closest('.page-title-row');

        if (titleRow && !titleRow.classList.contains('page-title-row')) {
          // Already a flex row with heading + button — mark it
          titleRow.classList.add('page-title-row');
        } else if (!titleRow) {
          // No flex wrapper — the heading is in a plain div.
          // Wrap heading's parent into a page-title-row
          const headingParent = heading.parentNode;
          const grandParent = headingParent.parentNode;
          if (grandParent && !headingParent.classList.contains('page-title-row')) {
            headingParent.classList.add('page-title-row');
          }
          titleRow = headingParent;
        }

        // Insert pagination-wrapper into the row (before the button if one exists)
        if (titleRow && container.parentNode !== titleRow) {
          // Find the button (last child that is a button/anchor)
          const btn = titleRow.querySelector(':scope > button, :scope > a.btn');
          if (btn) {
            titleRow.insertBefore(container, btn);
          } else {
            titleRow.appendChild(container);
          }
        }
      }
    } catch (e) {
      console.error("Error moving pagination container next to heading:", e);
    }

    const prevBtn = container.querySelector('.prev-btn');
    const nextBtn = container.querySelector('.next-btn');

    if (prevBtn && pageVal > 1) {
      prevBtn.onclick = (e) => {
        e.preventDefault();
        onPageChange(pageVal - 1);
      };
    }
    if (nextBtn && pageVal < totalPages) {
      nextBtn.onclick = (e) => {
        e.preventDefault();
        onPageChange(pageVal + 1);
      };
    }
  }
};

// ============================================================
// Global Form Caching & Value Recovery helper
// ============================================================
(function() {
  function saveInputState(input) {
    if (input.type === 'password' || input.type === 'file' || input.type === 'hidden') return;
    if (!input.id && !input.name) return;
    const key = `form_persist:${window.location.pathname}:${input.id || input.name}`;
    if (input.type === 'checkbox') {
      localStorage.setItem(key, input.checked ? 'true' : 'false');
    } else if (input.type === 'radio') {
      if (input.checked) {
        localStorage.setItem(`form_persist_radio:${window.location.pathname}:${input.name}`, input.id || input.value);
      }
    } else {
      localStorage.setItem(key, input.value);
    }
  }

  function restoreInputState(input) {
    if (input.type === 'password' || input.type === 'file' || input.type === 'hidden') return;
    if (!input.id && !input.name) return;
    const key = `form_persist:${window.location.pathname}:${input.id || input.name}`;
    
    if (input.type === 'checkbox') {
      const val = localStorage.getItem(key);
      if (val !== null) {
        input.checked = val === 'true';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (input.type === 'radio') {
      const radioGroupKey = `form_persist_radio:${window.location.pathname}:${input.name}`;
      const savedVal = localStorage.getItem(radioGroupKey);
      if (savedVal !== null && (input.id === savedVal || input.value === savedVal)) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      const val = localStorage.getItem(key);
      if (val !== null) {
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  function clearFormState(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.id || input.name) {
        const key = `form_persist:${window.location.pathname}:${input.id || input.name}`;
        localStorage.removeItem(key);
        if (input.type === 'radio') {
          localStorage.removeItem(`form_persist_radio:${window.location.pathname}:${input.name}`);
        }
      }
    });
  }

  // Setup Global Form Hooks
  document.addEventListener('DOMContentLoaded', () => {
    // Restore all inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      restoreInputState(input);
    });

    // Listen to changes to save state
    document.addEventListener('input', (e) => {
      const input = e.target;
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
        saveInputState(input);
      }
    });

    document.addEventListener('change', (e) => {
      const input = e.target;
      if (input.tagName === 'SELECT' || input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
        saveInputState(input);
      }
    });

    // Clear inputs on form submit
    document.addEventListener('submit', (e) => {
      if (e.target.tagName === 'FORM') {
        clearFormState(e.target);
      }
    });

    // Clear inputs on form reset
    document.addEventListener('reset', (e) => {
      if (e.target.tagName === 'FORM') {
        clearFormState(e.target);
      }
    });

    // Handle clicks on any button that functions as a reset or cancel
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, input[type="button"]');
      if (btn && btn.form) {
        const text = (btn.innerText || btn.value || '').toLowerCase();
        if (text.includes('reset') || text.includes('cancel')) {
          clearFormState(btn.form);
        }
      }
    });

    // Dynamically add a "Reset Form" button if a form has a submit button but no reset/cancel button
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      // Skip simple/search forms without an explicit submit button
      const submitBtn = form.querySelector('[type="submit"]') || form.querySelector('button:not([type="button"])');
      if (!submitBtn) return;
      
      let hasReset = form.querySelector('[type="reset"]') || form.querySelector('.btn-reset') || form.querySelector('.btn-reset-form');
      if (!hasReset) {
        // Also check if any button contains the text "reset" or "cancel"
        const buttons = form.querySelectorAll('button, input[type="button"]');
        for (const btn of buttons) {
          const text = (btn.innerText || btn.value || '').toLowerCase();
          if (text.includes('reset') || text.includes('cancel')) {
            hasReset = btn;
            break;
          }
        }
      }

      if (!hasReset) {
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'btn btn-secondary btn-sm btn-reset-form';
        resetBtn.innerText = 'Reset Form';
        resetBtn.style.marginLeft = '8px';
        resetBtn.style.marginTop = '4px';
        resetBtn.style.display = 'inline-flex';
        resetBtn.style.alignItems = 'center';
        
        resetBtn.addEventListener('click', () => {
          form.reset();
          clearFormState(form);
          
          // Re-trigger change events on inputs to update UI bindings if any
          const formInputs = form.querySelectorAll('input, select, textarea');
          formInputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
              input.checked = input.defaultChecked;
            } else {
              input.value = input.defaultValue || '';
            }
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
          
          if (window.Utils && typeof window.Utils.showToast === 'function') {
            window.Utils.showToast('Form cleared', 'info');
          }
        });

        // Insert after the submit button
        if (submitBtn.nextSibling) {
          submitBtn.parentNode.insertBefore(resetBtn, submitBtn.nextSibling);
        } else {
          submitBtn.parentNode.appendChild(resetBtn);
        }
      }
    });
  });
})();
