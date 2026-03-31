const initialData = {
    users: [
        { id: "U1", name: "Yaswanth Kumar", email: "yaswanth@resourcex.com", role: "Requestor", department: "IT Services", status: "Active" },
        { id: "U2", name: "Sarah Jenkins", email: "sarah@resourcex.com", role: "Dept Head", department: "IT Services", status: "Active" },
        { id: "U3", name: "Dr. Eleanor Vance", email: "eleanor@resourcex.com", role: "Registrar", department: "Administration", status: "Active" },
        { id: "U4", name: "Mike Torres", email: "mike@resourcex.com", role: "Staff", department: "Operations", status: "Active" },
        { id: "U5", name: "System Root", email: "admin@resourcex.com", role: "System Admin", department: "Administration", status: "Active" },
        { id: "U6", name: "Alice Worker", email: "alice@resourcex.com", role: "Requestor", department: "HR Dept", status: "Active" },
        { id: "U7", name: "John Doe", email: "john@resourcex.com", role: "Dept Head", department: "HR Dept", status: "Active" },
        { id: "U8", name: "Jane Smith", email: "jane@resourcex.com", role: "Dept Head", department: "Operations", status: "Active" },
        { id: "U9", name: "Bob Builder", email: "bob@resourcex.com", role: "Requestor", department: "Operations", status: "Active" }
    ],
    departments: [
        { id: "D1", name: "IT Services", head: "Sarah Jenkins", memberCount: 15 },
        { id: "D2", name: "HR Dept", head: "John Doe", memberCount: 8 },
        { id: "D3", name: "Operations", head: "Jane Smith", memberCount: 20 },
        { id: "D4", name: "Administration", head: "Dr. Eleanor Vance", memberCount: 5 },
        { id: "D5", name: "Facilities", head: "Mike Torres", memberCount: 12 }
    ],
    requests: [
        // Yaswanth's Requests (Requestor) & Sarah's Incoming (Dept Head in IT)
        { id: "REQ-101", resourceType: "High-Cap Battery", quantity: 1, requestor: "Yaswanth Kumar", department: "IT Services", status: "Allocated", priority: "Normal", date: "Oct 24, 2023", justification: "Restocking for field ops" },
        { id: "REQ-102", resourceType: "Server Blades v2", quantity: 2, requestor: "Yaswanth Kumar", department: "IT Services", status: "Pending", priority: "High", date: "Oct 25, 2023", justification: "Server upgrade capacity" },
        { id: "REQ-103", resourceType: "Developer Laptops", quantity: 3, requestor: "Yaswanth Kumar", department: "IT Services", status: "Pending", priority: "Normal", date: "Oct 26, 2023", justification: "New team members joining" },
        { id: "REQ-104", resourceType: "External Hard Drives", quantity: 5, requestor: "Yaswanth Kumar", department: "IT Services", status: "Approved", priority: "Normal", date: "Oct 27, 2023", justification: "Local backup storage" }, // Appears in Staff Allocation
        
        // Alice's Requests (Requestor) & John's Incoming (Dept Head in HR)
        { id: "REQ-201", resourceType: "Laptop Bundles", quantity: 2, requestor: "Alice Worker", department: "HR Dept", status: "Approved", priority: "Normal", date: "Oct 22, 2023", justification: "New hires onboarding" }, // Appears in Staff Allocation
        { id: "REQ-202", resourceType: "Standing Desks", quantity: 2, requestor: "Alice Worker", department: "HR Dept", status: "Pending", priority: "Normal", date: "Oct 27, 2023", justification: "Employee wellness program" },
        { id: "REQ-203", resourceType: "Ergonomic Keyboards", quantity: 3, requestor: "Alice Worker", department: "HR Dept", status: "Pending", priority: "Low", date: "Oct 28, 2023", justification: "Ergonomic setup requested" },
        
        // Bob's Requests (Requestor) & Jane's Incoming (Dept Head in Ops)
        { id: "REQ-301", resourceType: "Projector Screens", quantity: 2, requestor: "Bob Builder", department: "Operations", status: "Rejected", priority: "Low", date: "Oct 18, 2023", justification: "Not enough budget" },
        { id: "REQ-302", resourceType: "Whiteboards", quantity: 4, requestor: "Bob Builder", department: "Operations", status: "Allocated", priority: "Low", date: "Oct 01, 2023", justification: "New meeting rooms" },
        { id: "REQ-303", resourceType: "Walkie Talkies", quantity: 6, requestor: "Bob Builder", department: "Operations", status: "Pending", priority: "High", date: "Oct 29, 2023", justification: "Facility comms" }
    ],
    resources: [
        // Yaswanth's Assigned Resources (Requestor)
        { id: "RES-1049", name: "Laptop - Dell XPS", type: "Laptop", department: "IT Services", serialNumber: "SN-998822", status: "Allocated", condition: "Good", assignedTo: "Yaswanth Kumar", date: "Jan 12, 2023" },
        { id: "RES-9055", name: "Mechanical Keyboard", type: "Accessories", department: "IT Services", serialNumber: "SN-778899", status: "Allocated", condition: "Good", assignedTo: "Yaswanth Kumar", date: "Sep 22, 2023" },
        
        // Alice's Assigned Resources (Requestor)
        { id: "RES-8044", name: "Monitor 27 inch", type: "Electronics", department: "HR Dept", serialNumber: "SN-556677", status: "Allocated", condition: "Good", assignedTo: "Alice Worker", date: "Aug 12, 2023" },
        { id: "RES-2933", name: "Projector X1", type: "Electronics", department: "HR Dept", serialNumber: "SN-112233", status: "Allocated", condition: "Fair", assignedTo: "Alice Worker", date: "Feb 05, 2023" },
        
        // Bob's Assigned Resources (Requestor)
        { id: "RES-4050", name: "Ergonomic Chair", type: "Furniture", department: "Operations", serialNumber: "SN-221144", status: "Allocated", condition: "Good", assignedTo: "Bob Builder", date: "Apr 15, 2023" },
        { id: "RES-1122", name: "Tablet Pro", type: "Electronics", department: "Operations", serialNumber: "SN-889900", status: "Allocated", condition: "Fair", assignedTo: "Bob Builder", date: "Oct 01, 2023" },
        
        // Maintenance Queue (Staff)
        { id: "RES-5011", name: "Server Blade", type: "Hardware", department: "IT Services", serialNumber: "SN-990088", status: "Maintenance Requested", condition: "Damaged", assignedTo: "Yaswanth Kumar", date: "May 20, 2023" },
        { id: "RES-5012", name: "Printer X", type: "Electronics", department: "HR Dept", serialNumber: "SN-880099", status: "Maintenance Requested", condition: "Damaged", assignedTo: "Alice Worker", date: "May 21, 2023" },
        { id: "RES-5013", name: "Coffee Machine", type: "Appliance", department: "Facilities", serialNumber: "SN-770088", status: "Maintenance", condition: "Damaged", assignedTo: "None", date: "May 22, 2023" },
        
        // Returned Queue (Staff)
        { id: "RES-6001", name: "Wireless Mouse", type: "Accessories", department: "IT Services", serialNumber: "SN-112233", status: "Returned", condition: "Fair", assignedTo: "Yaswanth Kumar", date: "Oct 28, 2023" },
        { id: "RES-6002", name: "Presentation Remote", type: "Accessories", department: "Operations", serialNumber: "SN-223344", status: "Returned", condition: "Fair", assignedTo: "Bob Builder", date: "Oct 29, 2023" },
        { id: "RES-6003", name: "Headset", type: "Accessories", department: "HR Dept", serialNumber: "SN-334455", status: "Returned", condition: "Fair", assignedTo: "Alice Worker", date: "Oct 29, 2023" },
        
        // Available / Global
        { id: "RES-6022", name: "Network Switch", type: "Hardware", department: "IT Services", serialNumber: "SN-110022", status: "Available", condition: "Good", assignedTo: "None", date: "Jun 10, 2023" },
        { id: "RES-2233", name: "Printer Color", type: "Electronics", department: "Administration", serialNumber: "SN-001122", status: "Available", condition: "Fair", assignedTo: "None", date: "Oct 15, 2023" }
    ],
    procurements: [
        // Pending (For Registrar Approval)
        { id: "PROC-819", resourceType: "Server Blades v2", quantity: 10, department: "IT Services", requestedBy: "Sarah Jenkins", status: "Pending", date: "Oct 26, 2023", justification: "Capacity increase required." },
        { id: "PROC-820", resourceType: "HR Software Licenses", quantity: 5, department: "HR Dept", requestedBy: "John Doe", status: "Pending", date: "Oct 28, 2023", justification: "New system rollout." },
        { id: "PROC-821", resourceType: "Logistics Software", quantity: 2, department: "Operations", requestedBy: "Jane Smith", status: "Pending", date: "Oct 29, 2023", justification: "Tracking upgrade." },
        
        // Approved (For Staff Fulfillment)
        { id: "PROC-901", resourceType: "Microscope Sets", quantity: 5, department: "Operations", requestedBy: "Jane Smith", status: "Approved", date: "Oct 21, 2023", justification: "Lab equipment upgrade." },
        { id: "PROC-911", resourceType: "Cisco Routers", quantity: 4, department: "IT Services", requestedBy: "Sarah Jenkins", status: "Approved", date: "Oct 25, 2023", justification: "Network infrastructure upgrade." },
        { id: "PROC-912", resourceType: "Office Desks", quantity: 8, department: "HR Dept", requestedBy: "John Doe", status: "Approved", date: "Oct 26, 2023", justification: "New expansion." },

        // Rejected / Fulfilled
        { id: "PROC-905", resourceType: "OLED Monitors", quantity: 20, department: "IT Services", requestedBy: "Sarah Jenkins", status: "Rejected", date: "Oct 15, 2023", justification: "Exceeds annual budget." },
        { id: "PROC-850", resourceType: "Conference Tables", quantity: 2, department: "Facilities", requestedBy: "Mike Torres", status: "Fulfilled", date: "Sep 10, 2023", justification: "New building setup." }
    ],
    notifications: [
        { id: "N1", title: "Welcome to ResourceX", description: "Your account has been created.", time: "1 day ago", read: false, recipientRole: "All" },
        { id: "N2", title: "Maintenance Alert", description: "RES-5011 requires urgent repair.", time: "2 hours ago", read: false, recipientRole: "Staff" },
        { id: "N3", title: "Procurement Approved", description: "Microscope Sets Approved by Registrar.", time: "5 mins ago", read: false, recipientRole: "Dept Head" }
    ],
    maintenanceHistory: [
        { code: "RES-2233", type: "Printer Color", allocatedTo: "None", issue: "Paper Jam", actionDate: "Oct 16, 2023", status: "Repaired" },
        { code: "RES-1122", type: "Tablet Pro", allocatedTo: "Jane Smith", issue: "Shattered Screen", actionDate: "Oct 10, 2023", status: "Scrap" },
        { code: "RES-3311", type: "Coffee Maker", allocatedTo: "HQ Lounge", issue: "Heating Element", actionDate: "Oct 01, 2023", status: "Repaired" }
    ],
    returnHistory: [
        { code: "RES-9988", type: "Laptop - Old", returnedBy: "Bob Builder", returnDate: "Oct 20, 2023", processDate: "Oct 21, 2023", condition: "Bad", finalStatus: "Scrapped" },
        { code: "RES-7766", type: "Office Desk", returnedBy: "Alice Worker", returnDate: "Oct 22, 2023", processDate: "Oct 23, 2023", condition: "Good", finalStatus: "Available" },
        { code: "RES-5544", type: "Monitor Mount", returnedBy: "Sarah Jenkins", returnDate: "Oct 25, 2023", processDate: "Oct 26, 2023", condition: "Good", finalStatus: "Available" }
    ],
    permissionsMatrix: {
        "Request Resources": ["Requestor", "System Admin"],
        "View Own Resources": ["Requestor", "Dept Head", "System Admin"],
        "Return Resources": ["Requestor", "System Admin"],
        "Request Maintenance": ["Requestor", "System Admin"],
        "Approve/Reject Requests": ["Dept Head", "System Admin"],
        "View Department Resources": ["Dept Head", "System Admin"],
        "Department Analytics": ["Dept Head", "System Admin"],
        "Stock Monitoring": ["Dept Head", "System Admin"],
        "Initiate Procurement": ["Dept Head", "System Admin"],
        "Procurement Approval": ["Registrar", "System Admin"],
        "System Analytics": ["Registrar", "System Admin"],
        "Allocate Resources": ["Staff", "System Admin"],
        "Manage Resources": ["Staff", "System Admin"],
        "Add Resource Types": ["Staff", "System Admin"],
        "Handle Maintenance": ["Staff", "System Admin"],
        "Handle Returns": ["Staff", "System Admin"],
        "Receive Procurement": ["Staff", "System Admin"],
        "User Management": ["System Admin"],
        "Department Management": ["System Admin"],
        "Role Management": ["System Admin"],
        "System Settings": ["System Admin"]
    },
    currentUser: null
};

