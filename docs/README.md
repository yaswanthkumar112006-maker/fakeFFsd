# Swagger Documentation

This folder contains the exported OpenAPI documentation for the NestJS backend.

## Files

- `swagger.json`
  - Generated OpenAPI document used for presentation, import into Swagger Editor, or sharing with evaluators.

## Live Swagger UI

Run the project from the repository root:

```bash
npm start
```

Then open:

- `http://localhost:3000/api/docs`

If port `3000` is already in use:

```bash
PORT=3001 npm start
```

Then open:

- `http://localhost:3001/api/docs`

## Regenerating the exported docs

From the repository root:

```bash
npm run swagger:generate
```

That updates:

- `docs/swagger.json`

## JWT Authentication

Use the standard authorization header in your client or Swagger UI when testing APIs:

- **Header**: `Authorization: Bearer <JWT-token>`

To get a token, send a `POST` request to `/api/auth/login` with user credentials.

### Roles and Users for Testing

The system has mock data with the following test credentials:

- **Requestor**: `ravi@resourcex.com` / `12345678` (ID: `U1`)
- **Dept Head**: `pradhyum@resourcex.com` / `12345678` (ID: `U2`)
- **Registrar**: `harsha@resourcex.com` / `12345678` (ID: `U3`)
- **Staff**: `prem@resourcex.com` / `12345678` (ID: `U4`)
- **System Admin**: `yashwath@resourcex.com` / `12345678` (ID: `U5`)
