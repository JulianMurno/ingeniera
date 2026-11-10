## Context

See proposal.md for motivation. The app uses a single-origin setup where Express serves API/health and also hands non-API routes to Next.js (`src/app.js`, `src/server.js`). The user reports they cannot open the frontend nor the backend when running `npm run dev`.

## Goals / Non-Goals

**Goals:**
- Make the dev server accessible from `http://localhost:<PORT>` (default 3000) for both API and frontend.
- Ensure proper binding/host configuration and that the server starts correctly in dev mode.
- Keep existing behavior for production/start intact where reasonable.

**Non-Goals:**
- Changing deployment strategy beyond fixing dev access.
- Major refactoring of the single-origin architecture.

## Decisions

- **Ensure explicit binding**: Use `app.listen(PORT, () => {...})` with default port and consider binding to `0.0.0.0` or just relying on default; also ensure `HOST` can be configured via env if needed.
- **Verify Next.js dev setup**: `nextApp.prepare()` in dev must succeed; the UI handler must be passed correctly.
- **Graceful diagnostics**: Log the URLs clearly on startup (already present) and ensure no early errors prevent binding.

## Risks / Trade-offs

- [Risk] Binding to `0.0.0.0` may expose on all interfaces in some environments → Mitigation: default to localhost/normal behavior; allow env override.
- [Risk] Next.js prepare could fail silently → Mitigation: add better error logging.
