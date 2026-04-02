const deptApp = {
    init: function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Dept Head') {
            window.location.href = 'login.html';
            return;
        }
        
        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = user.department + ' Head';
        
        this.bindNav();
        this.renderIncomingRequests();
        this.renderDeptResources();
        this.renderProcurements();
        this.renderDashboard();
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

    // 1. Incoming Requests
    renderIncomingRequests: function() {
        const tbody = document.getElementById('incoming-requests-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        // Load pending requests for this department
        const requests = Store.getData().requests.filter(r => r.department === user.department && r.status === 'Pending');

        requests.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${req.id}</td>
                <td>${req.requestor}</td>
                <td>${req.resourceType}</td>
                <td>${String(req.quantity).padStart(2, '0')}</td>
                <td style="font-size:0.75rem; color:#64748b">${req.justification}</td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem; background:#16a34a" onclick="deptApp.approveRequest('${req.id}')">Approve</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="deptApp.rejectRequest('${req.id}')">Reject</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Load pending procurements for this department
        const procTbody = document.getElementById('incoming-procurements-tbody');
        if(!procTbody) return;
        procTbody.innerHTML = '';

        const procs = Store.getData().procurements.filter(p => p.department === user.department && p.status === 'Pending Approval');
        procs.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${p.id}</td>
                <td>${p.requester || p.requestedBy || 'Unknown'}</td>
                <td>${p.item || p.resourceType}</td>
                <td>${String(p.quantity).padStart(2, '0')}</td>
                <td style="font-size:0.75rem; color:#64748b">${p.justification}</td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem; background:#16a34a" onclick="deptApp.approveProcurement('${p.id}')">Approve</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="deptApp.rejectProcurement('${p.id}')">Reject</button>
                </td>
            `;
            procTbody.appendChild(tr);
        });
    },

    approveRequest: function(reqId) {
        Store.updateItem('requests', reqId, { status: "Approved" });
        alert('Request approved. It has been passed to Staff for allocation.');
        this.renderIncomingRequests();
    },

    rejectRequest: function(reqId) {
        if(confirm("Are you sure you want to reject this request?")) {
            Store.updateItem('requests', reqId, { status: "Rejected" });
            this.renderIncomingRequests();
        }
    },

    approveProcurement: function(procId) {
        Store.updateItem('procurements', procId, { status: "Approved" });
        Store.showToast("Procurement approved! Sent to Registrar.", "success");
        this.renderIncomingRequests();
        this.renderProcurements();
    },

    rejectProcurement: function(procId) {
        if(confirm("Are you sure you want to reject this procurement request?")) {
            Store.updateItem('procurements', procId, { status: "Rejected" });
            Store.showToast("Procurement request rejected.", "error");
            this.renderIncomingRequests();
            this.renderProcurements();
        }
    },

    // 2. Dept Resources
    renderDeptResources: function() {
        const tbody = document.getElementById('dept-resources-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const resources = Store.getData().resources.filter(r => r.department === user.department);
        
        resources.forEach(res => {
            let statusBadge = `<span class="badge ${res.status.toLowerCase()}">${res.status}</span>`;
            if (res.status === 'Allocated') statusBadge = `<span class="badge allocated">${res.status}</span>`;
            else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') statusBadge = `<span class="badge maintenance">${res.status}</span>`;
            
            const condition = res.condition || 'Good';
            const assigned = res.assignedTo || '--';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id" style="font-weight:600">${res.id}</td>
                <td>${res.type}</td>
                <td>${assigned}</td>
                <td>${condition}</td>
                <td style="text-align:right">${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Dashboard / Analytics
    renderDashboard: function() {
        const user = Store.getCurrentUser();
        const data = Store.getData();
        const resources = data.resources.filter(r => r.department === user.department);
        const incoming = data.requests.filter(r => r.department === user.department && r.status === 'Pending');
        const procurements = data.procurements.filter(p => p.department === user.department);

        // Update titles
        const deptTitle = document.getElementById('dash-dept-name');
        if(deptTitle) deptTitle.textContent = user.department;

        // Stats
        let available = 0, allocated = 0, maintenance = 0, scrap = 0;
        let countsByType = {};

        resources.forEach(r => {
            if(!countsByType[r.type]) countsByType[r.type] = { total: 0, available: 0 };
            countsByType[r.type].total++;

            if(r.status === 'Allocated') {
                allocated++;
            } else if(r.status === 'Available') {
                available++;
                countsByType[r.type].available++;
            } else if (r.status === 'Scrapped') {
                scrap++;
            } else {
                maintenance++;
            }
        });

        // Set stat cards
        const elTotal = document.getElementById('dash-total-res');
        const elAvail = document.getElementById('dash-avail');
        const elAlloc = document.getElementById('dash-alloc');
        const elMaint = document.getElementById('dash-maint');
        const elScrap = document.getElementById('dash-scrap');

        if(elTotal) elTotal.textContent = resources.length;
        if(elAvail) elAvail.textContent = available;
        if(elAlloc) elAlloc.textContent = allocated;
        if(elMaint) elMaint.textContent = maintenance;
        if(elScrap) elScrap.textContent = scrap;

        // Low stock logic
        let hasLowStock = false;
        Object.keys(countsByType).forEach(type => {
            const c = countsByType[type];
            const threshold = Math.max(2, Math.floor(c.total * 0.2));
            if(c.available <= threshold) hasLowStock = true;
        });

        const alertBanner = document.getElementById('low-stock-alert');
        if(alertBanner) {
            alertBanner.style.display = hasLowStock ? 'flex' : 'none';
        }

        // Incoming Table
        const incTbody = document.getElementById('dash-inc-req-tbody');
        if(incTbody) {
            incTbody.innerHTML = '';
            incoming.slice(0,5).forEach(req => {
                let statusBadge = `<span class="badge ${req.status.toLowerCase()}">${req.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${req.id}</td>
                    <td>${req.resourceType}</td>
                    <td>${req.requestor}</td>
                    <td>${statusBadge}</td>
                `;
                incTbody.appendChild(tr);
            });
        }

        // Procurements Table
        const procTbody = document.getElementById('dash-proc-tbody');
        if(procTbody) {
            procTbody.innerHTML = '';
            procurements.slice(0,5).forEach(p => {
                let statusBadge = `<span class="badge ${p.status.toLowerCase()}">${p.status}</span>`;
                if(p.status === 'Approved') statusBadge = `<span class="badge allocated">${p.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${p.id}</td>
                    <td>${p.resourceType}</td>
                    <td>${p.quantity}</td>
                    <td>${statusBadge}</td>
                `;
                procTbody.appendChild(tr);
            });
        }
    },

    // 4. Procurement
    renderProcurements: function() {
        const tbody = document.getElementById('procurement-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const user = Store.getCurrentUser();
        const procs = Store.getData().procurements.filter(p => p.department === user.department);

        procs.forEach(p => {
            let statusBadge = `<span class="badge ${p.status.toLowerCase()}">${p.status}</span>`;
            if (p.status === 'Approved') statusBadge = `<span class="badge" style="background:#dcfce7; color:#166534">Approved</span>`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${p.id}</td>
                <td>${p.resourceType}</td>
                <td>${p.quantity}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    submitProcurement: function(e) {
        e.preventDefault();
        const type = document.getElementById('proc-type').value;
        const qty = parseInt(document.getElementById('proc-qty').value);
        const reason = document.getElementById('proc-reason').value;
        const user = Store.getCurrentUser();

        Store.addItem('procurements', {
            id: `PROC-${Math.floor(100 + Math.random() * 900)}`,
            item: type,
            resourceType: type,
            quantity: qty,
            department: user.department,
            requester: user.name,
            requestedBy: user.name,
            status: "Approved", // Dept Head self-approves their own requests, so it bypasses them and goes to Registrar
            date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'}),
            justification: reason
        });

        Store.showToast("Procurement Request submitted and auto-approved for Registrar.", "success");
        document.getElementById('procurementForm').reset();
        this.renderProcurements();
    },
    
    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    deptApp.init();
});
