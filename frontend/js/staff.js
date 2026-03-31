const staffApp = {
    init: function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Staff') {
            window.location.href = 'login.html';
            return;
        }
        
        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'Operations Staff';
        
        this.bindNav();
        this.renderDashboard();
        this.renderAllocations();
        this.renderInventory();
        this.renderMaintenance();
        this.renderReturns();
        this.renderProcurementTasks();
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

    // 0. Dashboard View
    renderDashboard: function() {
        const db = Store.getData();
        const approvedReqs = db.requests.filter(r => r.status === 'Approved');
        const resources = db.resources;
        const maintenance = resources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance');
        const returns = resources.filter(r => r.status === 'Returned');
        const procTasks = db.procurements.filter(p => p.status === 'Approved');

        const elAlloc = document.getElementById('dash-staff-alloc');
        const elRes = document.getElementById('dash-staff-res');
        const elMaint = document.getElementById('dash-staff-maint');
        const elProc = document.getElementById('dash-staff-proc');
        const elReturns = document.getElementById('dash-staff-returns');

        if(elAlloc) elAlloc.textContent = approvedReqs.length;
        if(elRes) elRes.textContent = resources.length;
        if(elMaint) elMaint.textContent = maintenance.length;
        if(elProc) elProc.textContent = procTasks.length;
        if(elReturns) elReturns.textContent = returns.length;

        // Allocation Table
        const allocTbody = document.getElementById('dash-alloc-tbody');
        if(allocTbody) {
            allocTbody.innerHTML = '';
            approvedReqs.slice(0, 5).forEach(req => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${req.id}</td>
                    <td>${req.resourceType}</td>
                    <td>${req.quantity}</td>
                    <td>${req.requestor}</td>
                `;
                allocTbody.appendChild(tr);
            });
        }

        // Maintenance Table
        const maintTbody = document.getElementById('dash-maint-tbody');
        if(maintTbody) {
            maintTbody.innerHTML = '';
            maintenance.slice(0, 5).forEach(res => {
                let statusBadge = `<span class="badge pending">${res.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${res.id}</td>
                    <td>${res.type}</td>
                    <td>${statusBadge}</td>
                `;
                maintTbody.appendChild(tr);
            });
        }
    },

    // 1. Allocation Requests
    renderAllocations: function() {
        const tbody = document.getElementById('allocation-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const db = Store.getData();
        const approvedRequests = db.requests.filter(r => r.status === 'Approved');

        approvedRequests.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${req.id}</td>
                <td>${req.department}</td>
                <td>${req.resourceType}</td>
                <td>${String(req.quantity).padStart(2, '0')}</td>
                <td>
                    <select class="form-control" style="font-size:0.75rem; padding:0.25rem 0.5rem" id="alloc-res-${req.id}">
                        <option value="">Auto-Assign from ${req.department} Pool</option>
                        <option value="global">Draw from Global Pool</option>
                    </select>
                </td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem" onclick="staffApp.allocateResource('${req.id}')">Allocate</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    allocateResource: function(reqId) {
        Store.updateItem('requests', reqId, { status: "Allocated" });
        alert("Resources have been allocated and are awaiting confirmation from the requestor.");
        this.renderAllocations();
    },

    // 2. Resource Registration
    addRegistrationRow: function() {
        const tbody = document.getElementById('registration-tbody');
        const count = tbody.children.length + 1;
        const newCode = `RES-Auto${count}`;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="form-control" value="${newCode}" readonly></td>
            <td><input type="text" class="form-control" placeholder="Type/Model"></td>
            <td><input type="text" class="form-control" placeholder="Manufacturer"></td>
            <td><input type="text" class="form-control" placeholder="Location"></td>
            <td><input type="text" class="form-control" placeholder="S/N"></td>
        `;
        tbody.appendChild(tr);
    },

    submitRegistration: function() {
        const tbody = document.getElementById('registration-tbody');
        let count = 0;
        Array.from(tbody.children).forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            const type = inputs[1].value;
            const sn = inputs[4].value;
            if(type) {
                Store.addItem('resources', {
                    id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: type,
                    type: type,
                    department: "Global Ops",
                    serialNumber: sn || "N/A",
                    status: "Available",
                    condition: "New",
                    assignedTo: "None",
                    date: new Date().toLocaleDateString('en-US')
                });
                count++;
            }
        });
        
        if (count > 0) {
            alert(`${count} new assets registered to the Global Pool.`);
            tbody.innerHTML = `
                <tr>
                    <td><input type="text" class="form-control" value="RES-Auto1" readonly></td>
                    <td><input type="text" class="form-control" placeholder="e.g. MacBook Pro"></td>
                    <td><input type="text" class="form-control" placeholder="Apple"></td>
                    <td><input type="text" class="form-control" placeholder="HQ-Floor 2"></td>
                    <td><input type="text" class="form-control" placeholder="Serial No"></td>
                </tr>
            `;
            this.renderInventory();
        } else {
            alert('Please enter at least the Type/Model.');
        }
    },

    // 3. Manage Inventory
    renderInventory: function() {
        const tbody = document.getElementById('inventory-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const resources = Store.getData().resources;

        resources.forEach(res => {
            const tr = document.createElement('tr');
            
            let statusBadge = `<span class="badge ${res.status.toLowerCase()}">${res.status}</span>`;
            if(res.status === 'Available') statusBadge = `<span class="badge allocated">${res.status}</span>`;
            
            tr.innerHTML = `
                <td class="td-id">${res.id}</td>
                <td>${res.type}</td>
                <td>${statusBadge}</td>
                <td>${res.department}</td>
                <td style="text-align:right">
                    <button class="btn-secondary" style="font-size:0.75rem">Edit</button>
                    ${res.status !== 'Scrapped' ? `<button class="btn-danger" style="font-size:0.75rem" onclick="staffApp.scrapResource('${res.id}')">Scrap</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    scrapResource: function(resId) {
        if(confirm("Permanently mark this resource as scrapped?")) {
            Store.updateItem('resources', resId, { status: "Scrapped" });
            this.renderInventory();
        }
    },

    // 4. Maintenance Management
    renderMaintenance: function() {
        const mtbody = document.getElementById('maint-tbody');
        if(!mtbody) return;
        mtbody.innerHTML = '';

        const db = Store.getData();
        const resources = db.resources;
        
        // Active Queue
        resources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance').forEach(res => {
            const tr = document.createElement('tr');
            let actionHtml = '';
            let statusText = res.status;

            if (res.status === 'Maintenance Requested') {
                actionHtml = `
                    <button class="btn-primary" style="font-size:0.75rem; margin-right:4px;" onclick="staffApp.acceptMaintenance('${res.id}')">Accept</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="staffApp.markScrapMaint('${res.id}')">Reject &rarr; Scrap</button>
                `;
            } else if (res.status === 'Maintenance') {
                statusText = 'Under Maintenance';
                actionHtml = `
                    <button class="btn-primary" style="font-size:0.75rem; background:#16a34a; margin-right:4px;" onclick="staffApp.markRepaired('${res.id}')">Mark Repaired</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="staffApp.markScrapMaint('${res.id}')">Mark Scrap</button>
                `;
            }

            tr.innerHTML = `
                <td><div class="td-id">${res.id}</div></td>
                <td>${res.type}</td>
                <td>${res.assignedTo || 'None'}</td>
                <td><span class="badge pending">${statusText}</span></td>
                <td style="text-align:right">${actionHtml}</td>
            `;
            mtbody.appendChild(tr);
        });

        // History
        const htbody = document.getElementById('maint-history-tbody');
        const hcount = document.getElementById('maint-history-count');
        if (htbody) {
            htbody.innerHTML = '';
            const history = db.maintenanceHistory || [];
            if (hcount) hcount.textContent = history.length;
            
            history.forEach(log => {
                const sbadge = log.status === 'Repaired' ? `<span class="badge allocated">${log.status}</span>` : `<span class="badge rejected">${log.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="td-id">${log.code}</div></td>
                    <td>${log.type}</td>
                    <td>${log.allocatedTo}</td>
                    <td>${log.issue || 'Routine'}</td>
                    <td>${log.actionDate}</td>
                    <td>${sbadge}</td>
                `;
                htbody.appendChild(tr);
            });
        }
    },

    acceptMaintenance: function(id) {
        Store.updateItem('resources', id, { status: 'Maintenance' });
        Store.showToast("Maintenance accepted. Resource is now under maintenance.", "success");
        this.renderMaintenance();
        this.renderDashboard();
    },

    markRepaired: function(id) {
        const res = Store.getData().resources.find(r => r.id === id);
        Store.updateItem('resources', id, { status: 'Available', condition: 'Good' });
        const db = Store.getData();
        if(!db.maintenanceHistory) db.maintenanceHistory = [];
        db.maintenanceHistory.unshift({
            code: res.id, type: res.type, allocatedTo: res.assignedTo, issue: "Repaired", actionDate: new Date().toLocaleDateString(), status: "Repaired"
        });
        Store.saveData(db);
        Store.showToast("Resource marked as repaired. User notified.", "success");
        this.renderMaintenance();
        this.renderDashboard();
    },

    markScrapMaint: function(id) {
        const res = Store.getData().resources.find(r => r.id === id);
        Store.updateItem('resources', id, { status: 'Scrapped' });
        const db = Store.getData();
        if(!db.maintenanceHistory) db.maintenanceHistory = [];
        db.maintenanceHistory.unshift({
            code: res.id, type: res.type, allocatedTo: res.assignedTo, issue: "Unrepairable", actionDate: new Date().toLocaleDateString(), status: "Scrap"
        });
        Store.saveData(db);
        Store.showToast("Resource marked as scrap. User notified.", "error");
        this.renderMaintenance();
        this.renderDashboard();
    },

    // 5. Return Management
    renderReturns: function() {
        const rtbody = document.getElementById('return-tbody');
        if(!rtbody) return;
        rtbody.innerHTML = '';

        const db = Store.getData();
        const resources = db.resources;
        
        // Return Queue
        resources.filter(r => r.status === 'Returned').forEach(res => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="td-id">${res.id}</div></td>
                <td>${res.type}</td>
                <td>${res.assignedTo || 'Unknown'}</td>
                <td>${res.date || new Date().toLocaleDateString()}</td>
                <td>
                    <select class="form-control" style="font-size:0.75rem; padding:0.25rem" id="return-cond-${res.id}" onchange="staffApp.validateReturnCond('${res.id}')">
                        <option value="">-- Inspect Condition --</option>
                        <option value="Good">Good &rarr; Available</option>
                        <option value="Average">Average &rarr; Available</option>
                        <option value="Bad">Bad &rarr; Scrap</option>
                    </select>
                </td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem" id="process-ret-${res.id}" disabled onclick="staffApp.processReturn('${res.id}')">Process Return</button>
                </td>
            `;
            rtbody.appendChild(tr);
        });

        // History
        const htbody = document.getElementById('return-history-tbody');
        const hcount = document.getElementById('return-history-count');
        if (htbody) {
            htbody.innerHTML = '';
            const history = db.returnHistory || [];
            if (hcount) hcount.textContent = history.length;

            history.forEach(log => {
                const sbadge = log.finalStatus === 'Available' ? `<span class="badge allocated">${log.finalStatus}</span>` : `<span class="badge rejected">${log.finalStatus}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="td-id">${log.code}</div></td>
                    <td>${log.type}</td>
                    <td>${log.returnedBy}</td>
                    <td>${log.returnDate}</td>
                    <td>${log.processDate}</td>
                    <td>${log.condition}</td>
                    <td>${sbadge}</td>
                `;
                htbody.appendChild(tr);
            });
        }
    },

    validateReturnCond: function(id) {
        const val = document.getElementById(`return-cond-${id}`).value;
        const btn = document.getElementById(`process-ret-${id}`);
        if(btn) btn.disabled = val === "";
    },

    processReturn: function(id) {
        const cond = document.getElementById(`return-cond-${id}`).value;
        const newStatus = cond === "Bad" ? "Scrapped" : "Available";
        
        const res = Store.getData().resources.find(r => r.id === id);
        Store.updateItem('resources', id, { status: newStatus, condition: cond, assignedTo: "None" });
        
        const db = Store.getData();
        if(!db.returnHistory) db.returnHistory = [];
        db.returnHistory.unshift({
            code: res.id, type: res.type, returnedBy: res.assignedTo || 'Unknown',
            returnDate: res.date || new Date().toLocaleDateString(),
            processDate: new Date().toLocaleDateString(),
            condition: cond, finalStatus: newStatus
        });
        Store.saveData(db);

        if(newStatus === 'Available') {
            Store.showToast("Return processed. Resource marked as Available.", "success");
        } else {
            Store.showToast("Return processed. Resource marked as Scrap.", "error");
        }
        
        this.renderReturns();
        this.renderDashboard();
    },

    toggleHistory: function(contentId) {
        const content = document.getElementById(contentId);
        const icon = document.getElementById(contentId + '-icon');
        if(content) {
            if(content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                if(icon) icon.textContent = '▼';
            } else {
                content.classList.add('expanded');
                if(icon) icon.textContent = '▲';
            }
        }
    },

    // 5. Procurement Tasks
    renderProcurementTasks: function() {
        const tbody = document.querySelector('#proctask-tbody tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const tasks = Store.getData().procurements.filter(p => p.status === 'Approved');
        
        tasks.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="td-id">PT-${p.id.split('-')[1]}</div>
                    <div style="font-size:0.75rem; color:#64748b">${p.resourceType}</div>
                </td>
                <td>${p.quantity}</td>
                <td>
                    <input type="text" class="form-control" style="margin-bottom:0.25rem; font-size:0.75rem" placeholder="Vendor Name" id="vend-${p.id}">
                    <input type="text" class="form-control" style="font-size:0.75rem" placeholder="Invoice Number" id="inv-${p.id}">
                </td>
                <td style="text-align:right; vertical-align:middle">
                    <button class="btn-primary" onclick="staffApp.logPurchase('${p.id}')">Log Purchase</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    logPurchase: function(id) {
        const proc = Store.getData().procurements.find(p => p.id === id);
        Store.updateItem('procurements', id, { status: 'Fulfilled' });
        
        // Auto register to global
        for(let i=0; i<Math.min(proc.quantity, 10); i++) {
            Store.addItem('resources', {
                id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
                name: proc.resourceType,
                type: proc.resourceType,
                department: proc.department,
                serialNumber: "SN-AUTO",
                status: "Available",
                condition: "New",
                assignedTo: "None",
                date: new Date().toLocaleDateString('en-US')
            });
        }
        alert('Procurement logged. Assets added to ' + proc.department);
        this.renderProcurementTasks();
        this.renderInventory();
    },

    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    staffApp.init();
});
