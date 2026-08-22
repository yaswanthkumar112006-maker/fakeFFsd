import http from 'http';

const BASE_URL = 'http://localhost:3000';

interface RequestOptions {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
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
  console.log('=== STARTING API VERIFICATION TESTS ===\n');

  const testCases = [
    {
      name: '1. Users - Get all (Admin)',
      method: 'GET',
      path: '/api/users',
      headers: { 'x-user-role': 'System Admin', 'x-user-id': 'U-005' },
    },
    {
      name: '2. Profile - Get Profile (Requestor U-001)',
      method: 'GET',
      path: '/api/profile/me',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: '3. Departments - Get all',
      method: 'GET',
      path: '/api/departments',
      headers: { 'x-user-role': 'System Admin' },
    },
    {
      name: '4. Resources - Catalog (Dept Head)',
      method: 'GET',
      path: '/api/resources/catalog?department=IT Services',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: '5. Resources - Availability',
      method: 'GET',
      path: '/api/resources/availability?department=IT Services&type=Laptop',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: '6. Resources - Get all (Requestor U-001)',
      method: 'GET',
      path: '/api/resources',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: '7. Procurements - Get all (Registrar)',
      method: 'GET',
      path: '/api/procurements',
      headers: { 'x-user-role': 'Registrar', 'x-user-id': 'U-003' },
    },
    {
      name: '8. Requests - Get all (Dept Head)',
      method: 'GET',
      path: '/api/requests',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: '9. Returns - Get return history (Admin)',
      method: 'GET',
      path: '/api/returns/history',
      headers: { 'x-user-role': 'System Admin' },
    },
    {
      name: '10. Notifications - Get all (Requestor U-001)',
      method: 'GET',
      path: '/api/notifications',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: '11. Maintenance - Get history (Admin)',
      method: 'GET',
      path: '/api/maintenance/history',
      headers: { 'x-user-role': 'System Admin' },
    },
    {
      name: '12. Analytics - Requestor Summary',
      method: 'GET',
      path: '/api/analytics/requestor-summary',
      headers: { 'x-user-role': 'Requestor', 'x-user-id': 'U-001' },
    },
    {
      name: '13. Analytics - Department Summary',
      method: 'GET',
      path: '/api/analytics/department-summary',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
    {
      name: '14. Analytics - Registrar Summary',
      method: 'GET',
      path: '/api/analytics/registrar-summary',
      headers: { 'x-user-role': 'Registrar', 'x-user-id': 'U-003' },
    },
    {
      name: '15. Analytics - Stock Thresholds',
      method: 'GET',
      path: '/api/analytics/stock',
      headers: { 'x-user-role': 'Dept Head', 'x-user-id': 'U-002' },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const res = await makeRequest(tc);
      const isSuccess = res.status >= 200 && res.status < 300;
      if (isSuccess) {
        console.log(`[PASS] ${tc.name} - Status: ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${tc.name} - Status: ${res.status}`);
        console.error('Response:', res.body);
        failed++;
      }
    } catch (e: any) {
      console.error(`[ERROR] ${tc.name} - Request failed:`, e.message);
      failed++;
    }
  }

  console.log('\n=== API VERIFICATION SUMMARY ===');
  console.log(`Passed: ${passed} / ${testCases.length}`);
  console.log(`Failed: ${failed} / ${testCases.length}`);
}

runTests();
