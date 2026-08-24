const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/maintenance/maintenance.service.ts',
  'src/procurements/procurements.service.ts',
  'src/requests/requests.service.ts',
  'src/resources/resources.service.ts',
  'src/returns/returns.service.ts'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // We need to find object literal creations matching the target types and inject organizationId.
  // We can do this reliably by looking for common ID generation patterns or specific property assignments in create() functions.
  
  // 1. Maintenance
  if (file.includes('maintenance')) {
    content = content.replace(/actionDate: new Date\(\)\.toDateString\(\),/g, "actionDate: new Date().toDateString(),\n      organizationId: context.organizationId || 'ORG-001',");
  }
  
  // 2. Procurements
  if (file.includes('procurements')) {
    // In create
    content = content.replace(/status: 'Pending Approval',/g, "status: 'Pending Approval',\n      organizationId: context.organizationId || 'ORG-001',");
    // In fulfill (creating new resource)
    content = content.replace(/status: 'Available',/g, "status: 'Available',\n        organizationId: context.organizationId || 'ORG-001',");
  }
  
  // 3. Requests
  if (file.includes('requests')) {
    content = content.replace(/date: new Date\(\)\.toDateString\(\),/g, "date: new Date().toDateString(),\n      organizationId: context.organizationId || 'ORG-001',");
  }
  
  // 4. Resources
  if (file.includes('resources')) {
    content = content.replace(/date: new Date\(\)\.toDateString\(\),/g, "date: new Date().toDateString(),\n      organizationId: context.organizationId || 'ORG-001',");
  }
  
  // 5. Returns
  if (file.includes('returns')) {
    content = content.replace(/processDate: new Date\(\)\.toDateString\(\),/g, "processDate: new Date().toDateString(),\n      organizationId: context.organizationId || 'ORG-001',");
  }

  fs.writeFileSync(filePath, content);
});

console.log('Fixed TS errors by injecting organizationId.');
