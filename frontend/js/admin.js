const adminApp = {
    init: function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'System Admin') {
            window.location.href = 'login.html';
            return;
        }
        
        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'Administrator';
        
        this.bindNav();
        this.renderUsers();
        this.renderDepartments();
        this.renderRolesMatrix();
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

    // 1. User Management
    renderUsers: function() {
        const tbody = document.querySelector('#dash-users-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const db = Store.getData();
        const users = db.users;
        const depts = db.departments;

        // Calculate Stats
        const roles = new Set(users.map(u => u.role));
        
        const elUsers = document.getElementById('dash-admin-users');
        const elDepts = document.getElementById('dash-admin-depts');
        const elRoles = document.getElementById('dash-admin-roles');

        if(elUsers) elUsers.textContent = users.length;
        if(elDepts) elDepts.textContent = depts.length;
        if(elRoles) elRoles.textContent = roles.size;

        users.slice(0, 5).forEach(u => {
            let roleBadge = `<span class="badge" style="background:#cbd5e1; color:#0f172a">${u.role}</span>`;
            if (u.role === 'Dept Head') roleBadge = `<span class="badge pending" style="background:#dbeafe; color:#1d4ed8">${u.role}</span>`;
            else if (u.role === 'Staff') roleBadge = `<span class="badge pending">${u.role}</span>`;
            else if (u.role === 'System Admin') roleBadge = `<span class="badge" style="background:#fecaca; color:#b91c1c">${u.role}</span>`;
            else if (u.role === 'Registrar') roleBadge = `<span class="badge allocated" style="background:#fef08a; color:#854d0e">${u.role}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600">${u.name} <div style="font-size:0.75rem; color:#64748b; font-weight:normal">${u.email}</div></td>
                <td>${roleBadge}</td>
                <td>${u.department}</td>
                <td><span class="badge allocated">${u.status}</span></td>
                <td style="text-align:right">
                    <button class="btn-secondary" style="font-size:0.75rem" onclick="adminApp.editUser('${u.id}')">Edit Access</button>
                    ${u.role !== 'System Admin' ? `<button class="btn-danger" style="font-size:0.75rem" onclick="adminApp.deleteUser('${u.id}')">Delete</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openModal: function(title, html, onConfirm) {
        document.getElementById('modal-header').textContent = title;
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('admin-modal').style.display = 'flex';
        
        const btn = document.getElementById('modal-confirm-btn');
        btn.onclick = () => {
            if (onConfirm) onConfirm();
        };
    },

    closeModal: function() {
        document.getElementById('admin-modal').style.display = 'none';
    },

    editUser: function(id) {
        const user = Store.getData().users.find(u => u.id === id);
        if(!user) return;
        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">New Role for ${user.name}</label>
                <select id="modal-role-select" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    <option value="Requestor" ${user.role === 'Requestor' ? 'selected' : ''}>Requestor</option>
                    <option value="Dept Head" ${user.role === 'Dept Head' ? 'selected' : ''}>Dept Head</option>
                    <option value="Registrar" ${user.role === 'Registrar' ? 'selected' : ''}>Registrar</option>
                    <option value="Staff" ${user.role === 'Staff' ? 'selected' : ''}>Staff</option>
                    <option value="System Admin" ${user.role === 'System Admin' ? 'selected' : ''}>System Admin</option>
                </select>
            </div>
        `;
        this.openModal("Edit User Access", html, () => {
            const newRole = document.getElementById('modal-role-select').value;
            Store.updateItem('users', id, { role: newRole });
            this.renderUsers();
            Store.showToast("Role updated permanently.", "success");
            this.closeModal();
        });
    },

    deleteUser: function(id) {
        const html = `<p style="color:#64748b; margin:0">Are you absolutely sure you want to deactivate this user? They will lose access immediately.</p>`;
        this.openModal("Deactivate User", html, () => {
            Store.updateItem('users', id, { status: "Inactive" });
            this.renderUsers();
            Store.showToast("User deactivated.", "success");
            this.closeModal();
        });
    },

    // 2. Department Config
    renderDepartments: function() {
        const container = document.querySelector('#dept-manage-view > div');
        if(!container) return;

        // Keep the "+ Add New Department" button
        container.innerHTML = '';
        
        const depts = Store.getData().departments;
        
        depts.forEach(d => {
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; padding-bottom:1rem; border-bottom:1px solid #e2e8f0; margin-bottom:1rem;";
            div.innerHTML = `
                <div><strong style="font-size:1.1rem; color:var(--primary-color)">${d.name}</strong><div style="color:#64748b; font-size:0.875rem">Head: ${d.head} | Members: ${d.memberCount}</div></div>
                <button class="btn-danger" style="font-size:0.75rem" onclick="adminApp.deleteDept('${d.id}')">Delete</button>
            `;
            container.appendChild(div);
        });

        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '1rem';
        btnDiv.innerHTML = `<button class="btn-primary" onclick="adminApp.addDept()">+ Add New Department</button>`;
        container.appendChild(btnDiv);
    },

    addDept: function() {
        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department Name</label>
                <input type="text" id="modal-dept-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. IT Services">
            </div>
            <div>
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Head Name</label>
                <input type="text" id="modal-dept-head" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. Sarah Jenkins">
            </div>
        `;
        this.openModal("Add New Department", html, () => {
            const name = document.getElementById('modal-dept-name').value;
            const head = document.getElementById('modal-dept-head').value;
            if (name && head) {
                Store.addItem('departments', {
                    id: `D${Math.floor(100 + Math.random() * 900)}`,
                    name: name,
                    head: head,
                    memberCount: 0
                });
                this.renderDepartments();
                Store.showToast("Department added successfully.", "success");
                this.closeModal();
            } else {
                Store.showToast("Please fill all fields.", "error");
            }
        });
    },
    
    deleteDept: function(id) {
        const html = `<p style="color:#b91c1c; margin:0">Warning: Deleting this department affects all linked associated users and active resources. Proceed at your own risk.</p>`;
        this.openModal("Delete Department", html, () => {
            Store.deleteItem('departments', id);
            this.renderDepartments();
            Store.showToast("Department securely removed.", "warning");
            this.closeModal();
        });
    },

    // 3. Roles and Perms Matrix
    renderRolesMatrix: function() {
        const tbody = document.getElementById('matrix-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const db = Store.getData();
        const matrix = db.permissionsMatrix;
        if (!matrix) return; // safety
        
        const roles = ['Requestor', 'Dept Head', 'Registrar', 'Staff', 'System Admin'];

        // Populate table
        Object.keys(matrix).forEach(perm => {
            const tr = document.createElement('tr');
            let colsHtml = `<td style="font-weight:600">${perm}</td>`;
            
            roles.forEach(role => {
                const isChecked = matrix[perm].includes(role) ? 'checked' : '';
                const isDisabled = role === 'System Admin' ? 'disabled' : '';
                colsHtml += `
                    <td>
                        <input type="checkbox" class="checkbox-custom perm-checkbox" 
                            data-perm="${perm}" data-role="${role}" 
                            ${isChecked} ${isDisabled}>
                    </td>
                `;
            });
            
            tr.innerHTML = colsHtml;
            tbody.appendChild(tr);
        });
    },

    savePermissions: function() {
        const checkboxes = document.querySelectorAll('.perm-checkbox');
        const db = Store.getData();
        const newMatrix = {};

        Object.keys(db.permissionsMatrix).forEach(k => newMatrix[k] = []);

        checkboxes.forEach(cb => {
            if (cb.checked) {
                const perm = cb.getAttribute('data-perm');
                const role = cb.getAttribute('data-role');
                if (!newMatrix[perm]) newMatrix[perm] = [];
                newMatrix[perm].push(role);
            }
        });

        db.permissionsMatrix = newMatrix;
        Store.saveData(db);
        Store.showToast("Permissions updated", "success");
    },

    resetPermissions: function() {
        const db = Store.getData();
        if (typeof initialData !== 'undefined') {
            db.permissionsMatrix = JSON.parse(JSON.stringify(initialData.permissionsMatrix));
            Store.saveData(db);
            this.renderRolesMatrix();
            Store.showToast("Matrix reset to defaults", "warning");
        }
    },

    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    adminApp.init();
});
