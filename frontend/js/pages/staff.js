const staffApp = {
    stockData: [
        { id: "s1", resourceType: "Laptop", currentQuantity: 18, thresholdLevel: 15 },
        { id: "s2", resourceType: "Projector", currentQuantity: 8, thresholdLevel: 10 },
        { id: "s3", resourceType: "Tablet", currentQuantity: 3, thresholdLevel: 8 },
        { id: "s4", resourceType: "Monitor", currentQuantity: 2, thresholdLevel: 5 },
        { id: "s5", resourceType: "Router", currentQuantity: 12, thresholdLevel: 10 },
        { id: "s6", resourceType: "Printer", currentQuantity: 6, thresholdLevel: 6 }
    ],
    departments: ["IT Services", "Engineering", "Administration", "Library", "Science"],
    resourceTypes: {
        "IT Services": ["Laptop", "Monitor", "Router"],
        "Engineering": ["Projector", "Workstation"],
        "Administration": ["Printer", "Desk"],
        "Library": ["Tablet", "Scanner"],
        "Science": ["Microscope", "Sensor"]
    },
    editStockId: null,

    init: function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Staff') {
            window.location.href = 'login.html';
            return;
        }
        
        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = user.department + ' Staff';
        
        this.bindNav();
        this.renderDashboard();
        this.renderAllocations();
        this.renderInventory();
        this.renderMaintenance();
        this.renderReturns();
        this.renderProcurementTasks();
        this.renderStockMonitoring();
        this.renderRegistrationCards();
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

    getStaffDepartment: function() {
        const user = Store.getCurrentUser();
        return user && user.role === 'Staff' ? user.department : null;
    },

    getDepartmentResource: function(id) {
        const userDept = this.getStaffDepartment();
        return Store.getData().resources.find(r => r.id === id && r.department === userDept);
    },

    getDepartmentProcurement: function(id, status) {
        const userDept = this.getStaffDepartment();
        return Store.getData().procurements.find(p => {
            const statusMatches = status ? p.status === status : true;
            return p.id === id && p.department === userDept && statusMatches;
        });
    },

    // 0. Dashboard View
    renderDashboard: function() {
        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const approvedReqs = db.requests.filter(r => r.status === 'Approved' && r.department === userDept);
        const resources = db.resources.filter(r => r.department === userDept);
        const maintenance = resources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance');
        const returns = resources.filter(r => r.status === 'Returned');
        const procTasks = db.procurements.filter(p => p.status === 'Approved' && p.department === userDept);

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

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const approvedRequests = db.requests.filter(r => r.status === 'Approved' && r.department === userDept);
        const availableResources = db.resources.filter(res => res.status === 'Available' && res.department === userDept);

        approvedRequests.forEach(req => {
            let checkboxesHTML = '';
            
            let matchingResources = availableResources.filter(res => {
                 let t1 = (res.type || "").toLowerCase().trim();
                 let t2 = (req.resourceType || "").toLowerCase().trim();
                 let n1 = (res.name || "").toLowerCase().trim();
                 
                 // Strict matching to ensure absolute proper allocation.
                 return t1 === t2 || n1 === t2;
            });

            matchingResources.forEach(res => {
                checkboxesHTML += `
                    <label>
                        <input type="checkbox" value="${res.id}" class="alloc-cb-${req.id}" onchange="staffApp.updateMultiSelect('${req.id}', ${req.quantity})"> 
                        ${res.id} - ${res.name}
                        <span class="multi-status-text">${res.condition}</span>
                    </label>
                `;
            });
            
            if (matchingResources.length === 0) {
                checkboxesHTML = `<div style="padding: 0.6rem; text-align: center; color: #94a3b8; font-size: 0.8rem;">No matching resources available in your department inventory</div>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${req.id}</td>
                <td>${req.resourceType}</td>
                <td>${String(req.quantity).padStart(2, '0')}</td>
                <td>
                    <div class="multi-select-container">
                        <div class="multi-select-header" id="multi-header-${req.id}" onclick="staffApp.toggleMultiDropdown('${req.id}')">
                            <span class="multi-select-title" id="multi-title-${req.id}">Select Resources (0/${req.quantity})</span>
                            <span class="material-symbols-outlined" style="font-size: 1.2rem; color: #94a3b8;">expand_more</span>
                        </div>
                        <div class="multi-select-dropdown" id="multi-drop-${req.id}" style="display:none;">
                            ${checkboxesHTML}
                        </div>
                    </div>
                </td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem" onclick="staffApp.allocateResource('${req.id}')">Allocate</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    toggleMultiDropdown: function(reqId) {
        const dropdown = document.getElementById(`multi-drop-${reqId}`);
        const header = document.getElementById(`multi-header-${reqId}`);
        
        if(dropdown.style.display === 'none') {
            // Close any open dropdowns
            document.querySelectorAll('.multi-select-dropdown').forEach(d => d.style.display = 'none');
            document.querySelectorAll('.multi-select-header').forEach(h => h.classList.remove('active'));
            
            dropdown.style.display = 'flex';
            header.classList.add('active');
            
            // Close when clicking outside
            document.addEventListener('click', function closeMenu(e) {
                if(!e.target.closest(`.multi-select-container`)) {
                    dropdown.style.display = 'none';
                    header.classList.remove('active');
                    document.removeEventListener('click', closeMenu);
                }
            });
        } else {
            dropdown.style.display = 'none';
            header.classList.remove('active');
        }
    },

    updateMultiSelect: function(reqId, targetQty) {
        const checkboxes = document.querySelectorAll(`.alloc-cb-${reqId}:checked`);
        const title = document.getElementById(`multi-title-${reqId}`);
        const count = checkboxes.length;
        
        if (count === targetQty) {
            title.textContent = `${count}/${targetQty} Selected ✅`;
            title.style.color = '#16a34a';
            title.style.fontWeight = '700';
        } else {
            title.textContent = `Select Resources (${count}/${targetQty})`;
            title.style.color = 'var(--text-main)';
            title.style.fontWeight = '500';
        }
    },

    allocateResource: function(reqId) {
        const checkboxes = document.querySelectorAll(`.alloc-cb-${reqId}:checked`);
        const selectedOptions = Array.from(checkboxes).map(cb => cb.value);

        const userDept = this.getStaffDepartment();
        const db = Store.getData();
        const req = db.requests.find(r => r.id === reqId && r.department === userDept);

        if (!req) {
            Store.showToast("You can only allocate requests for your department.", "error");
            return;
        }

        if (selectedOptions.length !== req.quantity) {
            Store.showToast(`Please select exactly ${req.quantity} resource(s) for this request (you selected ${selectedOptions.length}).`, "error");
            return;
        }

        // Strict Backend Check: Verify that all selected resources properly match the requested type
        const allMatch = selectedOptions.every(id => {
            const r = db.resources.find(res => res.id === id && res.department === userDept && res.status === 'Available');
            if (!r) return false;
            return (r.type || "").toLowerCase().trim() === (req.resourceType || "").toLowerCase().trim() ||
                   (r.name || "").toLowerCase().trim() === (req.resourceType || "").toLowerCase().trim();
        });

        if (!allMatch) {
            Store.showToast("Validation Error: Selected resources do not match the requested resource type.", "error");
            return;
        }

        // Update Request
        Store.updateItem('requests', reqId, { status: "Allocated", assignedResources: selectedOptions.join(', ') });
        
        // Update all Selected Resources
        selectedOptions.forEach(resourceId => {
            Store.updateItem('resources', resourceId, { 
                status: "Allocated",
                assignedTo: req ? req.requestor : "Unknown Requestor",
                department: req ? req.department : "Unknown Department",
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            });
        });

        Store.showToast(`Request ${reqId} Allocated. ${selectedOptions.length} resource(s) assigned successfully.`, "success");
        this.renderAllocations();
        this.renderInventory();
    },

    // 2. Modular Resource Registration
    renderRegistrationCards: function() {
        const container = document.getElementById('procurement-registration-container');
        if (!container) return;
        container.innerHTML = '';
        
        const user = Store.getCurrentUser();
        const userDept = user.department;
        const procurements = Store.getData().procurements.filter(p => p.status === 'Fulfilled' && p.department === userDept);
        
        if (procurements.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:3rem; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1; color:#64748b;">
                    <span class="material-symbols-outlined" style="font-size:3rem; opacity:0.5; margin-bottom:1rem; display:block;">inventory</span>
                    <p style="font-size:1.1rem; margin-bottom:0.5rem">No Pending Registrations</p>
                    <p style="font-size:0.875rem">Purchases logged from Procurement Tasks will appear here for serial registration.</p>
                </div>
            `;
            return;
        }

        procurements.forEach(p => {
            const qty = parseInt(p.quantity) || 1;
            let rowsHtml = '';
            
            for (let i = 0; i < qty; i++) {
                const newCode = `RES-${p.id.replace(/[^a-zA-Z0-9]/g, '')}-${String(i + 1).padStart(2, '0')}`;
                rowsHtml += `
                    <tr>
                        <td><input type="text" class="form-control" value="${newCode}" readonly></td>
                        <td><input type="text" class="form-control" placeholder="Model"></td>
                        <td><input type="text" class="form-control" value="${p.resourceType}" readonly></td>
                        <td><input type="text" class="form-control" placeholder="Serial Number"></td>
                        <td><input type="text" class="form-control" placeholder="Location"></td>
                        <td>
                            <select class="form-control">
                                <option value="New">New</option>
                                <option value="Good">Good</option>
                                <option value="Average">Average</option>
                                <option value="Bad">Bad</option>
                            </select>
                        </td>
                        <td>
                            <select class="form-control">
                                <option value="Available">Available</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Scrapped">Scrapped</option>
                            </select>
                        </td>
                        <td><input type="text" class="form-control" value="${p.vendor || ''}" readonly></td>
                        <td><input type="text" class="form-control" value="${p.invoice || ''}" readonly></td>
                    </tr>
                `;
            }

            const card = document.createElement('div');
            card.className = 'form-card';
            card.style.maxWidth = '100%';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid #e2e8f0;">
                    <div>
                        <h3 class="data-section-title" style="margin-bottom:0.25rem;">Register Purchase: ${p.resourceType}</h3>
                        <div style="font-size:0.875rem; color:#64748b;">Procurement ID: <strong>${p.id}</strong> | Quantity Expected: <strong>${qty}</strong></div>
                    </div>
                    <div style="text-align:right; font-size:0.875rem;">
                        <div>Vendor: <strong>${p.vendor || 'N/A'}</strong></div>
                        <div>Invoice: <strong>${p.invoice || 'N/A'}</strong></div>
                    </div>
                </div>
                
                <table class="table" style="background:#f8fafc; border-radius:8px; margin-bottom:1.5rem;">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Model</th>
                            <th>Type</th>
                            <th>S/N <span style="color:#ef4444">*</span></th>
                            <th>Location</th>
                            <th>Condition</th>
                            <th>Status</th>
                            <th>Vendor</th>
                            <th>Invoice</th>
                        </tr>
                    </thead>
                    <tbody id="reg-tbody-${p.id}">
                        ${rowsHtml}
                    </tbody>
                </table>
                
                <div style="text-align:right;">
                    <button class="btn-primary" onclick="staffApp.submitRegistrationCard('${p.id}')">Submit & Register Assets</button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    submitRegistrationCard: function(procId) {
        const tbody = document.getElementById(`reg-tbody-${procId}`);
        if (!tbody) return;

        const userDept = this.getStaffDepartment();
        const procurement = this.getDepartmentProcurement(procId, 'Fulfilled');
        if (!userDept || !procurement) {
            Store.showToast("You can only register fulfilled purchases for your department.", "error");
            return;
        }

        let count = 0;
        let errors = false;
        let formatErrors = false;
        let snErrors = false;
        let duplicateErrors = false;
        
        const newResources = [];
        const modelRegex = /^[a-zA-Z0-9\s.-]+$/;
        const snRegex = /^[a-zA-Z0-9_.-]+$/;
        const db = Store.getData();
        const existingSerials = new Set((db.resources || []).map(r => String(r.serialNumber || '').toLowerCase()));
        const batchSerials = new Set();

        Array.from(tbody.children).forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            const selects = tr.querySelectorAll('select');
            const code = inputs[0].value.trim();
            const model = inputs[1].value.trim();
            const type = inputs[2].value.trim();
            const sn = inputs[3].value.trim();
            const loc = inputs[4].value.trim();
            const cond = selects[0] ? selects[0].value : 'New';
            const status = selects[1] ? selects[1].value : 'Available';
            const vendor = inputs[5] ? inputs[5].value.trim() : '';
            const invoice = inputs[6] ? inputs[6].value.trim() : '';
            
            if (!model || !type || !sn || !loc || !cond || !status) {
                errors = true;
            } else {
                if (!modelRegex.test(model)) {
                    formatErrors = true;
                }
                if (!snRegex.test(sn)) {
                    snErrors = true;
                }
                const normalizedSn = sn.toLowerCase();
                if (existingSerials.has(normalizedSn) || batchSerials.has(normalizedSn)) {
                    duplicateErrors = true;
                }
                batchSerials.add(normalizedSn);
                
                if (!errors && !formatErrors && !snErrors && !duplicateErrors) {
                    newResources.push({
                        id: code,
                        code: code,
                        name: model,
                        type: type,
                        department: userDept,
                        serialNumber: sn,
                        location: loc,
                        status: status,
                        condition: cond,
                        assignedTo: "None",
                        vendor: vendor,
                        invoice: invoice,
                        date: new Date().toLocaleDateString('en-US')
                    });
                    count++;
                }
            }
        });
        
        if (errors) {
            Store.showToast("Please fully complete all fields for every row in this batch.", "error");
            return;
        }

        if (formatErrors) {
            Store.showToast("Model can only contain letters, numbers, spaces, dots, and hyphens.", "error");
            return;
        }

        if (snErrors) {
            Store.showToast("Serial Number can only contain letters, numbers, dots, hyphens, and underscores.", "error");
            return;
        }

        if (duplicateErrors) {
            Store.showToast("Serial numbers must be unique across inventory and this batch.", "error");
            return;
        }

        if (count > 0) {
            // Push all to resources
            newResources.forEach(res => Store.addItem('resources', res));
            
            // Mark Procurement as Registered
            Store.updateItem('procurements', procId, { status: "Registered" });

            Store.showToast(`Successfully registered ${count} assets to ${userDept} inventory.`, "success");
            
            this.renderRegistrationCards();
            this.renderInventory();
            this.renderDashboard();
        }
    },

    // 3. Manage Inventory
    renderInventory: function() {
        const tbody = document.getElementById('inventory-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const resources = Store.getData().resources.filter(r => r.department === userDept);

        resources.forEach(res => {
            const tr = document.createElement('tr');
            
            let statusBadge = `<span class="badge ${res.status.toLowerCase()}">${res.status}</span>`;
            if(res.status === 'Available') statusBadge = `<span class="badge allocated">${res.status}</span>`;
            
            tr.innerHTML = `
                <td class="td-id">${res.id}</td>
                <td style="font-weight: 500">${res.name || res.type}</td>
                <td>${res.type}</td>
                <td><span style="font-family: monospace; font-size: 0.8rem; background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${res.serialNumber || 'N/A'}</span></td>
                <td>${res.location || res.department || 'N/A'}</td>
                <td>${res.condition || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>${res.vendor || 'N/A'}</td>
                <td>${res.invoice || 'N/A'}</td>
                <td style="text-align:right">
                    <button class="btn-secondary" style="font-size:0.75rem" onclick="staffApp.openEditResourceModal('${res.id}')">Edit</button>
                    ${res.status !== 'Scrapped' ? `<button class="btn-danger" style="font-size:0.75rem" onclick="staffApp.scrapResource('${res.id}')">Scrap</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    scrapResource: function(resId) {
        if (!this.getDepartmentResource(resId)) {
            Store.showToast("You can only scrap resources in your department.", "error");
            return;
        }
        if(confirm("Permanently mark this resource as scrapped?")) {
            Store.updateItem('resources', resId, { status: "Scrapped" });
            Store.showToast(`Resource ${resId} marked as scrapped!`, "error");
            this.renderInventory();
            this.renderDashboard();
        }
    },

    // 3.1 Edit Resource Dialog

    openEditResourceModal: function(id) {
        const res = this.getDepartmentResource(id);
        if(!res) return;
        
        document.getElementById('er-id').value = res.id;
        document.getElementById('er-code').value = res.code || res.id;
        document.getElementById('er-location').value = res.location || '';
        
        // Sometimes mock data condition is "Fair" instead of "Average"
        let cond = res.condition || 'Average';
        if(cond === 'Fair') cond = 'Average';
        if(cond === 'New') cond = 'Good';
        document.getElementById('er-condition').value = cond;
        
        document.getElementById('er-status').value = res.status || 'Available';
        
        document.getElementById('edit-resource-modal').classList.add('active');
    },

    closeEditResourceModal: function() {
        document.getElementById('edit-resource-modal').classList.remove('active');
        document.getElementById('editResourceForm').reset();
    },

    submitEditResource: function(e) {
        e.preventDefault();
        const id = document.getElementById('er-id').value;
        const loc = document.getElementById('er-location').value;
        const cond = document.getElementById('er-condition').value;
        const status = document.getElementById('er-status').value;

        if (!this.getDepartmentResource(id)) {
            Store.showToast("You can only edit resources in your department.", "error");
            return;
        }

        Store.updateItem('resources', id, {
            location: loc,
            condition: cond,
            status: status
        });

        Store.showToast(`Resource ${id} updated!`, "success");
        this.renderInventory();
        this.renderDashboard();
        this.closeEditResourceModal();
    },

    // 3.2 Add Resource Dialog

    openAddResourceModal: function() {
        const typeSelect = document.getElementById('ar-type');
        typeSelect.innerHTML = '<option value="">Select Resource Type...</option>';
        
        const userDept = this.getStaffDepartment();
        let allTypes = this.resourceTypes[userDept] || [];
        Store.getData().resources
            .filter(r => r.department === userDept && r.type)
            .forEach(r => allTypes.push(r.type));
        allTypes = [...new Set(allTypes)].sort();

        allTypes.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type;
            typeSelect.appendChild(opt);
        });
        
        document.getElementById('add-resource-modal').classList.add('active');
    },

    closeAddResourceModal: function() {
        document.getElementById('add-resource-modal').classList.remove('active');
        document.getElementById('addResourceForm').reset();
    },

    submitAddResource: function(e) {
        e.preventDefault();
        
        const type = document.getElementById('ar-type').value;
        const mfg = document.getElementById('ar-mfg').value;
        const model = document.getElementById('ar-model').value;
        const sn = document.getElementById('ar-sn').value;
        const loc = document.getElementById('ar-location').value;
        const cond = document.getElementById('ar-condition').value;

        if (!type || !mfg || !model || !sn || !loc || !cond) {
            Store.showToast("Please fill in all fields", "error");
            return;
        }

        const currentUser = Store.getCurrentUser();
        const userDept = this.getStaffDepartment();
        const db = Store.getData();
        const resources = db.resources || [];
        
        // Validation: Unique Serial Number
        const isDuplicate = resources.some(r => r.serialNumber === sn);
        if (isDuplicate) {
            Store.showToast("Serial number already exists", "error");
            return;
        }

        // Generating Code
        const deptPrefix = (userDept || 'DEP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        const typePrefix = type.substring(0, 3).toUpperCase();
        
        const sameTypeRes = resources.filter(r => r.type === type && r.department === userDept);
        const nextNumber = String(sameTypeRes.length + 1).padStart(3, '0');
        
        const generatedCode = `${deptPrefix}-${typePrefix}-${nextNumber}`;

        const newResource = {
            code: generatedCode,
            id: generatedCode,
            internalId: "r" + (resources.length + 1),
            type: type,
            name: `${mfg} ${model}`,
            department: currentUser.department,
            serialNumber: sn,
            location: loc,
            condition: cond,
            status: "Available",
            assignedTo: "None",
            date: new Date().toLocaleDateString('en-US')
        };

        Store.addItem('resources', newResource);
        Store.showToast(`Resource ${generatedCode} added successfully!`, "success");
        
        this.renderInventory();
        this.renderDashboard();
        this.closeAddResourceModal();
    },

    // 4. Maintenance Management
    renderMaintenance: function() {
        const mtbody = document.getElementById('maint-tbody');
        if(!mtbody) return;
        mtbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const resources = db.resources.filter(r => r.department === userDept);
        
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
            const deptResourceIds = new Set(resources.map(r => r.id));
            const history = (db.maintenanceHistory || []).filter(log => {
                return log.department === userDept || (!log.department && deptResourceIds.has(log.code));
            });
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
        if (!this.getDepartmentResource(id)) {
            Store.showToast("You can only process maintenance for your department.", "error");
            return;
        }
        Store.updateItem('resources', id, { status: 'Maintenance' });
        Store.showToast("Maintenance accepted. Resource is now under maintenance.", "success");
        this.renderMaintenance();
        this.renderDashboard();
    },

    markRepaired: function(id) {
        const res = this.getDepartmentResource(id);
        if (!res) {
            Store.showToast("You can only process maintenance for your department.", "error");
            return;
        }
        Store.updateItem('resources', id, { status: 'Available', condition: 'Good' });
        const db = Store.getData();
        if(!db.maintenanceHistory) db.maintenanceHistory = [];
        db.maintenanceHistory.unshift({
            code: res.id, type: res.type, department: res.department, allocatedTo: res.assignedTo, issue: "Repaired", actionDate: new Date().toLocaleDateString(), status: "Repaired"
        });
        Store.saveData(db);
        Store.showToast("Resource marked as repaired. User notified.", "success");
        this.renderMaintenance();
        this.renderDashboard();
    },

    markScrapMaint: function(id) {
        const res = this.getDepartmentResource(id);
        if (!res) {
            Store.showToast("You can only process maintenance for your department.", "error");
            return;
        }
        Store.updateItem('resources', id, { status: 'Scrapped' });
        const db = Store.getData();
        if(!db.maintenanceHistory) db.maintenanceHistory = [];
        db.maintenanceHistory.unshift({
            code: res.id, type: res.type, department: res.department, allocatedTo: res.assignedTo, issue: "Unrepairable", actionDate: new Date().toLocaleDateString(), status: "Scrap"
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

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const resources = db.resources.filter(r => r.department === userDept);
        
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
            const deptResourceIds = new Set(resources.map(r => r.id));
            const history = (db.returnHistory || []).filter(log => {
                return log.department === userDept || (!log.department && deptResourceIds.has(log.code));
            });
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
        
        const res = this.getDepartmentResource(id);
        if (!res) {
            Store.showToast("You can only process returns for your department.", "error");
            return;
        }
        Store.updateItem('resources', id, { status: newStatus, condition: cond, assignedTo: "None" });
        
        const db = Store.getData();
        if(!db.returnHistory) db.returnHistory = [];
        db.returnHistory.unshift({
            code: res.id, type: res.type, department: res.department, returnedBy: res.assignedTo || 'Unknown',
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

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const tasks = Store.getData().procurements.filter(p => p.status === 'Approved' && p.department === userDept);
        
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
        const vendorInput = document.getElementById('vend-' + id);
        const invoiceInput = document.getElementById('inv-' + id);
        
        const vendor = vendorInput ? vendorInput.value.trim() : '';
        const invoice = invoiceInput ? invoiceInput.value.trim() : '';
        
        if (!vendor || !invoice) {
            Store.showToast("Please provide both Vendor Name and Invoice Number before logging purchase.", "error");
            if (!vendor && vendorInput) vendorInput.focus();
            else if (!invoice && invoiceInput) invoiceInput.focus();
            return;
        }

        const vendorRegex = /^[a-zA-Z0-9\s.-]+$/;
        const invoiceRegex = /^[0-9]+$/;
        
        if (!vendorRegex.test(vendor)) {
            Store.showToast("Vendor Name can only contain characters and numbers.", "error");
            if (vendorInput) vendorInput.focus();
            return;
        }
        
        if (!invoiceRegex.test(invoice)) {
            Store.showToast("Invoice Number can only contain numbers.", "error");
            if (invoiceInput) invoiceInput.focus();
            return;
        }

        const proc = this.getDepartmentProcurement(id, 'Approved');
        if (!proc) {
            Store.showToast("You can only log purchases for your department.", "error");
            return;
        }
        
        Store.updateItem('procurements', id, { 
            status: 'Fulfilled',
            vendor: vendor,
            invoice: invoice
        });
        
        Store.showToast(`Purchase logged for Invoice ${invoice}. Assets are now pending Serial Registration.`, "success");
        this.renderProcurementTasks();
        this.renderRegistrationCards();
    },

    // Stock Monitoring
    renderStockMonitoring: function() {
        const tbody = document.getElementById('stock-monitoring-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const userDept = this.getStaffDepartment();
        const deptResources = Store.getData().resources.filter(r => r.department === userDept);
        const countsByType = {};
        deptResources.forEach(res => {
            const type = res.type || res.name || 'Unknown';
            if (!countsByType[type]) countsByType[type] = 0;
            if (res.status === 'Available') countsByType[type]++;
        });

        const stockRows = Object.keys(countsByType).sort().map(type => {
            const configured = this.stockData.find(item => item.resourceType === type);
            return {
                id: configured ? configured.id : type,
                resourceType: type,
                currentQuantity: countsByType[type],
                thresholdLevel: configured ? configured.thresholdLevel : 1
            };
        });

        let safeCount = 0;
        let nearCount = 0;
        let lowCount = 0;

        stockRows.forEach(item => {
            let status = '';
            let statusBadge = '';
            let showSendReq = false;

            if (item.currentQuantity >= item.thresholdLevel) {
                status = 'Safe';
                statusBadge = `<span class="badge badge-stock-safe">Safe</span>`;
                safeCount++;
            } else if (item.currentQuantity >= item.thresholdLevel * 0.7) {
                status = 'Near Threshold';
                statusBadge = `<span class="badge badge-stock-near">Near Threshold</span>`;
                nearCount++;
            } else {
                status = 'Low Stock';
                statusBadge = `<span class="badge badge-stock-low">Low Stock</span>`;
                lowCount++;
                showSendReq = true;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.resourceType}</td>
                <td>${item.currentQuantity}</td>
                <td>${item.thresholdLevel}</td>
                <td>${statusBadge}</td>
                <td style="text-align:right">
                    <button class="btn-ghost btn-ghost-primary" onclick="staffApp.openStockModal('${item.id}')">
                        <span class="material-symbols-outlined">edit</span> Edit Threshold
                    </button>
                    ${showSendReq ? `
                    <button class="btn-ghost btn-ghost-danger" onclick="staffApp.sendStockRequest('${item.resourceType}')">
                        <span class="material-symbols-outlined">send</span> Send Request
                    </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        const safeEl = document.getElementById('stock-safe-count');
        const nearEl = document.getElementById('stock-near-count');
        const lowEl = document.getElementById('stock-low-count');

        if(safeEl) safeEl.textContent = safeCount;
        if(nearEl) nearEl.textContent = nearCount;
        if(lowEl) lowEl.textContent = lowCount;
    },

    openStockModal: function(id) {
        let item = this.stockData.find(i => i.id === id);
        if(!item) {
            const userDept = this.getStaffDepartment();
            const currentQuantity = Store.getData().resources.filter(r => {
                return r.department === userDept && r.status === 'Available' && (r.type === id || r.name === id);
            }).length;
            item = { id: id, resourceType: id, currentQuantity: currentQuantity, thresholdLevel: 1 };
            this.stockData.push(item);
        }
        this.editStockId = id;
        document.getElementById('stock-modal-resource').textContent = `Resource: ${item.resourceType}`;
        document.getElementById('stock-current-qty').value = item.currentQuantity;
        document.getElementById('stock-threshold-input').value = item.thresholdLevel;
        document.getElementById('stock-edit-modal').classList.add('active');
    },

    closeStockModal: function() {
        this.editStockId = null;
        document.getElementById('stock-edit-modal').classList.remove('active');
        document.getElementById('stock-threshold-input').value = '';
    },

    saveStockThreshold: function() {
        if (!this.editStockId) return;
        const val = parseInt(document.getElementById('stock-threshold-input').value);
        if (isNaN(val) || val < 0) {
            Store.showToast("Threshold must be a non-negative integer.", "error");
            return;
        }

        const itemIndex = this.stockData.findIndex(i => i.id === this.editStockId);
        if(itemIndex > -1) {
            this.stockData[itemIndex].thresholdLevel = val;
            Store.showToast("Threshold updated successfully.", "success");
            this.renderStockMonitoring();
            this.closeStockModal();
        }
    },

    sendStockRequest: function(resourceType) {
        this.switchView('proc-tasks-view');
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItem = document.querySelector('.nav-item[data-target="proc-tasks-view"]');
        if(navItem) navItem.classList.add('active');
        
        // Give context to the user
        Store.showToast(`Navigated to Procurement Tasks for ${resourceType}.`, "warning");
    },

    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    staffApp.init();
});
