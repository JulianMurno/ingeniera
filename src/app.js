require('dotenv').config();
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { getHealth } = require('./controllers/health.controller');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { serve, setup } = require('./docs');

// API paths are owned by Express. Everything else is handed to the UI handler
// (Next.js) when one is provided, so the app is served on a single origin.
const isApiPath = (path) => path.startsWith('/api') || path === '/health';

function createApp({ ui } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/docs', serve, setup);

  app.get('/health', getHealth);

  app.use('/api/v1', routes);

  if (ui) {
    app.use((req, res, next) => {
      if (isApiPath(req.path)) return next();
      return ui(req, res);
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
