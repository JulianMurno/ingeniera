## Purpose

The development server must be accessible on the configured host and port so that both the API and the Next.js frontend can be reached from the same origin during local development.

## ADDED Requirements

### Requirement: Server binds to accessible host and port
The system SHALL start the Express/Next.js server and bind it to a host/port that is reachable from localhost for development.

#### Scenario: Dev server starts and listens
- **WHEN** running `npm run dev` (or `node src/server.js`)
- **THEN** the server listens on the configured `PORT` (default `3000`) and is accessible at `http://localhost:<PORT>`

#### Scenario: API and frontend served from same origin
- **WHEN** the server is running
- **THEN** `/health` and `/api/*` are handled by Express, and all other routes are handled by Next.js via the same process

### Requirement: Health endpoint remains accessible
The system SHALL continue to serve the health check endpoints so readiness can be verified.

#### Scenario: Health check
- **WHEN** a request is made to `GET /health` or `GET /api/v1/health`
- **THEN** the server responds with a health status
