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

## JWT Authentication

Every protected endpoint is authorized via a JWT token. Send a `POST` request to `/api/auth/login` to obtain a token, then set the standard Bearer header:

- `Authorization: Bearer <JWT-token>`

Test credentials for each role:

- **Requestor**: `ravi@resourcex.com` / `12345678` (ID: `U1`)
- **Dept Head**: `pradhyum@resourcex.com` / `12345678` (ID: `U2`)
- **Registrar**: `harsha@resourcex.com` / `12345678` (ID: `U3`)
- **Staff**: `prem@resourcex.com` / `12345678` (ID: `U4`)
- **System Admin**: `yashwath@resourcex.com` / `12345678` (ID: `U5`)

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
