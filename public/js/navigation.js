// navigation.js - Handles all navigation and button functionality

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    // If not on login page and no token, redirect to login
    if (!token && !currentPage.includes('login.html') && currentPage !== '') {
        window.location.href = '/login.html';
        return;
    }

    // Set active tab based on current page
    const pageToTabMap = {
        'index.html': 'enhance',
        'battle.html': 'battle',
        'ranking.html': 'ranking',
        'profile.html': 'profile',
        'shop.html': 'shop'
    };
    
    const currentTab = pageToTabMap[currentPage] || 'enhance';
    updateActiveTab(currentTab);

    // Navigation buttons mapping
    const navButtons = {
        // Enhancement page
        'enhance-btn': 'index.html',
        'nav-enhance': 'index.html',
        
        // Battle page
        'battle-btn': 'battle.html',
        'nav-battle': 'battle.html',
        
        // Ranking page
        'ranking-btn': 'ranking.html',
        'nav-ranking': 'ranking.html',
        
        // Profile page
        'profile-btn': 'profile.html',
        'nav-profile': 'profile.html',
        
        // Shop page
        'shop-btn': 'shop.html',
        'nav-shop': 'shop.html',
        
        // Logout functionality
        'logout-btn': () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    };

    // Handle tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.getAttribute('data-tab');
            const pageMap = {
                'enhance': 'index.html',
                'battle': 'battle.html',
                'ranking': 'ranking.html',
                'profile': 'profile.html',
                'shop': 'shop.html'
            };
            
            if (pageMap[tabName]) {
                window.location.href = pageMap[tabName];
            }
        });
    });

    // Attach click handlers to all navigation buttons
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

    // Update active tab in navigation
    function updateActiveTab(activeTab) {
        document.querySelectorAll('[data-tab]').forEach(tab => {
            if (tab.getAttribute('data-tab') === activeTab) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    // Highlight current page in navigation
    const currentPageId = {
        'index.html': 'nav-enhance',
        'battle.html': 'nav-battle',
        'ranking.html': 'nav-ranking',
        'profile.html': 'nav-profile',
        'shop.html': 'nav-shop'
    }[currentPage];

    if (currentPageId) {
        const currentNav = document.getElementById(currentPageId);
        if (currentNav) {
            currentNav.classList.add('active');
        }
    }

    // Update user info if on main pages
    if (token && !currentPage.includes('login.html')) {
        updateUserInfo();
    }
});

// Function to update user info in the UI
async function updateUserInfo() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Update username display
            const usernameElements = document.querySelectorAll('.username-display');
            usernameElements.forEach(el => {
                el.textContent = userData.username;
            });
            
            // Update currency displays
            if (userData.gold !== undefined) {
                document.getElementById('gold-display')?.textContent = userData.gold.toLocaleString();
            }
            if (userData.choco !== undefined) {
                document.getElementById('choco-display')?.textContent = userData.choco.toLocaleString();
            }
            if (userData.money !== undefined) {
                document.getElementById('money-display')?.textContent = userData.money.toLocaleString();
            }
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

// Initialize tooltips
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(tooltip => {
        const tooltipText = tooltip.getAttribute('data-tooltip');
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'tooltip';
        tooltipElement.textContent = tooltipText;
        
        tooltip.addEventListener('mouseenter', () => {
            document.body.appendChild(tooltipElement);
            const rect = tooltip.getBoundingClientRect();
            tooltipElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
            tooltipElement.style.left = `${rect.left + window.scrollX}px`;
            tooltipElement.classList.add('show');
        });
        
        tooltip.addEventListener('mouseleave', () => {
            tooltipElement.remove();
        });
    });
}

// Add this to your CSS:
/*
.tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    pointer-events: none;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.2s;
    max-width: 200px;
    text-align: center;
}

.tooltip.show {
    opacity: 1;
}
*/

// Export for use in other files
window.navigation = {
    updateUserInfo,
    initTooltips
};
