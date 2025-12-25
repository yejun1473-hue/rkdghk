// navigation.js - Handles all navigation and button functionality

// Simple navigation function
function navigateTo(page) {
    if (page === 'logout') {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return false;
    } else if (page) {
        const target = page.endsWith('.html') ? page : `${page}.html`;
        if (!window.location.href.endsWith(target)) {
            window.location.href = target;
        }
        return false;
    }
    return false;
}

// Handle all navigation buttons and links
function setupNavigation() {
    // Navigation buttons with data-nav attribute
    document.querySelectorAll('[data-nav]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const target = button.getAttribute('data-nav');
            navigateTo(target);
        });
    });

    // Login button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('loginModal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Close modal when clicking outside
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('usernameInput')?.value.trim();
            const password = document.getElementById('codeInput')?.value;
            
            if (!username || !password) {
                alert('사용자명과 코드를 모두 입력해주세요.');
                return;
            }
            
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Store token
                const fakeToken = `fake-jwt-token-${Date.now()}`;
                localStorage.setItem('token', fakeToken);
                
                // Update UI
                const usernameDisplay = document.getElementById('username');
                if (usernameDisplay) {
                    usernameDisplay.textContent = username;
                }
                
                // Show success message
                if (window.addNotification) {
                    window.addNotification('로그인 성공!', 'success');
                } else {
                    alert('로그인 성공!');
                }
                
                // Close modal
                const modal = document.getElementById('loginModal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
                
                // If on login page, redirect to home
                if (window.location.pathname.endsWith('login.html')) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
                
            } catch (error) {
                console.error('Login failed:', error);
                alert('로그인에 실패했습니다. 다시 시도해주세요.');
            }
        });
    }
}

// Update active tab in navigation
function updateActiveTab(activeTab) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-nav') === activeTab) {
            btn.classList.add('active');
        }
    });
}

// Check authentication and handle page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // If we're on login page and have a token, go to home
    if (token && currentPage === 'login.html') {
        window.location.href = 'index.html';
        return;
    }
    
    // If no token and not on login page, go to login
    if (!token && currentPage !== 'login.html') {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize login form if it exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('usernameInput')?.value.trim();
            const password = document.getElementById('codeInput')?.value;
            
            if (!username || !password) {
                alert('사용자명과 코드를 모두 입력해주세요.');
                return;
            }
            
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Store token
                const fakeToken = `fake-jwt-token-${Date.now()}`;
                localStorage.setItem('token', fakeToken);
                
                // Update UI
                const usernameDisplay = document.getElementById('username');
                if (usernameDisplay) {
                    usernameDisplay.textContent = username;
                }
                
                // Show success message
                if (window.addNotification) {
                    window.addNotification('로그인 성공!', 'success');
                } else {
                    alert('로그인 성공!');
                }
                
                // Close modal if it's open
                const modal = document.getElementById('loginModal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
                
                // If on login page, redirect to home after a short delay
                if (window.location.pathname.endsWith('login.html')) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
                
            } catch (error) {
                console.error('Login failed:', error);
                alert('로그인에 실패했습니다. 다시 시도해주세요.');
            }
        });
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

    // Handle all navigation buttons and links
    function setupNavigation() {
        // Navigation buttons with data-nav attribute
        document.querySelectorAll('[data-nav]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = button.getAttribute('data-nav');
                navigateTo(target);
            });
        });

        // Login button
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = document.getElementById('loginModal');
                if (modal) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                } else {
                    navigateTo('login');
                }
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // Handle form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('usernameInput')?.value.trim();
                const password = document.getElementById('codeInput')?.value;
                
                if (!username || !password) {
                    alert('사용자명과 코드를 모두 입력해주세요.');
                    return;
                }
                
                try {
                    // Here you would typically make an API call to your backend
                    // For now, we'll simulate a successful login
                    console.log('Logging in with:', { username });
                    
                    // Simulate API call delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Store the token in localStorage
                    const fakeToken = `fake-jwt-token-${Date.now()}`;
                    localStorage.setItem('token', fakeToken);
                    
                    // Close the modal
                    const modal = document.getElementById('loginModal');
                    if (modal) {
                        modal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }
                    
                    // Update UI
                    const usernameDisplay = document.getElementById('username');
                    if (usernameDisplay) {
                        usernameDisplay.textContent = username;
                    }
                    
                    // Show success message
                    window.addNotification('로그인 성공!', 'success');
                    
                    // If on login page, redirect to home
                    if (window.location.pathname.endsWith('login.html')) {
                        window.location.href = 'index.html';
                    }
                    
                } catch (error) {
                    console.error('Login failed:', error);
                    alert('로그인에 실패했습니다. 다시 시도해주세요.');
                }
            });
        }
    }

    // Initialize navigation
    setupNavigation();

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
