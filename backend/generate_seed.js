const fs = require('fs');

const subscriptionPlans = [
  { id: 'PLAN-001', name: 'Starter', maxUsers: 50, pricePerYear: 999, features: ['Core Requests', 'Basic Support'] },
  { id: 'PLAN-002', name: 'Professional', maxUsers: 200, pricePerYear: 2999, features: ['Advanced Analytics', 'Priority Support'] },
  { id: 'PLAN-003', name: 'Enterprise', maxUsers: 1000, pricePerYear: 9999, features: ['Unlimited Workflows', 'Dedicated Employee'] }
];

const organizations = [];
const employees = [];

// Create 5 employees
for (let i = 1; i <= 5; i++) {
  employees.push({
    id: `EMP-00${i}`,
    organizationId: `PLATFORM`,
    name: `Support Employee ${i}`,
    email: `employee${i}@resourcex.com`,
    password: 'password',
    role: 'Employee',
    status: 'Active',
    preferences: { notifications: true }
  });
}

// Create 10 organizations
for (let i = 1; i <= 10; i++) {
  const empIndex = (i - 1) % 5;
  const planIndex = i % 3;
  organizations.push({
    id: `ORG-00${i}`,
    name: `Enterprise Client ${i}`,
    adminEmail: `admin@client${i}.com`,
    status: 'Active',
    assignedEmployeeId: employees[empIndex].id,
    subscriptionPlanId: subscriptionPlans[planIndex].id,
    subscriptionExpiryDate: '2027-12-31'
  });
}

// Ensure the first organization matches the original users we had for testing
organizations[0].name = 'Acme Corp';
organizations[0].adminEmail = 'yashwath@resourcex.com';

const owner = {
  id: 'OWN-001',
  organizationId: 'PLATFORM',
  name: 'Platform Owner',
  email: 'owner@resourcex.com',
  password: 'password',
  role: 'Owner',
  status: 'Active',
  preferences: { notifications: true }
};

let seedContent = fs.readFileSync('src/data/seed.ts', 'utf-8');

// We need to inject subscriptionPlans, organizations, queries into seedState
// We will replace the entire organizations, queries, users arrays.

// To avoid complex regex for large arrays, we will extract the original users, departments, etc. (excluding our old EMP and OWN)
// Let's just do simple replacements.

// Replace subscriptionPlans
let newSeed = seedContent.replace(
  /export const seedState: AppState = {/,
  `export const seedState: AppState = {\n  subscriptionPlans: ${JSON.stringify(subscriptionPlans, null, 4)},`
);

// Replace organizations
newSeed = newSeed.replace(
  /organizations: \[[\s\S]*?\],/,
  `organizations: ${JSON.stringify(organizations, null, 4)},`
);

// We need to replace the users array to include our 5 employees and 1 owner.
// Let's just find the users array and replace it.
const usersMatch = newSeed.match(/users: \[\s*([\s\S]*?)\s*\],\s*departments/);
if (usersMatch) {
  let existingUsers = usersMatch[1];
  // Remove any old OWN-001 or EMP-001
  existingUsers = existingUsers.split('\n').filter(line => !line.includes('OWN-00') && !line.includes('EMP-00')).join('\n');
  
  const newUsersArr = [owner, ...employees].map(u => JSON.stringify(u)).join(',\n    ') + ',\n' + existingUsers;
  newSeed = newSeed.replace(usersMatch[0], `users: [\n    ${newUsersArr}\n  ],\n  departments`);
}

fs.writeFileSync('src/data/seed.ts', newSeed);
console.log('Seed updated with 10 orgs, 5 employees, 3 subscription plans.');