class DataStore {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (localStorage.getItem('rx_initialized') !== 'v2') {
            this.resetToDefaults();
            localStorage.setItem('rx_initialized', 'v2');
        }
    }

    resetToDefaults() {
        localStorage.setItem('rx_data', JSON.stringify(initialData));
    }

    getData() {
        return JSON.parse(localStorage.getItem('rx_data')) || initialData;
    }

    saveData(data) {
        localStorage.setItem('rx_data', JSON.stringify(data));
    }

    // Auth
    login(email, password) {
        const data = this.getData();
        const user = data.users.find(u => u.email === email);
        if (user) {
            data.currentUser = user;
            this.saveData(data);
            return user;
        }
        return null;
    }

    logout() {
        const data = this.getData();
        data.currentUser = null;
        this.saveData(data);
    }

    getCurrentUser() {
        return this.getData().currentUser;
    }

    // CRUD Helper
    addItem(collection, item) {
        const data = this.getData();
        data[collection].unshift(item); // Add to beginning
        this.saveData(data);
        return item;
    }

    updateItem(collection, id, updates) {
        const data = this.getData();
        const index = data[collection].findIndex(i => i.id === id);
        if (index > -1) {
            data[collection][index] = { ...data[collection][index], ...updates };
            this.saveData(data);
            return data[collection][index];
        }
        return null;
    }

    deleteItem(collection, id) {
        const data = this.getData();
        data[collection] = data[collection].filter(i => i.id !== id);
        this.saveData(data);
    }

    // Global Toast Notification
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

        // Remove from DOM after animation
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 3000);
    }
}

// Instantiate global store
const Store = new DataStore();
