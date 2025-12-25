// API Service for backend communication
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3001/api';
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
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
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
