// Global notification function
window.addNotification = function(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to the page
    document.body.appendChild(notification);
    
    // Auto-remove after delay
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
};

// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Initialize the game object if it doesn't exist
    window.game = window.game || {};
    
    // Show login modal function
    window.game.showLoginModal = function() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
    
    // Hide login modal function
    window.game.hideLoginModal = function() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // Game initialization
    window.game.init = async function() {
        try {
            console.log('Initializing game...');
            // Add your game initialization code here
            
            // Update UI based on login state
            const token = localStorage.getItem('token');
            if (token) {
                // If we have a token but no username, set a default
                const usernameDisplay = document.getElementById('username');
                if (usernameDisplay && usernameDisplay.textContent === '게스트') {
                    usernameDisplay.textContent = '사용자';
                }
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error('Game initialization error:', error);
            return Promise.reject(error);
        }
    };
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    
    if (token) {
        // Initialize the game
        window.game.init().catch(error => {
            console.error('Failed to initialize game:', error);
            // Don't show login modal on error to prevent loops
        });
    }
});

// Service worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Handle offline/online status
window.addEventListener('online', () => {
    addNotification('인터넷에 다시 연결되었습니다.', 'success');
});

window.addEventListener('offline', () => {
    addNotification('인터넷 연결이 끊어졌습니다. 일부 기능이 제한됩니다.', 'warning');
});

// Add a global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', { message, source, lineno, colno, error });
    addNotification('오류가 발생했습니다. 페이지를 새로고침 해주세요.', 'danger');
    return false; // Prevent the default error handler
};

// Add a global unhandled rejection handler
window.onunhandledrejection = function(event) {
    console.error('Unhandled rejection:', event.reason);
    addNotification('처리 중 오류가 발생했습니다.', 'danger');
};
