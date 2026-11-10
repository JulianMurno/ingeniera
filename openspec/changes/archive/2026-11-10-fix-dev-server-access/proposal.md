## Why

When running `npm run dev` (`node --watch src/server.js`), the server starts but in some environments it is not accessible from the frontend or external clients due to how the Express/Next.js single-origin setup binds/listens. The user reports they cannot open the frontend nor the backend of what runs in the terminal.

## What Changes

- Investigate and fix the server binding/host configuration so the app is accessible on localhost from both the API and the Next.js frontend.
- Ensure the health/API endpoints remain reachable and the UI is correctly proxied/served by the same process on the configured port.
- Make the dev server more robust to environment differences (e.g., ensure `PORT` is respected and the server binds to the expected interface).

## Capabilities

### New Capabilities
- `dev-server-access`: Ensure the development server is accessible on the configured host/port (API and frontend) from the same origin.

### Modified Capabilities
- None

## Impact

- Affected code: `src/server.js` (and possibly `src/app.js` if needed)
- Affected scripts: `package.json` dev script
- Dependencies/systems: Node.js/Express/Next.js runtime configuration
