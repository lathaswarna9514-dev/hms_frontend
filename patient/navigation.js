/**
 * Patient Portal Navigation Generator
 * Dynamically injects sidebar and top header to avoid code repetition across pages.
 */

import { ApiService } from '../services/api.js';

export function initNavigation(activeTab = 'dashboard') {
    // 1. Verify Authentication
    if (!ApiService.auth.isAuthenticated()) {
        window.location.href = '../patient-login.html';
        return;
    }

    const user = ApiService.auth.getUser();
    if (user.usertype !== 'p') {
        window.location.href = '../patient-login.html';
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
                            <p style="margin:0;padding:0"><span class="edoc-logo">eDoc.</span><span class="edoc-logo-sub">| Patient</span></p>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'dashboard' ? 'menu-active' : ''}">
                            <a href="index.html" class="non-style-link-menu">
                                <div><img src="../img/icons/dashboard-ice.svg" class="menu-icon">&nbsp;&nbsp;Home</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'self-booking' ? 'menu-active' : ''}">
                            <a href="self-booking.html" class="non-style-link-menu">
                                <div><img src="../img/icons/book.svg" class="menu-icon">&nbsp;&nbsp;Self Booking</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'doctors' ? 'menu-active' : ''}">
                            <a href="doctors.html" class="non-style-link-menu">
                                <div><img src="../img/icons/doctors.svg" class="menu-icon">&nbsp;&nbsp;All Doctors</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'schedule' ? 'menu-active' : ''}">
                            <a href="schedule.html" class="non-style-link-menu">
                                <div><img src="../img/icons/session.svg" class="menu-icon">&nbsp;&nbsp;Scheduled Sessions</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'bookings' ? 'menu-active' : ''}">
                            <a href="bookings.html" class="non-style-link-menu">
                                <div><img src="../img/icons/book.svg" class="menu-icon">&nbsp;&nbsp;My Bookings</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'history' ? 'menu-active' : ''}">
                            <a href="history.html" class="non-style-link-menu">
                                <div><img src="../img/icons/patients.svg" class="menu-icon">&nbsp;&nbsp;My History</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'billing' ? 'menu-active' : ''}">
                            <a href="billing.html" class="non-style-link-menu">
                                <div><img src="../img/icons/book.svg" class="menu-icon">&nbsp;&nbsp;My Bills</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'support' ? 'menu-active' : ''}">
                            <a href="support.html" class="non-style-link-menu">
                                <div><img src="../img/icons/session.svg" class="menu-icon">&nbsp;&nbsp;Help & Support</div>
                            </a>
                        </td>
                    </tr>
                    <tr class="menu-row">
                        <td class="menu-btn ${activeTab === 'settings' ? 'menu-active' : ''}">
                            <a href="settings.html" class="non-style-link-menu">
                                <div><img src="../img/icons/settings.svg" class="menu-icon">&nbsp;&nbsp;Settings</div>
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

    // 3. Render Top Header (User details, date, search bar if needed)
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
                        <p class="header-user-email">${user.email}</p>
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

