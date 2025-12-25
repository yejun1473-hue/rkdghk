// API Service for backend communication
class ApiService {
    constructor() {
        // Use current host and port for API requests
        const port = window.location.port ? `:${window.location.port}` : '';
        this.baseUrl = `${window.location.protocol}//${window.location.hostname}${port}/api`;
        console.log('API Base URL:', this.baseUrl);
        this.token = localStorage.getItem('token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    // Make authenticated requests
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const fullUrl = `${this.baseUrl}${endpoint}`;
            console.log(`Making request to: ${fullUrl}`, { options });
            
            const response = await fetch(fullUrl, {
                ...options,
                headers,
                credentials: 'include'  // Important for cookies/sessions
            });

            const data = await response.json().catch(() => ({}));
            console.log(`Response from ${endpoint}:`, { status: response.status, data });

            if (!response.ok) {
                const error = new Error(data.error || 'Something went wrong');
                error.status = response.status;
                error.response = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error Details:', {
                message: error.message,
                status: error.status,
                response: error.response,
                stack: error.stack
            });
            throw error;
        }
    }

    // Auth endpoints
    async login(username, code) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, code })
        });
        this.setToken(data.token);
        return data;
    }

    async getProfile() {
        return this.request('/auth/me');
    }

    // Weapon endpoints
    async getWeapons() {
        return this.request('/weapons');
    }

    async createWeapon(name, isHidden = false) {
        return this.request('/weapons', {
            method: 'POST',
            body: JSON.stringify({ name, isHidden })
        });
    }

    async enhanceWeapon(weaponId) {
        return this.request(`/weapons/${weaponId}/enhance`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }

    async sellWeapon(weaponId) {
        return this.request(`/weapons/${weaponId}/sell`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }

    // Global notifications (SSE)
    connectToNotifications(callback) {
        const eventSource = new EventSource(`${this.baseUrl}/notifications`);
        eventSource.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            callback(notification);
        };
        return eventSource;
    }
}

// Create a singleton instance
const api = new ApiService();

// Export the API instance
window.api = api;
