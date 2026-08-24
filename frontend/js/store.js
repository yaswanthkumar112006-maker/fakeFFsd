const apiBase = 'http://localhost:3000/api';

class DataStore {
    constructor() {
        this.fallbackData = {
            users: [],
            departments: [],
            requests: [],
            resources: [],
            procurements: [],
            notifications: [],
            maintenanceHistory: [],
            returnHistory: [],
            permissionsMatrix: {},
            stockThresholds: [],
            resourceCatalog: [],
            currentUser: null
        };
        this.init();
    }

    init() {
        if (!localStorage.getItem('rx_data')) {
            this.saveData(this.fallbackData);
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem('rx_data')) || { ...this.fallbackData };
    }

    saveData(data) {
        localStorage.setItem('rx_data', JSON.stringify(data));
    }

    getCurrentUser() {
        return this.getData().currentUser;
    }

    setCurrentUser(user) {
        const data = this.getData();
        data.currentUser = user || null;
        this.saveData(data);
    }

    getHeaders(extra = {}) {
        const user = this.getCurrentUser();
        const headers = {};
        if (user && user.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }
        return { ...headers, ...extra };
    }

    buildQuery(params = {}) {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== 'All') {
                search.append(key, value);
            }
        });
        const query = search.toString();
        return query ? `?${query}` : '';
    }

    async api(path, options = {}) {
        const config = {
            method: options.method || 'GET',
            headers: this.getHeaders(options.headers || {}),
        };

        if (options.body !== undefined) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(options.body);
        }

        const res = await fetch(`${apiBase}${path}`, config);
        if (!res.ok) {
            let message = `Request failed (${res.status})`;
            try {
                const error = await res.json();
                message = error.message || error.error || message;
            } catch (e) { }
            throw new Error(message);
        }

        if (res.status === 204) return null;
        const contentType = res.headers.get('content-type') || '';
        return contentType.includes('application/json') ? res.json() : null;
    }

    async sync() {
        const collections = {
            users: '/users',
            departments: '/departments',
            requests: '/requests',
            resources: '/resources',
            procurements: '/procurements',
            notifications: '/notifications',
            maintenanceHistory: '/maintenance/history',
            returnHistory: '/returns/history',
            permissionsMatrix: '/permissionsMatrix',
            stockThresholds: '/analytics/stock',
            resourceCatalog: '/resources/catalog'
        };
        const currentUser = this.getCurrentUser();
        const next = { ...this.getData() };

        for (const [col, path] of Object.entries(collections)) {
            try {
                next[col] = await this.api(path);
            } catch (error) {
                console.error(`Failed to sync ${col}:`, error);
            }
        }

        next.currentUser = currentUser;
        this.saveData(next);
        return next;
    }

    async login(email, password) {
        try {
            // First, make raw fetch without auth headers since it's a public endpoint
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                return null;
            }

            const data = await res.json();
            if (data && data.access_token) {
                const userObj = {
                    ...data.user,
                    token: data.access_token
                };
                this.setCurrentUser(userObj);
                await this.sync();
                return userObj;
            }
            return null;
        } catch (err) {
            console.error('Login Error:', err);
            return null;
        }
    }

    logout() {
        this.setCurrentUser(null);
    }

    async fetchMyOrganization() {
        return this.api('/organizations/my-org/details');
    }

    async fetchSubscriptionPlans() {
        return this.api('/subscriptions/plans');
    }

    async updateSubscription(planId) {
        return this.api('/organizations/my-org/subscription', {
            method: 'PATCH',
            body: { planId }
        });
    }

    async fetchUsers() {
        return this.api('/users');
    }

    async createUser(payload) {
        const result = await this.api('/users', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async updateUser(id, payload) {
        const result = await this.api(`/users/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async deactivateUser(id) {
        const result = await this.api(`/users/${id}`, { method: 'DELETE' });
        await this.sync();
        return result;
    }

    async fetchDepartments() {
        return this.api('/departments');
    }

    async createDepartment(payload) {
        const result = await this.api('/departments', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async updateDepartment(id, payload) {
        const result = await this.api(`/departments/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async deleteDepartment(id) {
        const result = await this.api(`/departments/${id}`, { method: 'DELETE' });
        await this.sync();
        return result;
    }

    async fetchRequests(params = {}) {
        return this.api(`/requests${this.buildQuery(params)}`);
    }

    async createRequest(payload) {
        const result = await this.api('/requests', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async fetchResources(params = {}) {
        return this.api(`/resources${this.buildQuery(params)}`);
    }

    async fetchResourceAvailability(department, type) {
        return this.api(`/resources/availability${this.buildQuery({ department, type })}`);
    }

    async fetchResourceCatalog(params = {}) {
        try {
            return await this.api(`/resources/catalog${this.buildQuery(params)}`);
        } catch (error) {
            console.warn('Failed to fetch resource catalog:', error);
            return [];
        }
    }

    async updateResourceCatalog(department, resourceTypes) {
        const result = await this.api('/resources/catalog', {
            method: 'POST',
            body: { department, resourceTypes }
        });
        await this.sync();
        return result;
    }

    getDepartmentResourceTypes(department) {
        const catalog = this.getData().resourceCatalog || [];
        const entry = catalog.find(item => item.department === department);
        return entry ? [...entry.resourceTypes] : [];
    }

    async createResource(payload) {
        const result = await this.api('/resources', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async updateResource(id, payload) {
        const result = await this.api(`/resources/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async scrapResource(id) {
        const result = await this.api(`/resources/${id}/scrap`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async fetchProcurements(params = {}) {
        return this.api(`/procurements${this.buildQuery(params)}`);
    }

    async createProcurement(payload) {
        const result = await this.api('/procurements', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async fetchNotifications() {
        return this.api('/notifications');
    }

    async updateNotification(id, payload) {
        const result = await this.api(`/notifications/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async fetchPermissionsMatrix() {
        return this.api('/permissionsMatrix');
    }

    async updatePermissionsMatrix(payload) {
        const result = await this.api('/permissionsMatrix', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async resetPermissionsMatrix() {
        const result = await this.api('/permissionsMatrix/reset', { method: 'POST' });
        await this.sync();
        return result;
    }

    async fetchRequestorSummary() {
        return this.api('/analytics/requestor-summary');
    }

    async fetchDepartmentSummary() {
        return this.api('/analytics/department-summary');
    }

    async fetchRegistrarSummary() {
        return this.api('/analytics/registrar-summary');
    }

    async fetchStock() {
        return this.api('/analytics/stock');
    }

    async fetchMaintenanceHistory() {
        return this.api('/maintenance/history');
    }

    async fetchReturnHistory() {
        return this.api('/returns/history');
    }

    addItem(collection, item) {
        const data = this.getData();
        if (!Array.isArray(data[collection])) data[collection] = [];
        data[collection].unshift(item);
        this.saveData(data);

        this.api(`/${collection}`, { method: 'POST', body: item })
            .then(() => this.sync())
            .catch(err => console.error('API Error:', err));

        return item;
    }

    updateItem(collection, id, updates) {
        const data = this.getData();
        const items = Array.isArray(data[collection]) ? data[collection] : [];
        const index = items.findIndex(i => (i.id || i.code) === id);
        if (index > -1) {
            items[index] = { ...items[index], ...updates };
            this.saveData(data);
        }

        this.api(`/${collection}/${id}`, { method: 'PATCH', body: updates })
            .then(() => this.sync())
            .catch(err => console.error('API Error:', err));

        return index > -1 ? items[index] : null;
    }

    deleteItem(collection, id) {
        const data = this.getData();
        data[collection] = (data[collection] || []).filter(i => (i.id || i.code) !== id);
        this.saveData(data);

        this.api(`/${collection}/${id}`, { method: 'DELETE' })
            .then(() => this.sync())
            .catch(err => console.error('API Error:', err));
    }

    async approveRequest(id) {
        const result = await this.api(`/requests/${id}/approve`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async rejectRequest(id) {
        const result = await this.api(`/requests/${id}/reject`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async allocateRequest(id, resourceIds) {
        const result = await this.api(`/requests/${id}/allocate`, {
            method: 'POST',
            body: { resourceIds }
        });
        await this.sync();
        return result;
    }

    async confirmReceipt(id) {
        const result = await this.api(`/requests/${id}/receipt`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async requestMaintenance(id) {
        const result = await this.api(`/resources/${id}/maintenance-request`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async initiateReturn(id) {
        const result = await this.api(`/resources/${id}/initiate-return`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async confirmRepairedAllocation(id) {
        const result = await this.api(`/resources/${id}/confirm-repaired`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async approveDeptProcurement(id) {
        const result = await this.api(`/procurements/${id}/department-approve`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async rejectDeptProcurement(id) {
        const result = await this.api(`/procurements/${id}/department-reject`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async approveRegistrarProcurement(id) {
        const result = await this.api(`/procurements/${id}/registrar-approve`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async rejectRegistrarProcurement(id) {
        const result = await this.api(`/procurements/${id}/registrar-reject`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async logPurchase(id, vendor, invoice) {
        const result = await this.api(`/procurements/${id}/log-purchase`, {
            method: 'POST',
            body: { vendor, invoice }
        });
        await this.sync();
        return result;
    }

    async registerProcurement(id, resources) {
        const result = await this.api(`/procurements/${id}/register`, {
            method: 'POST',
            body: { resources }
        });
        await this.sync();
        return result;
    }

    async acceptMaintenance(id) {
        const result = await this.api(`/maintenance/${id}/accept`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async repairMaintenance(id) {
        const result = await this.api(`/maintenance/${id}/repair`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async scrapMaintenance(id) {
        const result = await this.api(`/maintenance/${id}/scrap`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async processReturn(id, condition) {
        const result = await this.api(`/returns/${id}/process`, {
            method: 'POST',
            body: { condition }
        });
        await this.sync();
        return result;
    }

    async updateStockThreshold(id, level) {
        const result = await this.api(`/analytics/stock-thresholds/${id}/${level}`, {
            method: 'PATCH'
        });
        await this.sync();
        return result;
    }

    async getProfile() {
        return this.api('/profile/me');
    }

    async updateProfile(payload) {
        const result = await this.api('/profile/me', { method: 'PATCH', body: payload });
        const current = this.getCurrentUser();
        this.setCurrentUser({ ...current, ...result });
        await this.sync();
        return result;
    }

    async updatePassword(payload) {
        return this.api('/profile/me/password', { method: 'POST', body: payload });
    }

    showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚠️');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 3000);
    }

    filterTable(inputEl, tbodyId) {
        const term = inputEl.value.toLowerCase();
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    }

    globalSearch(term) {
        const activeView = document.querySelector('.view-section.active');
        if (!activeView) return;
        const normalizedTerm = term.toLowerCase();
        activeView.querySelectorAll('tbody tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(normalizedTerm) ? '' : 'none';
        });
    }
}

const Store = new DataStore();
