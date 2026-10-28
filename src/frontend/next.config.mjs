import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Express serves both the API and this UI on the same origin, so the old
// /api rewrites (which proxied to a second server on :3000) are gone.
const nextConfig = {
  reactStrictMode: true,
  // A stray lockfile in the user's home dir can make Next infer the wrong
  // workspace root, which breaks build-output tracing.
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),
};

export default nextConfig;
