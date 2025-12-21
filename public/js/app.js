// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
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
    
    // Set up tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Here you would typically show/hide different sections based on the tab
            // For now, we'll just show a message
            const tab = button.getAttribute('data-tab');
            console.log(`Switched to ${tab} tab`);
        });
    });
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
