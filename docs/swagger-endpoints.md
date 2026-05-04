# API Documentation Summary

The complete machine-readable OpenAPI export is available in:

- [swagger.json](/Users/premsahith/Desktop/ffsd/raviffsd/docs/swagger.json)

The live interactive Swagger UI is available when the server is running:

- `http://localhost:3000/api/docs`

## Documented API Groups

- `users`
  - User management and admin user updates
- `departments`
  - Department configuration and CRUD
- `permissionsMatrix`
  - Role-permission matrix fetch, update, and reset
- `requests`
  - Resource request creation, approval, allocation, and receipt
- `resources`
  - Inventory listing, update, maintenance request, return initiation, and scrap
- `procurements`
  - Procurement request lifecycle from creation to registration
- `maintenance`
  - Maintenance queue actions and history
- `returns`
  - Return processing and history
- `notifications`
  - Notification listing and read-state updates
- `analytics`
  - Actor dashboards and stock threshold summaries
- `profile`
  - Current actor profile and password update

## Header Requirements

Every protected endpoint is documented with:

- `x-user-role`
- `x-user-id`

Example values for presentation:

- `x-user-role: Requestor`
- `x-user-role: Dept Head`
- `x-user-role: Registrar`
- `x-user-role: Staff`
- `x-user-role: System Admin`
- `x-user-id: U1`

## Response Modeling

Swagger now includes explicit DTO response schemas for:

- Users
- Departments
- Requests
- Resources
- Procurements
- Notifications
- Maintenance history
- Return history
- Stock rows
- Requestor summary
- Department summary
- Registrar summary
- Success responses
- Error responses
