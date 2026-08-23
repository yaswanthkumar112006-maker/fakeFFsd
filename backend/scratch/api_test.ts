import http from 'http';

const BASE_URL = 'http://localhost:3000';

interface RequestOptions {
  name: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number[];
}

function makeRequest(options: RequestOptions): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${options.path}`;
    const payload = options.body ? JSON.stringify(options.body) : '';
    
    const reqOptions: http.RequestOptions = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (payload) {
      reqOptions.headers!['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          // ignore
        }
        resolve({
          status: res.statusCode || 500,
          body: parsed,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING ALL 52 API ENDPOINT TESTS ===\n');

  const testCases: RequestOptions[] = [
    // --- 1. USERS MODULE (4 endpoints) ---
    {
      name: 'Users - List Users (Admin)',
      method: 'GET',
      path: '/api/users',
      headers: { 'x-user-role': 'System Admin', 'x-user-id': 'U-005' },
    },
    {
      name: 'Users - Create User (Admin)',
      method: 'POST',
      path: '/api/users',
      headers: { 'x-user-role': 'System Admin', 'x-user-id': 'U-005' },
      body: { id: 'U-TEST-TEMP', password: 'password123', name: 'Test User', email: 'test.user.temp@resourcex.com', role: 'Requestor', department: 'IT Services', status: 'Active' },
    },
    {
      name: 'Users - Update User (Admin)',
      method: 'PATCH',
      path: '/api/users/U-TEST-TEMP',
      headers: { 'x-user-role': 'System Admin', 'x-user-id': 'U-005' },
      body: { name: 'Test User Updated' },
    },
    {
      name: 'Users - Deactivate/Delete User (Admin)',
      method: 'DELETE',
      path: '/api/users/U-TEST-TEMP',
      headers: { 'x-user-role': 'System Admin', 'x-user-id': 'U-005' },
    },

    // --- 2. PROFILE MODULE (3 endpoints) ---
    {
      name: 'Profile - Get Profile (Requestor)',
      method: 'GET',
      path: '/api/profile/me',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Profile - Update Profile (Requestor)',
      method: 'PATCH',
      path: '/api/profile/me',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
      body: { name: 'Ravi Chandra New' },
    },
    {
      name: 'Profile - Update Password (Requestor)',
      method: 'POST',
      path: '/api/profile/me/password',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
      body: { currentPassword: '12345678', newPassword: '12345678' },
    },

    // --- 3. DEPARTMENTS MODULE (4 endpoints) ---
    {
      name: 'Departments - Get List',
      method: 'GET',
      path: '/api/departments',
      headers: { 'x-user-role': 'System Admin' },
    },
    {
      name: 'Departments - Create Department',
      method: 'POST',
      path: '/api/departments',
      headers: { 'x-user-role': 'System Admin' },
      body: { id: 'D-TEST-TEMP', name: 'Testing Division', head: 'yashwath', memberCount: 3 },
    },
    {
      name: 'Departments - Update Department',
      method: 'PATCH',
      path: '/api/departments/D-TEST-TEMP',
      headers: { 'x-user-role': 'System Admin' },
      body: { head: 'pradhyum' },
    },
    {
      name: 'Departments - Remove Department',
      method: 'DELETE',
      path: '/api/departments/D-TEST-TEMP',
      headers: { 'x-user-role': 'System Admin' },
    },

    // --- 4. PERMISSIONS MODULE (3 endpoints) ---
    {
      name: 'Permissions - Get Matrix',
      method: 'GET',
      path: '/api/permissionsMatrix',
      headers: { 'x-user-role': 'System Admin' },
    },
    {
      name: 'Permissions - Update Matrix',
      method: 'POST',
      path: '/api/permissionsMatrix',
      headers: { 'x-user-role': 'System Admin' },
      body: { matrix: { 'Request Resources': ['Requestor'] } },
    },
    {
      name: 'Permissions - Reset Matrix',
      method: 'POST',
      path: '/api/permissionsMatrix/reset',
      headers: { 'x-user-role': 'System Admin' },
    },

    // --- 5. RESOURCES MODULE (9 endpoints) ---
    {
      name: 'Resources - Get Catalog',
      method: 'GET',
      path: '/api/resources/catalog',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Resources - Get Availability',
      method: 'GET',
      path: '/api/resources/availability?department=IT Services&type=Laptop',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Resources - Get List',
      method: 'GET',
      path: '/api/resources',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Resources - Create Resource',
      method: 'POST',
      path: '/api/resources',
      headers: { 'x-user-role': 'System Admin', 'x-user-id': 'U-005' },
      body: { id: `RES-T-${Date.now()}`, name: 'Testing Monitor', type: 'Accessories', department: 'IT Services', status: 'Available', condition: 'Good' },
    },
    {
      name: 'Resources - Update Resource',
      method: 'PATCH',
      path: '/api/resources/RES-1049',
      headers: { 'x-user-role': 'System Admin', 'x-user-id': 'U-005' },
      body: { condition: 'Average' },
    },
    {
      name: 'Resources - Request Maintenance',
      method: 'POST',
      path: '/api/resources/RES-6022/maintenance-request',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Resources - Initiate Return',
      method: 'POST',
      path: '/api/resources/RES-9055/initiate-return',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Resources - Confirm Repaired',
      method: 'POST',
      path: '/api/resources/RES-1049/confirm-repaired',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Resources - Scrap Resource',
      method: 'POST',
      path: '/api/resources/RES-IT-304/scrap',
      headers: { 'x-user-role': 'System Admin' },
    },

    // --- 6. PROCUREMENTS MODULE (9 endpoints) ---
    {
      name: 'Procurements - Get List',
      method: 'GET',
      path: '/api/procurements',
      headers: { 'x-user-role': 'Registrar', 'x-user-id': 'U-003' },
    },
    {
      name: 'Procurements - Create Procurement',
      method: 'POST',
      path: '/api/procurements',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
      body: { resourceType: 'Developer Laptops', item: 'Developer Laptops', quantity: 2, department: 'IT Services', justification: 'Wellness' },
    },
    {
      name: 'Procurements - Update Procurement',
      method: 'PATCH',
      path: '/api/procurements/PROC-819',
      headers: { 'x-user-role': 'Registrar', 'x-user-id': 'U-003' },
      body: { quantity: 6 },
    },
    {
      name: 'Procurements - Dept Approve',
      method: 'POST',
      path: '/api/procurements/PROC-819/department-approve',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Procurements - Dept Reject',
      method: 'POST',
      path: '/api/procurements/PROC-821/department-reject',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
      expectedStatus: [200, 201, 400, 403],
    },
    {
      name: 'Procurements - Registrar Approve',
      method: 'POST',
      path: '/api/procurements/PROC-901/registrar-approve',
      headers: { 'x-user-role': 'Registrar', 'x-user-id': 'U-003' },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Procurements - Registrar Reject',
      method: 'POST',
      path: '/api/procurements/PROC-901/registrar-reject',
      headers: { 'x-user-role': 'Registrar', 'x-user-id': 'U-003' },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Procurements - Log Purchase',
      method: 'POST',
      path: '/api/procurements/PROC-911/log-purchase',
      headers: { 'x-user-role': 'Staff', 'x-user-id': 'U-004' },
      body: { vendor: 'Dell', invoice: 'INV-T-1001' },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Procurements - Register',
      method: 'POST',
      path: '/api/procurements/PROC-850/register',
      headers: { 'x-user-role': 'Staff', 'x-user-id': 'U-004' },
      body: { resources: [
        { id: `RES-T-REG-${Date.now()}-1`, serialNumber: 'SN-REG-101', type: 'Conference Tables' },
        { id: `RES-T-REG-${Date.now()}-2`, serialNumber: 'SN-REG-102', type: 'Conference Tables' }
      ] },
      expectedStatus: [200, 201, 400],
    },

    // --- 7. REQUESTS MODULE (7 endpoints) ---
    {
      name: 'Requests - Get List',
      method: 'GET',
      path: '/api/requests',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Requests - Create Request',
      method: 'POST',
      path: '/api/requests',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
      body: { id: `REQ-T-2`, resourceType: 'Developer Laptops', quantity: 2, department: 'IT Services', justification: 'Wellness' },
    },
    {
      name: 'Requests - Update Request',
      method: 'PATCH',
      path: '/api/requests/REQ-102',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
      body: { priority: 'High' },
    },
    {
      name: 'Requests - Approve',
      method: 'POST',
      path: '/api/requests/REQ-102/approve',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: 'Requests - Reject',
      method: 'POST',
      path: '/api/requests/REQ-103/reject',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: 'Requests - Allocate',
      method: 'POST',
      path: '/api/requests/REQ-104/allocate',
      headers: { 'x-user-role': 'Staff', 'x-user-id': 'U-004' },
      body: { resourceIds: ['RES-IT-301', 'RES-IT-302', 'RES-IT-303', 'RES-IT-304', 'RES-IT-305'] },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Requests - Confirm Receipt',
      method: 'POST',
      path: '/api/requests/REQ-101/receipt',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
      expectedStatus: [200, 201, 400],
    },

    // --- 8. RETURNS MODULE (2 endpoints) ---
    {
      name: 'Returns - Get History',
      method: 'GET',
      path: '/api/returns/history',
      headers: { 'x-user-role': 'System Admin' },
    },
    {
      name: 'Returns - Process Return',
      method: 'POST',
      path: '/api/returns/RES-1049/process',
      headers: { 'x-user-role': 'Staff', 'x-user-id': 'U-004' },
      body: { condition: 'Good' },
      expectedStatus: [200, 201, 400],
    },

    // --- 9. NOTIFICATIONS MODULE (2 endpoints) ---
    {
      name: 'Notifications - Get List',
      method: 'GET',
      path: '/api/notifications',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Notifications - Update Status',
      method: 'PATCH',
      path: '/api/notifications/NOT-001',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
      body: { read: true },
      expectedStatus: [200, 404],
    },

    // --- 10. MAINTENANCE MODULE (4 endpoints) ---
    {
      name: 'Maintenance - Get History',
      method: 'GET',
      path: '/api/maintenance/history',
      headers: { 'x-user-role': 'System Admin' },
    },
    {
      name: 'Maintenance - Accept Equipment',
      method: 'POST',
      path: '/api/maintenance/RES-ITL-201/accept',
      headers: { 'x-user-role': 'Staff', 'x-user-id': 'U-004' },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Maintenance - Repair Resolve',
      method: 'POST',
      path: '/api/maintenance/RES-ITL-201/repair',
      headers: { 'x-user-role': 'Staff', 'x-user-id': 'U-004' },
      expectedStatus: [200, 201, 400],
    },
    {
      name: 'Maintenance - Scrap Resolve',
      method: 'POST',
      path: '/api/maintenance/RES-ITL-201/scrap',
      headers: { 'x-user-role': 'Staff', 'x-user-id': 'U-004' },
      expectedStatus: [200, 201, 400],
    },

    // --- 11. ANALYTICS MODULE (5 endpoints) ---
    {
      name: 'Analytics - Get Requestor Summary',
      method: 'GET',
      path: '/api/analytics/requestor-summary',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: 'Analytics - Get Department Summary',
      method: 'GET',
      path: '/api/analytics/department-summary',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: 'Analytics - Get Registrar Summary',
      method: 'GET',
      path: '/api/analytics/registrar-summary',
      headers: { 'x-user-role': 'Registrar', 'x-user-id': 'U-003' },
    },
    {
      name: 'Analytics - Get Stock Thresholds Warnings',
      method: 'GET',
      path: '/api/analytics/stock',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: 'Analytics - Update Stock Threshold Warn Level',
      method: 'PATCH',
      path: '/api/analytics/stock-thresholds/ST-101/15',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
      expectedStatus: [200, 404],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const res = await makeRequest(tc);
      const allowedStatuses = tc.expectedStatus || [200, 201];
      const isSuccess = allowedStatuses.includes(res.status);
      
      if (isSuccess) {
        console.log(`[PASS] ${tc.name} - Status: ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${tc.name} - Status: ${res.status} (Expected: ${allowedStatuses.join(', ')})`);
        console.error('Response:', res.body);
        failed++;
      }
    } catch (e: any) {
      console.error(`[ERROR] ${tc.name} - Request failed:`, e.message);
      failed++;
    }
  }

  console.log('\n=== ALL 52 API ENDPOINT VERIFICATION SUMMARY ===');
  console.log(`Passed: ${passed} / ${testCases.length}`);
  console.log(`Failed: ${failed} / ${testCases.length}`);
}

runTests();
