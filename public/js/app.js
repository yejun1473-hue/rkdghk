// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Initialize the game object if it doesn't exist
    window.game = window.game || {};
    
    // Add showLoginModal method if it doesn't exist
    window.game.showLoginModal = function() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
    
    // Add init method if it doesn't exist
    window.game.init = async function() {
        try {
            console.log('Initializing game...');
            // Add your game initialization code here
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
            window.game.showLoginModal();
        });
    } else {
        // Show login modal if not logged in
        window.game.showLoginModal();
    }
    
    // Add notification function if it doesn't exist
    if (!window.addNotification) {
        window.addNotification = function(message, type = 'info') {
            console.log(`[${type}] ${message}`);
            // You can add a proper notification UI here
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        };
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
