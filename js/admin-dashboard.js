/**
 * ADMIN-DASHBOARD.JS
 *
 * JavaScript for admin dashboard functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        // Not authenticated or not admin, redirect to login
        window.location.href = 'admin.html';
        return;
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'admin.html';
    });

    // Display user info
    const dashboardHeader = document.querySelector('.dashboard-header p');
    dashboardHeader.textContent = `Välkommen, ${user.first_name} ${user.last_name}`;

    // Here you could add more dashboard functionality like:
    // - Loading member counts
    // - Loading recent activities
    // - Setting up navigation to different admin sections
});