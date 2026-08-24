const fs = require('fs');
let content = fs.readFileSync('src/data/seed.ts', 'utf-8');

// Insert organizations and queries
content = content.replace('export const seedState: AppState = {', 
`export const seedState: AppState = {
  organizations: [
    { id: 'ORG-001', name: 'Acme Corp', adminEmail: 'yashwath@resourcex.com', status: 'Active', assignedEmployeeId: 'EMP-001' }
  ],
  queries: [],`);

// Add new users
content = content.replace("  users: [\n", 
`  users: [
    { id: 'OWN-001', name: 'Platform Owner', email: 'owner@resourcex.com', password: 'password', role: 'Owner', status: 'Active', preferences: { notifications: true } },
    { id: 'EMP-001', name: 'Support Employee', email: 'employee@resourcex.com', password: 'password', role: 'Employee', status: 'Active', preferences: { notifications: true } },
`);

// Regex to add organizationId: 'ORG-001' to all objects in arrays.
// We'll replace `{ id: '` with `{ id: '... ', organizationId: 'ORG-001',`
content = content.replace(/{\s*id:\s*'([^']+)',/g, "{ id: '$1', organizationId: 'ORG-001',");
// for code: '...'
content = content.replace(/{\s*code:\s*'([^']+)',/g, "{ code: '$1', organizationId: 'ORG-001',");
// for department: '...' (in DepartmentResourceCatalogRecord)
// wait, the catalog only has department and resourceTypes.
// Let's manually replace the catalog entries:
content = content.replace(/{\s*department:\s*'([^']+)',\s*resourceTypes:/g, "{ organizationId: 'ORG-001', department: '$1', resourceTypes:");

fs.writeFileSync('src/data/seed.ts', content);
console.log('Transformed seed.ts');
