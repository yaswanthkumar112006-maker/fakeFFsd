const app = {
    init: function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Requestor') {
            window.location.href = 'login.html';
            return;
        }
        
        // Update UI with user info
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'Requestor - ' + user.department;
        
        this.bindNav();
        this.renderDashboard();
        this.renderRequests();
        this.renderResources();
        this.renderProcurements();
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
        return ['IT Services', 'Logistics Ops', 'HR Dept'];
    },
    
    getDeptResources: function(dept) {
        const map = {
            "IT Services": ["High-Cap Battery", "Server Blades v2", "Laptop Bundles", "Wireless Mouse"],
            "Logistics Ops": ["Field Tablets", "Safety Gear Kit"],
            "HR Dept": ["Projector", "Printer"]
        };
        return map[dept] || [];
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
    },

    submitRequest: function(e) {
        e.preventDefault();
        const dept = document.getElementById('req-dept').value;
        const type = document.getElementById('req-type').value;

        const qty = parseInt(document.getElementById('req-qty').value);
        const reason = document.getElementById('req-reason').value;
        const user = Store.getCurrentUser();

        const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'});

        Store.addItem('requests', {
            id: newId,
            department: dept,
            resourceType: type,
            quantity: qty,
            requestor: user.name,
            status: "Pending",
            priority: "Normal",
            date: dateStr,
            justification: reason
        });

        Store.showToast("Request Submitted Successfully! ID: " + newId, "success");
        document.getElementById('requestForm').reset();
        
        this.renderDashboard();
        this.renderRequests();
        this.switchView('my-requests-view');
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.nav-item[data-target="my-requests-view"]').classList.add('active');
    },

    submitProcurement: function(e) {
        e.preventDefault();
        const dept = document.getElementById('proc-dept').value;
        const type = document.getElementById('proc-type').value;
        const qty = parseInt(document.getElementById('proc-qty').value);
        const reason = document.getElementById('proc-reason').value;
        const user = Store.getCurrentUser();

        const newId = `PRC-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'});

        Store.addItem('procurements', {
            id: newId,
            item: type,
            department: dept,
            requester: user.name,
            quantity: qty,
            status: "Pending Approval",
            priority: "Normal",
            date: dateStr,
            justification: reason
        });

        Store.showToast("Procurement Request Submitted Successfully! ID: " + newId, "success");
        document.getElementById('procurementForm').reset();
        
        this.renderProcurements();
    },

    renderDashboard: function() {
        const user = Store.getCurrentUser();
        const data = Store.getData();
        const myRequests = data.requests.filter(r => r.requestor === user.name);
        const myResources = data.resources.filter(r => r.assignedTo === user.name);

        const nameSpan = document.getElementById('dash-user-name');
        if(nameSpan) nameSpan.textContent = user.name.split(' ')[0];
        
        // 1. Stats
        let pending = 0;
        myRequests.forEach(r => { if(r.status === 'Pending') pending++; });
        let maint = 0;
        myResources.forEach(r => { if(r.status === 'Maintenance Requested' || r.status === 'Maintenance') maint++; });

        const elTotalReq = document.getElementById('dash-total-req');
        const elPendingReq = document.getElementById('dash-pending-req');
        const elMyRes = document.getElementById('dash-my-res');
        const elMaint = document.getElementById('dash-maint');

        if(elTotalReq) elTotalReq.textContent = myRequests.length;
        if(elPendingReq) elPendingReq.textContent = pending;
        if(elMyRes) elMyRes.textContent = myResources.length;
        if(elMaint) elMaint.textContent = maint;

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
        
        let approved = 0, allocated = 0;
        myRequests.forEach(r => {
            if(r.status === 'Approved') approved++;
            if(r.status === 'Allocated') allocated++;
        });

        if(statPending) statPending.textContent = pending.toString().padStart(2, '0');
        if(statApproved) statApproved.textContent = approved.toString().padStart(2, '0');
        if(statAllocated) statAllocated.textContent = allocated.toString().padStart(2, '0');
    },

    renderRequests: function() {
        const tbody = document.getElementById('requests-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const myRequests = Store.getData().requests.filter(r => r.requestor === user.name);

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
        const myProcs = Store.getData().procurements.filter(p => p.requester === user.name);

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

    confirmReceipt: function(reqId) {
        const user = Store.getCurrentUser();
        const req = Store.getData().requests.find(r => r.id === reqId);
        
        if(req) {
            // Add resource to inventory and assign to user
            Store.addItem('resources', {
                id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
                name: req.resourceType,
                type: req.resourceType, // simplification
                department: req.department,
                serialNumber: 'SN-TBD',
                status: "Allocated",
                condition: "New",
                assignedTo: user.name,
                date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'})
            });
            
            Store.deleteItem('requests', reqId); // remove or keep as fulfilled
            
            alert('Item successfully received and added to your resources.');
            
            this.renderDashboard();
            this.renderRequests();
            this.renderResources();
            
            this.switchView('my-resources-view');
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelector('.nav-item[data-target="my-resources-view"]').classList.add('active');
        }
    },

    renderResources: function() {
        const tbody = document.getElementById('resources-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const myResources = Store.getData().resources.filter(r => r.assignedTo === user.name);

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

    requestMaintenance: function(resId) {
        if(confirm("Submit maintenance request for this resource?")) {
            Store.updateItem('resources', resId, { status: "Maintenance Requested" });
            this.renderResources();
        }
    },

    returnResource: function(resId) {
        if(confirm("Are you sure you want to return this resource? It will be sent to Staff for Verification.")) {
            Store.updateItem('resources', resId, { status: "Returned", assignedTo: "None" });
            alert("Resource returned successfully. Status moved to Returned.");
            this.renderResources();
        }
    },
    
    confirmRepairedAllocation: function(resId) {
        Store.updateItem('resources', resId, { status: "Allocated" });
        this.renderResources();
    },
    
    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
