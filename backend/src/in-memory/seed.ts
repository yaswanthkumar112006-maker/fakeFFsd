import { InMemoryStore } from './in-memory.store';

export async function seedDatabase(store: InMemoryStore) {
  // Simple check: if we already have users, assume it's seeded
  const users = store.findAll('users');
  if (users && users.length > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding mock database...');

  store.set('departments', [
    { department_id: 1, department_name: 'IT' },
    { department_id: 2, department_name: 'HR' },
    { department_id: 3, department_name: 'Finance' },
  ]);

  store.set('roles', [
    { role_id: 1, role_name: 'Admin' },
    { role_id: 2, role_name: 'Registrar' },
    { role_id: 3, role_name: 'Staff' },
    { role_id: 4, role_name: 'HOD' },
  ]);

  store.set('users', [
    { user_id: 1, name: 'Admin User', email: 'admin@resourcex.com', password: 'password', role_id: 1, department_id: null },
    { user_id: 2, name: 'IT Registrar', email: 'registrar@resourcex.com', password: 'password', role_id: 2, department_id: 1 },
    { user_id: 3, name: 'IT HOD', email: 'hod@resourcex.com', password: 'password', role_id: 4, department_id: 1 },
    { user_id: 4, name: 'Staff User', email: 'staff@resourcex.com', password: 'password', role_id: 3, department_id: 1 },
  ]);

  console.log('Mock database seeded.');
}
