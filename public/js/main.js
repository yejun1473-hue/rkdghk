// main.js
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const isLoginPage = window.location.pathname.endsWith('login.html') || 
                       window.location.pathname === '/' ||
                       window.location.pathname.endsWith('/');
    
    if (!token && !isLoginPage) {
        window.location.href = '/login.html';
        return;
    }

    // Navigation buttons
    const navButtons = {
        'enhance-btn': 'enhance.html',
        'battle-btn': 'battle.html',
        'ranking-btn': 'ranking.html',
        'profile-btn': 'profile.html',
        'shop-btn': 'shop.html',
        'logout-btn': () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    };

    // Attach click handlers
    Object.entries(navButtons).forEach(([id, action]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof action === 'function') {
                    action();
                } else {
                    window.location.href = action;
                }
            });
        }
    });

    // API base URL
    window.API_BASE_URL = 'http://localhost:3000/api';
});
