/**
 * Admin Portal Navigation Generator
 */

import { ApiService } from '../services/api.js';

export function initNavigation(activeTab = 'dashboard') {
    // 1. Verify Authentication
    if (!ApiService.auth.isAuthenticated()) {
        window.location.href = '../admin-login.html';
        return;
    }

    const user = ApiService.auth.getUser();
    if (user.usertype !== 'a') {
        window.location.href = '../admin-login.html';
        return;
    }

    // 2. Render Sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = `
            <div class="menu">
                <table class="menu-container" border="0">
                    <tr>
                        <td style="padding:30px;text-align:center">
                            <p style="margin:0;padding:0"><span class="edoc-logo">eDoc.</span><span class="edoc-logo-sub">| Administrator</span></p>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'dashboard' ? 'menu-active' : ''}">
                            <a href="index.html" class="non-style-link-menu">
                                <div><img src="../img/icons/dashboard.svg" class="menu-icon">&nbsp;&nbsp;Dashboard</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'doctors' ? 'menu-active' : ''}">
                            <a href="doctors.html" class="non-style-link-menu">
                                <div><img src="../img/icons/doctors.svg" class="menu-icon">&nbsp;&nbsp;Doctors</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'schedule' ? 'menu-active' : ''}">
                            <a href="schedule.html" class="non-style-link-menu">
                                <div><img src="../img/icons/session.svg" class="menu-icon">&nbsp;&nbsp;Schedule</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'appointments' ? 'menu-active' : ''}">
                            <a href="appointments.html" class="non-style-link-menu">
                                <div><img src="../img/icons/book.svg" class="menu-icon">&nbsp;&nbsp;Appointments</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'patients' ? 'menu-active' : ''}">
                            <a href="patients.html" class="non-style-link-menu">
                                <div><img src="../img/icons/patients.svg" class="menu-icon">&nbsp;&nbsp;Patients</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn">
                            <button id="logoutBtn" class="non-style-link-menu" style="background:none;border:none;cursor:pointer;width:100%;text-align:left;padding:0;font-size:inherit;">
                                <div><img src="../img/icons/logout.svg" class="menu-icon">&nbsp;&nbsp;Log out</div>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (confirm("Are you sure you want to log out?")) {
                await ApiService.auth.logout();
            }
        });
    }

    // 3. Render Top Header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        const today = new Date().toISOString().split('T')[0];
        headerContainer.innerHTML = `
            <table border="0" width="100%" class="header-table">
                <tr>
                    <td width="10%">
                        <a href="index.html" class="non-style-link"><p class="nav-item">BACK</p></a>
                    </td>
                    <td></td>
                    <td width="30%" style="text-align: right;">
                        <p class="header-date">Today's Date: <span style="font-weight: 600;">${today}</span></p>
                    </td>
                    <td width="20%">
                        <p class="header-user-email">admin@edoc.com</p>
                    </td>
                </tr>
            </table>
        `;
    }

    // 4. Modal control logic: close modal on overlay click or Escape key
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('overlay')) {
            e.target.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.overlay').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

