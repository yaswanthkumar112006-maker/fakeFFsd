const regApp = {
    init: function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Registrar') {
            window.location.href = 'login.html';
            return;
        }
        
        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'University Registrar';
        
        this.bindNav();
        this.renderProcurementApprovals();
        this.renderGlobalRequests();
        this.renderAnalytics();
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

    // 1. Procurement Approvals
    renderProcurementApprovals: function() {
        const tbody = document.querySelector('#procurement-approvals-view tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const procs = Store.getData().procurements;
        
        // Calculate Stats
        let pending = 0, accepted = 0, rejected = 0;
        procs.forEach(p => {
            if(p.status === 'Pending') pending++;
            else if(p.status === 'Approved' || p.status === 'Fulfilled') accepted++;
            else if(p.status === 'Rejected') rejected++;
        });

        const elTotal = document.getElementById('dash-proc-total');
        const elPending = document.getElementById('dash-proc-pending');
        const elAccepted = document.getElementById('dash-proc-accepted');
        const elRejected = document.getElementById('dash-proc-rejected');

        if(elTotal) elTotal.textContent = procs.length;
        if(elPending) elPending.textContent = pending;
        if(elAccepted) elAccepted.textContent = accepted;
        if(elRejected) elRejected.textContent = rejected;

        // Render Table
        procs.forEach(p => {
            let statusBadge = `<span class="badge ${p.status.toLowerCase()}">${p.status}</span>`;
            if (p.status === 'Approved' || p.status === 'Fulfilled') {
                statusBadge = `<span class="badge allocated">${p.status}</span>`;
            } else if (p.status === 'Rejected') {
                statusBadge = `<span class="badge rejected">${p.status}</span>`;
            } else if (p.status === 'Pending') {
                statusBadge = `<span class="badge pending">${p.status}</span>`;
            }

            let actionCol = '';
            if(p.status === 'Pending') {
                actionCol = `
                    <button class="btn-primary" style="font-size:0.75rem; background:#16a34a" onclick="regApp.acceptProcurement('${p.id}')">Accept</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="regApp.rejectProcurement('${p.id}')">Reject</button>
                `;
            } else {
                actionCol = statusBadge;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${p.id}</td>
                <td>${p.requestedBy} (${p.department})</td>
                <td>${p.resourceType}</td>
                <td>${p.quantity}</td>
                <td style="font-size:0.75rem; color:#64748b">${p.justification}</td>
                <td style="text-align:right">${actionCol}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    acceptProcurement: function(id) {
        Store.updateItem('procurements', id, { status: "Approved" });
        alert('Procurement Approved. Task passed to Staff for fulfillment.');
        this.renderProcurementApprovals();
    },

    rejectProcurement: function(id) {
        if(confirm("Reject this procurement request?")) {
            Store.updateItem('procurements', id, { status: "Rejected" });
            this.renderProcurementApprovals();
        }
    },

    // 2. Global Requests Overview
    renderGlobalRequests: function() {
        const tbody = document.querySelector('#sys-overview-view tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        // All requests or filtered
        const requests = Store.getData().requests;

        requests.forEach(r => {
            let statusBadge = `<span class="badge ${r.status.toLowerCase()}">${r.status}</span>`;
            if (r.status === 'Approved' || r.status === 'Allocated') {
                statusBadge = `<span class="badge allocated">${r.status}</span>`;
            } else if (r.status === 'Pending') {
                statusBadge = `<span class="badge pending">${r.status}</span>`;
            } else {
                statusBadge = `<span class="badge rejected">${r.status}</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.id}</td>
                <td>${r.department}</td>
                <td>${r.resourceType}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // 3. System Analytics
    renderAnalytics: function() {
        const stats = Store.getData();
        const activeAssets = stats.resources.length;
        
        let itDemand = stats.requests.filter(r => r.department === "IT Services").length;
        let hrDemand = stats.requests.filter(r => r.department === "HR Dept").length;
        let opsDemand = stats.requests.filter(r => r.department === "Operations").length;
        
        let max = Math.max(itDemand, hrDemand, opsDemand);
        let highDemand = "IT Services";
        if (max === hrDemand) highDemand = "HR Dept";
        if (max === opsDemand) highDemand = "Operations";

        const statValues = document.querySelectorAll('#sys-analytics-view .stat-value');
        if(statValues.length >= 3) {
            statValues[0].textContent = activeAssets.toLocaleString();
            statValues[1].textContent = "1.2 Days"; // Mock average fulfillment
            statValues[2].textContent = highDemand;
        }
    },

    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    regApp.init();
});
