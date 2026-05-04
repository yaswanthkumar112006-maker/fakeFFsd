const app = {
    state: {
        departments: [],
        resourceCatalog: [],
        stock: [],
        requests: [],
        resources: [],
        procurements: [],
        summary: null
    },
    init: async function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Requestor') {
            window.location.href = 'login.html';
            return;
        }
        await this.refreshData();
        
        // Update UI with user info
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'Requestor - ' + user.department;

        this.populateDepartmentDropdowns();
        this.bindNav();
        this.renderDashboard();
        this.renderRequests();
        this.renderResources();
        this.renderProcurements();
    },

    refreshData: async function() {
        const [departments, resourceCatalog, stock, requests, resources, procurements, summary] = await Promise.all([
            Store.fetchDepartments(),
            Store.fetchResourceCatalog(),
            Store.fetchStock(),
            Store.fetchRequests(),
            Store.fetchResources(),
            Store.fetchProcurements(),
            Store.fetchRequestorSummary()
        ]);

        this.state = {
            departments: departments || [],
            resourceCatalog: resourceCatalog || [],
            stock: stock || [],
            requests: requests || [],
            resources: resources || [],
            procurements: procurements || [],
            summary: summary || null
        };
    },

    bindNav: function() {
        const items = document.querySelectorAll('.nav-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                if (targetId) {
                    this.switchView(targetId);
                    items.forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                }
            });
        });
    },

    switchView: function(viewId) {
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(viewId);
        if(targetSection) {
            targetSection.classList.add('active');
        }
    },

    getDepartments: function() {
        return this.state.departments.map(dept => dept.name);
    },

    populateDepartmentDropdowns: function() {
        const departments = this.getDepartments();
        ['req-dept', 'proc-dept'].forEach((id) => {
            const select = document.getElementById(id);
            if (!select) return;

            select.innerHTML = '<option value="" disabled selected>Select Department</option>';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                select.appendChild(option);
            });
        });
    },
    
    getDeptResources: function(dept) {
        const entry = (this.state.resourceCatalog || []).find(item => item.department === dept);
        if (entry && Array.isArray(entry.resourceTypes) && entry.resourceTypes.length) {
            return [...entry.resourceTypes];
        }

        const stockRows = this.state.stock.filter(item => item.department === dept);
        if (stockRows.length) {
            return [...new Set(stockRows.map(item => item.resourceType))];
        }

        const resourceTypes = this.state.resources
            .filter(resource => resource.department === dept)
            .map(resource => resource.type);
        return [...new Set(resourceTypes)];
    },

    updateResourceDropdown: function() {
        const dept = document.getElementById('req-dept').value;
        const typeSelect = document.getElementById('req-type');
        typeSelect.innerHTML = '<option value="" disabled selected>Select Resource Type</option>';
        
        this.getDeptResources(dept).forEach(res => {
            const opt = document.createElement('option');
            opt.value = res;
            opt.textContent = res;
            typeSelect.appendChild(opt);
        });
        
        this.updateResourceCount();
    },

    updateProcurementTypeDropdown: function() {
        const dept = document.getElementById('proc-dept').value;
        const typeSelect = document.getElementById('proc-type');
        if (!typeSelect) return;

        typeSelect.innerHTML = '<option value="" disabled selected>Select Resource Type</option>';
        this.getDeptResources(dept).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    },

    updateResourceCount: async function() {
        const dept = document.getElementById('req-dept').value;
        const type = document.getElementById('req-type').value;
        const countDisplay = document.getElementById('resource-count-display');
        
        if (!countDisplay) return;

        if (!dept || !type) {
            countDisplay.style.display = 'none';
            return;
        }

        const availability = await Store.fetchResourceAvailability(dept, type);
        const availableCount = Number(availability?.availableCount || 0);
        
        countDisplay.textContent = `Available in Inventory: ${availableCount}`;
        countDisplay.style.display = 'block';
        
        // Change color based on availability
        if (availableCount > 0) {
            countDisplay.style.color = '#16a34a'; // Green
        } else {
            countDisplay.style.color = '#dc2626'; // Red
        }
    },

    submitRequest: async function(e) {
        e.preventDefault();
        const dept = document.getElementById('req-dept').value;
        const type = document.getElementById('req-type').value;

        const qty = parseInt(document.getElementById('req-qty').value);
        const reason = document.getElementById('req-reason').value;
        const user = Store.getCurrentUser();

        if (!dept || !type || isNaN(qty) || qty < 1 || !reason.trim()) {
            Store.showToast("Please fill in all fields correctly before submitting.", "error");
            return;
        }

        const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'});

        await Store.createRequest({
            id: newId,
            department: dept,
            resourceType: type,
            quantity: qty,
            requestor: user.name,
            requestorId: user.id,
            status: "Pending",
            priority: "Normal",
            date: dateStr,
            justification: reason
        });
        await this.refreshData();

        Store.showToast("Request Submitted Successfully! ID: " + newId, "success");
        document.getElementById('requestForm').reset();
        
        this.renderDashboard();
        this.renderRequests();
        this.switchView('my-requests-view');
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.nav-item[data-target="my-requests-view"]').classList.add('active');
    },

    submitProcurement: async function(e) {
        e.preventDefault();
        const dept = document.getElementById('proc-dept').value;
        const type = document.getElementById('proc-type').value;
        const qty = parseInt(document.getElementById('proc-qty').value);
        const reason = document.getElementById('proc-reason').value;
        const user = Store.getCurrentUser();

        if (!dept || !type.trim() || isNaN(qty) || qty < 1 || !reason.trim()) {
            Store.showToast("Please fill in all fields correctly before submitting.", "error");
            return;
        }

        const newId = `PRC-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'});

        await Store.createProcurement({
            id: newId,
            item: type,
            resourceType: type,
            department: dept,
            requester: user.name,
            requestedById: user.id,
            quantity: qty,
            status: "Pending Approval",
            priority: "Normal",
            date: dateStr,
            justification: reason
        });
        await this.refreshData();

        Store.showToast("Procurement Request Submitted Successfully! ID: " + newId, "success");
        document.getElementById('procurementForm').reset();
        
        this.renderProcurements();
    },

    renderDashboard: function() {
        const user = Store.getCurrentUser();
        const myRequests = this.state.requests;
        const myResources = this.state.resources;
        const summary = this.state.summary || {};

        const nameSpan = document.getElementById('dash-user-name');
        if(nameSpan) nameSpan.textContent = user.name.split(' ')[0];
        
        // 1. Stats
        const elTotalReq = document.getElementById('dash-total-req');
        const elPendingReq = document.getElementById('dash-pending-req');
        const elMyRes = document.getElementById('dash-my-res');
        const elMaint = document.getElementById('dash-maint');

        if(elTotalReq) elTotalReq.textContent = summary.totalRequests ?? myRequests.length;
        if(elPendingReq) elPendingReq.textContent = summary.pendingRequests ?? myRequests.filter(r => r.status === 'Pending').length;
        if(elMyRes) elMyRes.textContent = summary.allocatedResources ?? myResources.length;
        if(elMaint) elMaint.textContent = summary.maintenanceItems ?? myResources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance').length;

        // 2. Recent Requests Table
        const reqTbody = document.getElementById('dash-requests-tbody');
        if(reqTbody) {
            reqTbody.innerHTML = '';
            myRequests.slice(0, 5).forEach(req => {
                let statusBadge = `<span class="badge ${req.status.toLowerCase()}">${req.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${req.id}</td>
                    <td>${req.resourceType}</td>
                    <td>${req.quantity}</td>
                    <td>${statusBadge}</td>
                `;
                reqTbody.appendChild(tr);
            });
        }

        // 3. My Resources Table
        const resTbody = document.getElementById('dash-resources-tbody');
        if(resTbody) {
            resTbody.innerHTML = '';
            myResources.slice(0, 5).forEach(res => {
                let statusBadge = `<span class="badge ${res.status.toLowerCase()}">${res.status}</span>`;
                if(res.status === 'Allocated') statusBadge = `<span class="badge allocated">${res.status}</span>`;
                else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') statusBadge = `<span class="badge maintenance">${res.status}</span>`;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${res.id}</td>
                    <td>${res.type}</td>
                    <td>${statusBadge}</td>
                `;
                resTbody.appendChild(tr);
            });
        }
        
        // Populate the old My Requests stats
        const statPending = document.getElementById('stat-pending');
        const statApproved = document.getElementById('stat-approved');
        const statAllocated = document.getElementById('stat-allocated');
        
        const pending = summary.pendingRequests ?? myRequests.filter(r => r.status === 'Pending').length;
        const approved = summary.approvedRequests ?? myRequests.filter(r => r.status === 'Approved').length;
        const allocated = summary.allocatedRequests ?? myRequests.filter(r => r.status === 'Allocated').length;

        if(statPending) statPending.textContent = pending.toString().padStart(2, '0');
        if(statApproved) statApproved.textContent = approved.toString().padStart(2, '0');
        if(statAllocated) statAllocated.textContent = allocated.toString().padStart(2, '0');
    },

    renderRequests: function() {
        const tbody = document.getElementById('requests-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        let myRequests = [...this.state.requests];

        // Apply status filter
        const filterEl = document.getElementById('req-status-filter');
        const filterVal = filterEl ? filterEl.value : 'All';
        if (filterVal && filterVal !== 'All') {
            myRequests = myRequests.filter(r => r.status === filterVal);
        }

        myRequests.forEach(req => {
            let statusBadge = `<span class="badge ${req.status.toLowerCase()}">${req.status}</span>`;
            let actions = `<button class="icon-btn">⋮</button>`;
            
            if(req.status === "Allocated") {
                actions = `<button class="btn-primary" style="font-size:0.75rem; padding: 0.4rem 0.8rem;" onclick="app.confirmReceipt('${req.id}')">I RECEIVED</button>`;
            } else if (req.status === "Rejected") {
                actions = `<span title="View Reason">ℹ️</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${req.id}</td>
                <td>${req.department}</td>
                <td>${req.resourceType}</td>
                <td>${String(req.quantity).padStart(2, '0')}</td>
                <td>${req.date}</td>
                <td>${statusBadge}</td>
                <td style="text-align:right">${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderProcurements: function() {
        const tbody = document.getElementById('procurements-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const myProcs = this.state.procurements.filter(p => p.requester === user.name || p.requestedById === user.id);

        myProcs.forEach(proc => {
            let statusBadge = `<span class="badge" style="background:#cbd5e1; color:#0f172a">${proc.status}</span>`;
            if (proc.status === 'Approved' || proc.status === 'Completed') statusBadge = `<span class="badge" style="background:#dcfce7; color:#166534">${proc.status}</span>`;
            else if (proc.status === 'Pending Approval') statusBadge = `<span class="badge pending">${proc.status}</span>`;
            else if (proc.status === 'Rejected') statusBadge = `<span class="badge" style="background:#fee2e2; color:#b91c1c">${proc.status}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${proc.id}</td>
                <td>${proc.item}</td>
                <td>${String(proc.quantity).padStart(2, '0')}</td>
                <td>${proc.date}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    confirmReceipt: async function(reqId) {
        await Store.confirmReceipt(reqId);
        await this.refreshData();
        alert('Item successfully received and confirmed.');
        this.renderDashboard();
        this.renderRequests();
        this.renderResources();
        this.switchView('my-resources-view');
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.nav-item[data-target="my-resources-view"]').classList.add('active');
    },

    renderResources: function() {
        const tbody = document.getElementById('resources-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const myResources = this.state.resources;

        myResources.forEach((res) => {
            let statusBadge = "";
            let actions = "";
            
            if(res.status === 'Allocated') {
                statusBadge = `<span class="badge allocated">${res.status}</span>`;
                actions = `
                    <div style="display:flex; flex-direction:row; gap:0.5rem; justify-content:flex-end">
                        <button class="btn-secondary" style="font-size:0.82rem; padding:0.3rem 0.8rem; white-space:nowrap" onclick="app.requestMaintenance('${res.id}')">🛠 Maintenance</button>
                        <button class="btn-danger" style="font-size:0.82rem; padding:0.3rem 0.8rem; white-space:nowrap" onclick="app.returnResource('${res.id}')">⮌ Return</button>
                    </div>
                `;
            } else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') {
                statusBadge = `<span class="badge maintenance">${res.status}</span>`;
                actions = `<span class="text-muted" style="font-size:0.75rem">Under Review</span>`;
            } else if (res.status === 'Repaired') {
                statusBadge = `<span class="badge allocated" style="background:#dcfce7; color:#166534">Repaired</span>`;
                actions = `<button class="btn-primary" style="font-size:0.75rem" onclick="app.confirmRepairedAllocation('${res.id}')">Confirm Allocation</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${res.id}</td>
                <td>${res.type}</td>
                <td>${res.department}</td>
                <td>${res.date}</td>
                <td>${statusBadge}</td>
                <td style="text-align:right">${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    requestMaintenance: async function(resId) {
        if(confirm("Submit maintenance request for this resource?")) {
            await Store.requestMaintenance(resId);
            await this.refreshData();
            this.renderResources();
        }
    },

    returnResource: async function(resId) {
        if(confirm("Are you sure you want to return this resource? It will be sent to Staff for Verification.")) {
            await Store.initiateReturn(resId);
            await this.refreshData();
            alert("Resource returned successfully. Status moved to Returned.");
            this.renderResources();
        }
    },
    
    confirmRepairedAllocation: async function(resId) {
        await Store.confirmRepairedAllocation(resId);
        await this.refreshData();
        this.renderResources();
    },
    
    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});
