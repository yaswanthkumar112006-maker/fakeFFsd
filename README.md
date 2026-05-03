# Problem Statement : Asset & Resource Allocation Management System

Organizations often allocate & manage assets such as laptops, projectors, routers, and other equipment using manual methods. This can lead to poor tracking, delayed approvals, and inefficient resource utilization.

This project provides a **centralized web-based system** to allocate & manage the complete lifecycle of organizational resources with **role-based dashboards**.

---

# System Overview

The system manages the full lifecycle of resources:

- Resource Request
- Approval Process
- Resource Allocation
- Maintenance Management
- Resource Return
- Scrap Management
- Procurement Management

---

# User Roles

The system supports five roles:

1. **Requester** – Requests resources and manages allocated assets  
2. **Department Head** – Approves requests and monitors department resources  
3. **Registrar** – Approves procurement requests  
4. **Staff** – Handles allocation, procurement, maintenance, and returns  
5. **System Admin** – Manages users, departments, and permissions  

---

# Dashboards

## Requester Dashboard

### Request Resource
Users can request resources by selecting:

- Department
- Resource Type
- Quantity
- Reason

If the resource is not available, users can **request a new resource**.  
Each request generates a **Request ID** and is sent to the Department Head.

### My Requests
Users can track all requests with statuses:

- Pending
- Approved
- Rejected
- Allocated

When allocated, the user confirms receipt and the resource appears in **My Resources**.

### My Resources
Shows all currently allocated resources.

Users can:
- **Return Resource**
- **Request Maintenance**

Possible resource statuses:
- Allocated
- Maintenance Requested
- Under Maintenance
- Repaired
- Scrap

---

# Department Head Dashboard

### Incoming Requests
Review resource requests from department users.

Actions:
- **Accept** → Forward to Staff for allocation  
- **Reject** → Notify Requestor  

### Department Resources
View all department resources with:

- Search
- Quantity tracking
- Allocation details
- Maintenance history

### Resource Analytics
Displays department statistics:

- Total Resources
- Available Resources
- Allocated Resources
- Resources Under Maintenance
- Scrap Resources
- Monthly Request Trends
- Most Requested Resources

### Stock Monitoring
Monitors resource stock levels using threshold values.

Stock categories:

- **Safe Stock** – Quantity above threshold  
- **Near Threshold** – Quantity close to threshold  
- **Low Stock** – Quantity below threshold  

Actions:
- **Edit Threshold** – Change minimum stock level  
- **Send Procurement Request** – Request additional resources

### Procurement Requests
Department Heads can request new resources by specifying:

- Resource Type
- Quantity

Status tracking:
- Pending
- Accepted
- Rejected

---

# Registrar Dashboard

The Registrar manages procurement approvals.

### Procurement Requests
Actions:
- **Accept** → Creates procurement task for staff  
- **Reject** → Notify Department Head

### Requests Overview
View procurement requests with filters:

- Pending
- Accepted
- Rejected
- Department

### System Analytics
Displays system-wide statistics such as:

- Requests per department
- Monthly request trends
- High-demand departments
- Total resources

---

# Staff Dashboard

Staff manage operational tasks including allocation, procurement, and maintenance.

### Allocation Requests
Assign resources to approved requests with support for **partial allocation**.

### Procurement Tasks
After registrar approval, staff complete procurement by entering:

- Vendor Name
- Invoice Number
- Purchase Date
- Warranty Details

Purchased resources are then **registered in the system**.

### Manage Resources
Staff can:
- Add resources
- Edit resource details
- View resource information

### Maintenance Management
Staff process maintenance requests:

- Accept / Reject request
- Mark as Repaired
- Mark as Scrap

### Return Management
Staff inspect returned resources and mark them as:

- Available
- Scrap

---

# System Admin Dashboard

The System Admin manages system configuration.

### User Management
- Add users
- Edit users
- Assign roles
- Assign departments

### Department Management
- Add departments
- Edit departments
- Delete departments
- Assign department heads

### Role & Permission Control
Define which features each role can access.

----
