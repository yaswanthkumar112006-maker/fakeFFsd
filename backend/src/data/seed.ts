import {
  AppState,
  DepartmentRecord,
  StockThresholdRecord,
  UserRecord,
} from '../common/domain';

export const seedState: AppState = {
  users: [
    { id: 'U1', name: 'RAVI CHANDRA', email: 'ravi@resourcex.com', password: '12345678', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U2', name: 'pradhyum', email: 'pradhyum@resourcex.com', password: '12345678', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U3', name: 'HARSHA TEJ', email: 'harsha@resourcex.com', password: '12345678', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U4', name: 'prem kumar', email: 'prem@resourcex.com', password: '12345678', role: 'Staff', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U5', name: 'yashwath', email: 'yashwath@resourcex.com', password: '12345678', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U6', name: 'Alice Worker', email: 'alice@resourcex.com', password: '12345678', role: 'Requestor', department: 'HR Dept', status: 'Active', preferences: { notifications: true } },
    { id: 'U7', name: 'John Doe', email: 'john@resourcex.com', password: '12345678', role: 'Dept Head', department: 'HR Dept', status: 'Active', preferences: { notifications: true } },
    { id: 'U8', name: 'Jane Smith', email: 'jane@resourcex.com', password: '12345678', role: 'Dept Head', department: 'Operations', status: 'Active', preferences: { notifications: true } },
    { id: 'U9', name: 'Bob Builder', email: 'bob@resourcex.com', password: '12345678', role: 'Requestor', department: 'Operations', status: 'Active', preferences: { notifications: true } }
  ],
  departments: [
    { id: 'D1', name: 'IT Services', head: 'pradhyum', memberCount: 15 },
    { id: 'D2', name: 'HR Dept', head: 'John Doe', memberCount: 8 },
    { id: 'D3', name: 'Operations', head: 'Jane Smith', memberCount: 20 },
    { id: 'D4', name: 'Administration', head: 'HARSHA TEJ', memberCount: 5 },
    { id: 'D5', name: 'Facilities', head: 'prem kumar', memberCount: 12 }
  ],
  requests: [
    { id: 'REQ-101', resourceType: 'High-Cap Battery', quantity: 1, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Allocated', priority: 'Normal', date: 'Oct 24, 2023', justification: 'Restocking for field ops' },
    { id: 'REQ-102', resourceType: 'Server Blades v2', quantity: 2, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Pending', priority: 'High', date: 'Oct 25, 2023', justification: 'Server upgrade capacity' },
    { id: 'REQ-103', resourceType: 'Developer Laptops', quantity: 3, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Pending', priority: 'Normal', date: 'Oct 26, 2023', justification: 'New team members joining' },
    { id: 'REQ-104', resourceType: 'External Hard Drives', quantity: 5, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Approved', priority: 'Normal', date: 'Oct 27, 2023', justification: 'Local backup storage' },
    { id: 'REQ-201', resourceType: 'Laptop Bundles', quantity: 2, requestor: 'Alice Worker', requestorId: 'U6', department: 'HR Dept', status: 'Approved', priority: 'Normal', date: 'Oct 22, 2023', justification: 'New hires onboarding' },
    { id: 'REQ-202', resourceType: 'Standing Desks', quantity: 2, requestor: 'Alice Worker', requestorId: 'U6', department: 'HR Dept', status: 'Pending', priority: 'Normal', date: 'Oct 27, 2023', justification: 'Employee wellness program' },
    { id: 'REQ-203', resourceType: 'Ergonomic Keyboards', quantity: 3, requestor: 'Alice Worker', requestorId: 'U6', department: 'HR Dept', status: 'Pending', priority: 'Low', date: 'Oct 28, 2023', justification: 'Ergonomic setup requested' },
    { id: 'REQ-301', resourceType: 'Projector Screens', quantity: 2, requestor: 'Bob Builder', requestorId: 'U9', department: 'Operations', status: 'Rejected', priority: 'Low', date: 'Oct 18, 2023', justification: 'Not enough budget' },
    { id: 'REQ-302', resourceType: 'Whiteboards', quantity: 4, requestor: 'Bob Builder', requestorId: 'U9', department: 'Operations', status: 'Allocated', priority: 'Low', date: 'Oct 01, 2023', justification: 'New meeting rooms' },
    { id: 'REQ-303', resourceType: 'Walkie Talkies', quantity: 6, requestor: 'Bob Builder', requestorId: 'U9', department: 'Operations', status: 'Pending', priority: 'High', date: 'Oct 29, 2023', justification: 'Facility comms' }
  ],
  resources: [
    { id: 'RES-1049', name: 'Laptop - Dell XPS', type: 'Laptop', department: 'IT Services', serialNumber: 'SN-998822', status: 'Allocated', condition: 'Good', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'Jan 12, 2023' },
    { id: 'RES-9055', name: 'Mechanical Keyboard', type: 'Accessories', department: 'IT Services', serialNumber: 'SN-778899', status: 'Allocated', condition: 'Good', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'Sep 22, 2023' },
    { id: 'RES-8044', name: 'Monitor 27 inch', type: 'Electronics', department: 'HR Dept', serialNumber: 'SN-556677', status: 'Allocated', condition: 'Good', assignedTo: 'Alice Worker', assignedToId: 'U6', date: 'Aug 12, 2023' },
    { id: 'RES-2933', name: 'Projector X1', type: 'Electronics', department: 'HR Dept', serialNumber: 'SN-112233', status: 'Allocated', condition: 'Fair', assignedTo: 'Alice Worker', assignedToId: 'U6', date: 'Feb 05, 2023' },
    { id: 'RES-4050', name: 'Ergonomic Chair', type: 'Furniture', department: 'Operations', serialNumber: 'SN-221144', status: 'Allocated', condition: 'Good', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Apr 15, 2023' },
    { id: 'RES-1122', name: 'Tablet Pro', type: 'Electronics', department: 'Operations', serialNumber: 'SN-889900', status: 'Allocated', condition: 'Fair', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 01, 2023' },
    { id: 'RES-5011', name: 'Server Blade', type: 'Hardware', department: 'IT Services', serialNumber: 'SN-990088', status: 'Maintenance Requested', condition: 'Damaged', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'May 20, 2023', vendor: 'Cisco Systems', invoice: 'INV-8899' },
    { id: 'RES-5012', name: 'Printer X', type: 'Electronics', department: 'HR Dept', serialNumber: 'SN-880099', status: 'Maintenance Requested', condition: 'Damaged', assignedTo: 'Alice Worker', assignedToId: 'U6', date: 'May 21, 2023' },
    { id: 'RES-5013', name: 'Coffee Machine', type: 'Appliance', department: 'Facilities', serialNumber: 'SN-770088', status: 'Maintenance', condition: 'Damaged', assignedTo: 'None', date: 'May 22, 2023' },
    { id: 'RES-6001', name: 'Wireless Mouse', type: 'Accessories', department: 'IT Services', serialNumber: 'SN-112233-A', status: 'Returned', condition: 'Fair', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'Oct 28, 2023' },
    { id: 'RES-6002', name: 'Presentation Remote', type: 'Accessories', department: 'Operations', serialNumber: 'SN-223344', status: 'Returned', condition: 'Fair', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 29, 2023' },
    { id: 'RES-6003', name: 'Headset', type: 'Accessories', department: 'HR Dept', serialNumber: 'SN-334455', status: 'Returned', condition: 'Fair', assignedTo: 'Alice Worker', assignedToId: 'U6', date: 'Oct 29, 2023' },
    { id: 'RES-6022', name: 'Network Switch', type: 'Hardware', department: 'IT Services', serialNumber: 'SN-110022', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'Jun 10, 2023' },
    { id: 'RES-2233', name: 'Printer Color', type: 'Electronics', department: 'Administration', serialNumber: 'SN-001122', status: 'Available', condition: 'Fair', assignedTo: 'None', date: 'Oct 15, 2023' }
  ],
  procurements: [
    { id: 'PROC-819', resourceType: 'Server Blades v2', item: 'Server Blades v2', quantity: 10, department: 'IT Services', requestedBy: 'pradhyum', requester: 'pradhyum', requestedById: 'U2', status: 'Pending', date: 'Oct 26, 2023', justification: 'Capacity increase required.' },
    { id: 'PROC-820', resourceType: 'HR Software Licenses', item: 'HR Software Licenses', quantity: 5, department: 'HR Dept', requestedBy: 'John Doe', requester: 'John Doe', requestedById: 'U7', status: 'Pending', date: 'Oct 28, 2023', justification: 'New system rollout.' },
    { id: 'PROC-821', resourceType: 'Logistics Software', item: 'Logistics Software', quantity: 2, department: 'Operations', requestedBy: 'Jane Smith', requester: 'Jane Smith', requestedById: 'U8', status: 'Pending', date: 'Oct 29, 2023', justification: 'Tracking upgrade.' },
    { id: 'PROC-901', resourceType: 'Microscope Sets', item: 'Microscope Sets', quantity: 5, department: 'Operations', requestedBy: 'Jane Smith', requester: 'Jane Smith', requestedById: 'U8', status: 'Approved', date: 'Oct 21, 2023', justification: 'Lab equipment upgrade.' },
    { id: 'PROC-911', resourceType: 'Cisco Routers', item: 'Cisco Routers', quantity: 4, department: 'IT Services', requestedBy: 'pradhyum', requester: 'pradhyum', requestedById: 'U2', status: 'Approved', date: 'Oct 25, 2023', justification: 'Network infrastructure upgrade.' },
    { id: 'PROC-912', resourceType: 'Office Desks', item: 'Office Desks', quantity: 8, department: 'HR Dept', requestedBy: 'John Doe', requester: 'John Doe', requestedById: 'U7', status: 'Approved', date: 'Oct 26, 2023', justification: 'New expansion.' },
    { id: 'PROC-905', resourceType: 'OLED Monitors', item: 'OLED Monitors', quantity: 20, department: 'IT Services', requestedBy: 'pradhyum', requester: 'pradhyum', requestedById: 'U2', status: 'Rejected', date: 'Oct 15, 2023', justification: 'Exceeds annual budget.' },
    { id: 'PROC-850', resourceType: 'Conference Tables', item: 'Conference Tables', quantity: 2, department: 'Facilities', requestedBy: 'prem kumar', requester: 'prem kumar', status: 'Fulfilled', date: 'Sep 10, 2023', justification: 'New building setup.' }
  ],
  notifications: [
    { id: 'N1', title: 'Welcome to ResourceX', description: 'Your account has been created.', time: '1 day ago', read: false, recipientRole: 'All' },
    { id: 'N2', title: 'Maintenance Alert', description: 'RES-5011 requires urgent repair.', time: '2 hours ago', read: false, recipientRole: 'Staff' },
    { id: 'N3', title: 'Procurement Approved', description: 'Microscope Sets Approved by Registrar.', time: '5 mins ago', read: false, recipientRole: 'Dept Head' }
  ],
  maintenanceHistory: [
    { code: 'RES-2233', type: 'Printer Color', allocatedTo: 'None', issue: 'Paper Jam', actionDate: 'Oct 16, 2023', status: 'Repaired', department: 'Administration' },
    { code: 'RES-1122', type: 'Tablet Pro', allocatedTo: 'Jane Smith', issue: 'Shattered Screen', actionDate: 'Oct 10, 2023', status: 'Scrap', department: 'Operations' },
    { code: 'RES-3311', type: 'Coffee Maker', allocatedTo: 'HQ Lounge', issue: 'Heating Element', actionDate: 'Oct 01, 2023', status: 'Repaired', department: 'Facilities' }
  ],
  returnHistory: [
    { code: 'RES-9988', type: 'Laptop - Old', returnedBy: 'Bob Builder', returnDate: 'Oct 20, 2023', processDate: 'Oct 21, 2023', condition: 'Bad', finalStatus: 'Scrapped', department: 'Operations' },
    { code: 'RES-7766', type: 'Office Desk', returnedBy: 'Alice Worker', returnDate: 'Oct 22, 2023', processDate: 'Oct 23, 2023', condition: 'Good', finalStatus: 'Available', department: 'HR Dept' },
    { code: 'RES-5544', type: 'Monitor Mount', returnedBy: 'pradhyum', returnDate: 'Oct 25, 2023', processDate: 'Oct 26, 2023', condition: 'Good', finalStatus: 'Available', department: 'IT Services' }
  ],
  permissionsMatrix: {
    'Request Resources': ['Requestor', 'System Admin'],
    'View Own Resources': ['Requestor', 'Dept Head', 'System Admin'],
    'Return Resources': ['Requestor', 'System Admin'],
    'Request Maintenance': ['Requestor', 'System Admin'],
    'Approve/Reject Requests': ['Dept Head', 'System Admin'],
    'View Department Resources': ['Dept Head', 'System Admin'],
    'Department Analytics': ['Dept Head', 'System Admin'],
    'Stock Monitoring': ['Dept Head', 'System Admin'],
    'Initiate Procurement': ['Dept Head', 'System Admin'],
    'Procurement Approval': ['Registrar', 'System Admin'],
    'System Analytics': ['Registrar', 'System Admin'],
    'Allocate Resources': ['Staff', 'System Admin'],
    'Manage Resources': ['Staff', 'System Admin'],
    'Add Resource Types': ['Staff', 'System Admin'],
    'Handle Maintenance': ['Staff', 'System Admin'],
    'Handle Returns': ['Staff', 'System Admin'],
    'Receive Procurement': ['Staff', 'System Admin'],
    'User Management': ['System Admin'],
    'Department Management': ['System Admin'],
    'Role Management': ['System Admin'],
    'System Settings': ['System Admin']
  },
  stockThresholds: [
    { id: 'TH-1', department: 'IT Services', resourceType: 'Laptop', thresholdLevel: 15 },
    { id: 'TH-2', department: 'IT Services', resourceType: 'Projector', thresholdLevel: 10 },
    { id: 'TH-3', department: 'IT Services', resourceType: 'Tablet', thresholdLevel: 8 },
    { id: 'TH-4', department: 'IT Services', resourceType: 'Monitor', thresholdLevel: 5 },
    { id: 'TH-5', department: 'IT Services', resourceType: 'Router', thresholdLevel: 10 },
    { id: 'TH-6', department: 'IT Services', resourceType: 'Printer', thresholdLevel: 6 },
    { id: 'TH-7', department: 'HR Dept', resourceType: 'Projector', thresholdLevel: 3 },
    { id: 'TH-8', department: 'HR Dept', resourceType: 'Electronics', thresholdLevel: 2 },
    { id: 'TH-9', department: 'Operations', resourceType: 'Electronics', thresholdLevel: 2 },
    { id: 'TH-10', department: 'Operations', resourceType: 'Accessories', thresholdLevel: 1 }
  ],
  resourceCatalog: [
    {
      department: 'IT Services',
      resourceTypes: [
        'Laptop',
        'Developer Laptops',
        'High-Cap Battery',
        'External Hard Drives',
        'Server Blades v2',
        'Server Blade',
        'Monitor',
        'Projector',
        'Tablet',
        'Router',
        'Cisco Routers',
        'Printer',
        'Accessories',
        'Hardware',
      ],
    },
    {
      department: 'HR Dept',
      resourceTypes: [
        'Laptop Bundles',
        'Standing Desks',
        'Office Desks',
        'Ergonomic Keyboards',
        'HR Software Licenses',
        'Projector',
        'Electronics',
        'Accessories',
      ],
    },
    {
      department: 'Operations',
      resourceTypes: [
        'Projector Screens',
        'Whiteboards',
        'Walkie Talkies',
        'Logistics Software',
        'Microscope Sets',
        'Electronics',
        'Accessories',
        'Furniture',
      ],
    },
    {
      department: 'Administration',
      resourceTypes: ['Printer', 'Electronics', 'Desk'],
    },
    {
      department: 'Facilities',
      resourceTypes: ['Conference Tables', 'Coffee Machine', 'Appliance', 'Furniture'],
    },
  ]
};
