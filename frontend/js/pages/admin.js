const adminApp = {
    viewAllUsers: false,
    init: async function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'System Admin') {
            window.location.href = 'login.html';
            return;
        }
        await Store.sync();
        
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

        let displayUsers = [...users].reverse(); // newest first
        
        // Exclude System Admin users — they should not be shown in user management
        const managableUsers = displayUsers.filter(u => u.role !== 'System Admin');

        // Render Dashboard Table (Slice top 5, no System Admins)
        if (tbody) {
            managableUsers.slice(0, 5).forEach(u => {
                tbody.appendChild(this.buildUserRow(u));
            });
        }
        
        // Render User Management Table (All, no System Admins)
        const allBody = document.querySelector('#all-users-tbody');
        if (allBody) {
            allBody.innerHTML = '';
            managableUsers.forEach(u => {
                allBody.appendChild(this.buildUserRow(u));
            });
        }
    },
    
    buildUserRow: function(u) {
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
        return tr;
    },

    triggerViewAll: function() {
        this.switchView('user-manage-view');
        // Update Sidebar active state manually since this isn't a direct sidebar click
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const targetNav = document.querySelector('.nav-item[data-target="user-manage-view"]');
        if(targetNav) targetNav.classList.add('active');
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

    addUser: function() {
        const db = Store.getData();
        const depts = db.departments;
        let deptOptions = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
        
        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Full Name</label>
                <input type="text" id="modal-user-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. John Doe">
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Email Address</label>
                <input type="email" id="modal-user-email" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="user@resourcex.com">
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">System Role</label>
                <select id="modal-user-role" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    <option value="Requestor">Requestor</option>
                    <option value="Dept Head">Dept Head</option>
                    <option value="Registrar">Registrar</option>
                    <option value="Staff">Staff</option>
                    <option value="System Admin">System Admin</option>
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department</label>
                <select id="modal-user-dept" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    ${deptOptions}
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Password</label>
                <input type="password" id="modal-user-password" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="Enter temporary password">
            </div>
        `;
        this.openModal("Add New User", html, async () => {
            const name = document.getElementById('modal-user-name').value.trim();
            const email = document.getElementById('modal-user-email').value.trim();
            const role = document.getElementById('modal-user-role').value;
            const dept = document.getElementById('modal-user-dept').value;
            const password = document.getElementById('modal-user-password').value.trim();

            const nameRegex = /^[a-zA-Z0-9\s.-]+$/;

            if (!name || !email || !password) {
                Store.showToast("Please fill out all fields including password.", "error");
                return;
            }

            if (!nameRegex.test(name)) {
                Store.showToast("Name can only contain characters and numbers.", "error");
                return;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                Store.showToast("Please enter a valid email address.", "error");
                document.getElementById('modal-user-email').focus();
                return;
            }

            if (password.length < 6) {
                Store.showToast("Password must be at least 6 characters long.", "error");
                return;
            }

            await Store.createUser({
                id: `U-9${Math.floor(100 + Math.random() * 900)}`,
                name: name,
                email: email,
                password: password,
                role: role,
                department: dept,
                status: "Active"
            });
            this.renderUsers();
            Store.showToast("New user successfully added.", "success");
            this.closeModal();
        });
    },

    editUser: function(id) {
        const user = Store.getData().users.find(u => u.id === id);
        if(!user) return;
        const depts = Store.getData().departments || [];
        const deptOptions = depts.map(d => `<option value="${d.name}" ${user.department === d.name ? 'selected' : ''}>${d.name}</option>`).join('');

        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Name</label>
                <input type="text" id="modal-edit-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${user.name}">
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Role</label>
                <select id="modal-role-select" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    <option value="Requestor" ${user.role === 'Requestor' ? 'selected' : ''}>Requestor</option>
                    <option value="Dept Head" ${user.role === 'Dept Head' ? 'selected' : ''}>Dept Head</option>
                    <option value="Registrar" ${user.role === 'Registrar' ? 'selected' : ''}>Registrar</option>
                    <option value="Staff" ${user.role === 'Staff' ? 'selected' : ''}>Staff</option>
                    <option value="System Admin" ${user.role === 'System Admin' ? 'selected' : ''}>System Admin</option>
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department</label>
                <select id="modal-dept-select" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    ${deptOptions}
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Account Status</label>
                <select id="modal-status-select" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    <option value="Active" ${user.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${user.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="Suspended" ${user.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">New Password <span style="font-size:0.75rem; color:#64748b; font-weight:normal">(Leave blank to keep current)</span></label>
                <input type="password" id="modal-edit-password" placeholder="Enter new password" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
            </div>
        `;
        this.openModal("Edit User", html, async () => {
            const newName = document.getElementById('modal-edit-name').value.trim();
            const newRole = document.getElementById('modal-role-select').value;
            const newDept = document.getElementById('modal-dept-select').value;
            const newStatus = document.getElementById('modal-status-select').value;
            const newPassword = document.getElementById('modal-edit-password').value.trim();
            
            const nameRegex = /^[a-zA-Z0-9\s.-]+$/;

            if (!newName) {
                Store.showToast("Name cannot be empty.", "error");
                return;
            }

            if (!nameRegex.test(newName)) {
                Store.showToast("Name can only contain characters and numbers.", "error");
                return;
            }
            
            if (newPassword.length > 0 && newPassword.length < 6) {
                Store.showToast("Password must be at least 6 characters long.", "error");
                return;
            }

            const updates = { 
                name: newName,
                role: newRole,
                department: newDept,
                status: newStatus
            };

            if (newPassword) {
                updates.password = newPassword;
            }

            await Store.updateUser(id, updates);
            
            const currentUser = Store.getCurrentUser();
            if (currentUser && currentUser.id === id) {
                Store.setCurrentUser({
                    ...currentUser,
                    ...updates
                });
                // Update nav/header directly if on page
                const uiName = document.querySelector('.user-name');
                if (uiName) uiName.textContent = newName;
            }
            
            this.renderUsers();
            Store.showToast("User details updated permanently.", "success");
            this.closeModal();
        });
    },

    deleteUser: function(id) {
        const html = `<p style="color:#64748b; margin:0">Are you absolutely sure you want to deactivate this user? They will lose access immediately.</p>`;
        this.openModal("Deactivate User", html, async () => {
            await Store.updateUser(id, { status: "Inactive" });
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
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <button class="btn-secondary" style="font-size:0.75rem" onclick="adminApp.editDept('${d.id}')">Edit</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="adminApp.deleteDept('${d.id}')">Delete</button>
                </div>
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
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Letters, spaces, hyphens and dots only.</div>
            </div>
            <div>
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Head Name</label>
                <input type="text" id="modal-dept-head" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. pradhyum">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Alphabets and spaces only.</div>
            </div>
        `;
        const nameRegex = /^[a-zA-Z\s\-\.]+$/;
        const headRegex = /^[a-zA-Z\s\.]+$/;

        this.openModal("Add New Department", html, async () => {
            const name = document.getElementById('modal-dept-name').value.trim();
            const head = document.getElementById('modal-dept-head').value.trim();

            if (!name || !head) {
                Store.showToast("Please fill in all fields.", "error");
                return;
            }
            if (!nameRegex.test(name)) {
                Store.showToast("Department name can only contain letters, spaces, hyphens and dots.", "error");
                return;
            }
            if (!headRegex.test(head)) {
                Store.showToast("Head name can only contain letters and spaces.", "error");
                return;
            }

            const db = Store.getData();
            const exists = db.departments.some(d => d.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                Store.showToast("A department with this name already exists.", "error");
                return;
            }

            await Store.createDepartment({
                id: `D${Math.floor(100 + Math.random() * 900)}`,
                name: name,
                head: head,
                memberCount: 0
            });
            this.renderDepartments();
            Store.showToast("Department added successfully.", "success");
            this.closeModal();
        });
    },

    editDept: function(id) {
        const dept = Store.getData().departments.find(d => d.id === id);
        if (!dept) return;

        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department Name</label>
                <input type="text" id="modal-edit-dept-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${dept.name}">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Letters, spaces, hyphens and dots only.</div>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Head Name</label>
                <input type="text" id="modal-edit-dept-head" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${dept.head}">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Alphabets and spaces only.</div>
            </div>
            <div>
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Member Count</label>
                <input type="number" id="modal-edit-dept-members" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${dept.memberCount}" min="0">
            </div>
        `;

        const nameRegex = /^[a-zA-Z\s\-\.]+$/;
        const headRegex = /^[a-zA-Z\s\.]+$/;

        this.openModal("Edit Department", html, async () => {
            const newName    = document.getElementById('modal-edit-dept-name').value.trim();
            const newHead    = document.getElementById('modal-edit-dept-head').value.trim();
            const newMembers = parseInt(document.getElementById('modal-edit-dept-members').value);

            if (!newName || !newHead) {
                Store.showToast("Please fill in all fields.", "error");
                return;
            }
            if (!nameRegex.test(newName)) {
                Store.showToast("Department name can only contain letters, spaces, hyphens and dots.", "error");
                return;
            }
            if (!headRegex.test(newHead)) {
                Store.showToast("Head name can only contain letters and spaces.", "error");
                return;
            }
            if (isNaN(newMembers) || newMembers < 0) {
                Store.showToast("Member count must be a non-negative number.", "error");
                return;
            }

            // Check duplicate name (ignore the current dept)
            const db = Store.getData();
            const duplicate = db.departments.some(d => d.id !== id && d.name.toLowerCase() === newName.toLowerCase());
            if (duplicate) {
                Store.showToast("Another department with this name already exists.", "error");
                return;
            }

            await Store.updateDepartment(id, { name: newName, head: newHead, memberCount: newMembers });
            this.renderDepartments();
            Store.showToast("Department updated successfully.", "success");
            this.closeModal();
        });
    },

    deleteDept: function(id) {
        const html = `<p style="color:#b91c1c; margin:0">Warning: Deleting this department affects all linked associated users and active resources. Proceed at your own risk.</p>`;
        this.openModal("Delete Department", html, async () => {
            await Store.deleteDepartment(id);
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

        Store.updatePermissionsMatrix(newMatrix)
            .then(() => {
                this.renderRolesMatrix();
                Store.showToast("Permissions updated", "success");
            });
    },

    resetPermissions: function() {
        Store.resetPermissionsMatrix()
            .then(() => {
                this.renderRolesMatrix();
                Store.showToast("Matrix reset to defaults", "warning");
            });
    },

    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await adminApp.init();
});
