## 1. Investigate server binding and startup

- [x] 1.1 Inspect `src/server.js` and `src/app.js` for host/port binding and verify current behavior matches the single-origin setup (Confirm app listens on configured PORT and passes Next.js handler correctly)
- [x] 1.2 Reproduce the issue locally by starting `npm run dev` and check if it binds to localhost and is reachable (Verify server starts without errors and logs URLs)

## 2. Fix server access configuration

- [x] 2.1 Ensure `app.listen` binds to the expected interface (consider allowing `HOST` env var or explicit binding; default to 0.0.0.0). Update `src/server.js`. (Verify server accepts connections on the configured PORT)
- [x] 2.2 Add/improve startup logging or error handling if necessary (e.g., catch Next.js prepare errors). Update code as needed. (Verify clearer errors are logged on failure)

## 3. Verify

- [x] 3.1 Test `GET /health` and a non-API route via browser/curl against `http://localhost:<PORT>`. (Verify both API and frontend respond)
- [x] 3.2 Run tests if relevant (`npm test`) and ensure nothing is broken. (Verify tests pass or no regressions)
