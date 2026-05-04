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

## Header-based RBAC

Use these headers in Swagger UI when testing APIs:

- `x-user-role`
  - `Requestor`
  - `Dept Head`
  - `Registrar`
  - `Staff`
  - `System Admin`
- `x-user-id`
  - Example: `U1`, `U2`, `U4`

The backend uses these headers to enforce role and department scope.
