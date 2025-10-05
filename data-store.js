(function (global) {
    const API_BASE = '/api';
    const TOKEN_KEY = 'smartAviationToken';
    const USER_KEY = 'smartAviationUser';

    const getStoredToken = () => sessionStorage.getItem(TOKEN_KEY) || null;
    const getStoredUser = () => {
        try {
            const raw = sessionStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('Erro ao ler usuário armazenado', error);
            return null;
        }
    };

    const setSession = (token, user) => {
        if (!token) {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
            return;
        }
        sessionStorage.setItem(TOKEN_KEY, token);
        if (user) {
            sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    };

    const request = async (endpoint, options = {}) => {
        const {
            method = 'GET',
            body,
            auth = false,
            headers = {},
            isForm = false
        } = options;

        const config = {
            method,
            headers: { ...headers }
        };

        if (auth) {
            const token = getStoredToken();
            if (!token) {
                throw new Error('Sessão não encontrada. Faça login novamente.');
            }
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (body) {
            if (isForm) {
                config.body = body;
            } else {
                config.headers['Content-Type'] = 'application/json';
                config.body = JSON.stringify(body);
            }
        }

        const response = await fetch(`${API_BASE}${endpoint}`, config);
        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            let message = errorText;
            try {
                const parsed = JSON.parse(errorText);
                message = parsed.message || errorText;
            } catch (_) {
                message = errorText || response.statusText;
            }
            const error = new Error(message || 'Erro na requisição.');
            error.status = response.status;
            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return response.text();
    };

    const api = {
        getSession() {
            return {
                token: getStoredToken(),
                user: getStoredUser()
            };
        },
        setSession,
        async login(email, password) {
            const result = await request('/login', {
                method: 'POST',
                body: { email, password }
            });
            setSession(result.token, result.user);
            return result;
        },
        async logout() {
            try {
                await request('/logout', { method: 'POST', auth: true });
            } finally {
                setSession(null, null);
            }
        },
        async getContent() {
            return request('/content');
        },
        async submitRequest(payload) {
            return request('/requests', {
                method: 'POST',
                body: payload
            });
        },
        async getRequests() {
            return request('/requests', {
                auth: true
            });
        },
        async updateRequestStatus(id, status) {
            return request(`/requests/${id}`, {
                method: 'PATCH',
                auth: true,
                body: { status }
            });
        },
        async updateHero(payload) {
            return request('/hero', {
                method: 'PUT',
                auth: true,
                body: payload
            });
        },
        async updateBanner(payload) {
            return request('/banner', {
                method: 'PUT',
                auth: true,
                body: payload
            });
        },
        async createProduct(formData) {
            return request('/products', {
                method: 'POST',
                auth: true,
                body: formData,
                isForm: true
            });
        },
        async deleteProduct(id) {
            return request(`/products/${id}`, {
                method: 'DELETE',
                auth: true
            });
        },
        async getUsers() {
            return request('/users', {
                auth: true
            });
        },
        async createUser(payload) {
            return request('/users', {
                method: 'POST',
                auth: true,
                body: payload
            });
        },
        async deleteUser(id) {
            return request(`/users/${id}`, {
                method: 'DELETE',
                auth: true
            });
        }
    };

    global.SmartAviationApi = api;
})(window);
