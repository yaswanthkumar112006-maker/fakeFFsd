import http from 'http';
import * as fs from 'fs';
import * as path from 'path';

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

async function runMiddlewareTests() {
  console.log('=== STARTING SCOPED MIDDLEWARE VERIFICATION TESTS (SUPPORT, COMMUNICATONS, USERS) ===\n');

  // 1. Get Authentication Tokens
  console.log('[LOG] Fetching authentication tokens...');
  
  const adminLogin = await makeRequest({
    name: 'Admin Login',
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'yashwath@resourcex.com', password: '12345678' }
  });
  const adminToken = adminLogin.body.access_token;

  const employeeLogin = await makeRequest({
    name: 'Employee Login',
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'employee1@resourcex.com', password: 'password' }
  });
  const employeeToken = employeeLogin.body.access_token;

  if (!adminToken || !employeeToken) {
    console.error('[ERROR] Authentication tokens could not be retrieved. Ensure server is running.');
    process.exit(1);
  }
  console.log('[PASS] Tokens retrieved successfully.\n');

  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };
  const employeeHeaders = { 'Authorization': `Bearer ${employeeToken}` };

  let passed = 0;
  let failed = 0;

  // ==========================================
  // --- 1. SUPPORT MODULE TESTS ---
  // ==========================================
  
  // Create Valid Ticket
  try {
    const res = await makeRequest({
      name: 'Create Valid Support Ticket',
      method: 'POST',
      path: '/api/support',
      headers: adminHeaders,
      body: { title: 'Printer Offline', description: 'Office printer on floor 2 is showing offline status.' }
    });
    if (res.status === 201) {
      console.log('[PASS] Support - Create Valid Ticket: Status 201');
      passed++;
    } else {
      console.error('[FAIL] Support - Create Valid Ticket:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Create Ticket failed:', e.message);
    failed++;
  }

  // Create Invalid Ticket (Validation Intercept)
  try {
    const res = await makeRequest({
      name: 'Create Invalid Support Ticket (Missing Title)',
      method: 'POST',
      path: '/api/support',
      headers: adminHeaders,
      body: { description: 'Missing title' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Title is required')) {
      console.log('[PASS] Support - Validation Middleware correctly blocked empty title: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Support - Validation Middleware did not block empty title correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Ticket validation failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 2. ANNOUNCEMENTS MODULE TESTS ---
  // ==========================================
  
  // Create Valid Announcement
  let announcementId = '';
  try {
    const res = await makeRequest({
      name: 'Create Valid Announcement',
      method: 'POST',
      path: '/api/announcements',
      headers: employeeHeaders,
      body: { title: 'Holiday Notice', message: 'The office will be closed on Friday.', type: 'General', targetOrgId: 'ALL' }
    });
    if (res.status === 201) {
      announcementId = res.body.id;
      console.log('[PASS] Announcements - Create Valid Announcement: Status 201');
      passed++;
    } else {
      console.error('[FAIL] Announcements - Create Valid Announcement:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Create Announcement failed:', e.message);
    failed++;
  }

  // Create Announcement with Invalid Type
  try {
    const res = await makeRequest({
      name: 'Create Announcement with Invalid Type',
      method: 'POST',
      path: '/api/announcements',
      headers: employeeHeaders,
      body: { title: 'System Downtime', message: 'Downtime scheduled.', type: 'Subscription', targetOrgId: 'ALL' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Invalid announcement type')) {
      console.log('[PASS] Announcements - Validation Middleware correctly blocked invalid type: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Announcements - Validation Middleware did not block invalid type correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Invalid Announcement Type test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 3. USERS MODULE TESTS (New) ---
  // ==========================================
  
  // Create Invalid User (Validation Intercept - password too short)
  try {
    const res = await makeRequest({
      name: 'Create User with Short Password',
      method: 'POST',
      path: '/api/users',
      headers: adminHeaders,
      body: { id: 'U-SHORT-PASS', name: 'Short pass test', email: 'test@resourcex.com', password: '123', role: 'Requestor' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Password must be')) {
      console.log('[PASS] Users - Validation Middleware correctly blocked short password: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Users - Validation Middleware did not block short password correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Users validation test failed:', e.message);
    failed++;
  }

  // Create User with Invalid Email
  try {
    const res = await makeRequest({
      name: 'Create User with Invalid Email',
      method: 'POST',
      path: '/api/users',
      headers: adminHeaders,
      body: { id: 'U-BAD-EMAIL', name: 'Bad email test', email: 'bademail.com', password: 'validpassword123', role: 'Requestor' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('valid email address is required')) {
      console.log('[PASS] Users - Validation Middleware correctly blocked invalid email: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Users - Validation Middleware did not block invalid email correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Users email validation test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 4. PROFILE MODULE TESTS (New) ---
  // ==========================================
  
  // Profile Update - Invalid Email
  try {
    const res = await makeRequest({
      name: 'Update Profile with Invalid Email',
      method: 'PATCH',
      path: '/api/profile/me',
      headers: employeeHeaders,
      body: { email: 'invalid-email-address' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('valid email address is required')) {
      console.log('[PASS] Profile - Validation Middleware correctly blocked invalid email: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Profile - Validation Middleware did not block invalid email correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Profile email validation test failed:', e.message);
    failed++;
  }

  // Profile Password Update - Short New Password
  try {
    const res = await makeRequest({
      name: 'Update Profile Password with Short Password',
      method: 'POST',
      path: '/api/profile/me/password',
      headers: employeeHeaders,
      body: { currentPassword: 'password', newPassword: '123' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('New password must be')) {
      console.log('[PASS] Profile - Validation Middleware correctly blocked short new password: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Profile - Validation Middleware did not block short new password correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Profile password validation test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 5. RATE LIMITER VERIFICATION ---
  // ==========================================
  console.log('[LOG] Testing Users Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedUsers = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Test Request ${i}`,
        method: 'GET',
        path: '/api/users',
        headers: adminHeaders
      });
      if (res.status === 429) {
        rateLimitedUsers = true;
        break;
      }
    }
    if (rateLimitedUsers) {
      console.log('[PASS] Users - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Users - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Users Rate Limiter test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Profile Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedProfile = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Test Request ${i}`,
        method: 'GET',
        path: '/api/profile/me',
        headers: employeeHeaders
      });
      if (res.status === 429) {
        rateLimitedProfile = true;
        break;
      }
    }
    if (rateLimitedProfile) {
      console.log('[PASS] Profile - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Profile - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Profile Rate Limiter test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 6. LOG FILE CREATION AND ERROR TRIGGERS ---
  // ==========================================
  console.log('[LOG] Triggering errors to verify module-scoped exception filters...');
  try {
    // Trigger Support error (resolve non-existent ticket)
    await makeRequest({
      name: 'Trigger Support Exception',
      method: 'PATCH',
      path: '/api/support/TKT-INVALID/resolve',
      headers: employeeHeaders,
      body: { reply: 'Testing error logger' }
    });
    // Trigger Announcements error (reply to non-existent announcement)
    await makeRequest({
      name: 'Trigger Announcements Exception',
      method: 'PATCH',
      path: '/api/announcements/ANN-INVALID/reply',
      headers: adminHeaders,
      body: { reply: 'Testing error logger' }
    });
    // Trigger Users error (update non-existent user)
    await makeRequest({
      name: 'Trigger Users Exception',
      method: 'PATCH',
      path: '/api/users/U-INVALID',
      headers: adminHeaders,
      body: { name: 'New Name' }
    });
    // Trigger Profile error (password update with missing fields)
    await makeRequest({
      name: 'Trigger Profile Exception',
      method: 'POST',
      path: '/api/profile/me/password',
      headers: employeeHeaders,
      body: { currentPassword: '' }
    });
  } catch (e) {
    // ignore
  }

  // Wait a small moment for file writes to finish
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('[LOG] Verifying module-scoped log files in logs/ directory...');
  const logsDir = path.join(process.cwd(), 'logs');
  const filesToCheck = [
    'support-access.log',
    'support-error.log',
    'communications-access.log',
    'communications-error.log',
    'users-access.log',
    'users-error.log',
    'profile-access.log',
    'profile-error.log'
  ];

  let logsPassed = true;
  for (const file of filesToCheck) {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        console.log(`[PASS] Log File - logs/${file} exists and contains data (${stats.size} bytes).`);
      } else {
        console.warn(`[WARN] Log File - logs/${file} exists but is empty.`);
      }
    } else {
      console.error(`[FAIL] Log File - logs/${file} does not exist.`);
      logsPassed = false;
    }
  }
  if (logsPassed) {
    passed++;
  } else {
    failed++;
  }

  console.log('\n=== MIDDLEWARE VERIFICATION SUMMARY ===');
  console.log(`Passed: ${passed} / 11`);
  console.log(`Failed: ${failed} / 11`);

  if (failed === 0) {
    console.log('\n[SUCCESS] Profile and all other module middlewares are correctly modularized and functional!');
  } else {
    console.error('\n[FAILURE] Some middleware tests failed. Check log outputs above.');
    process.exit(1);
  }
}

runMiddlewareTests().catch((e) => {
  console.error('[FATAL ERROR] Test suite aborted:', e);
  process.exit(1);
});
