require('dotenv').config();
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { getHealth } = require('./controllers/health.controller');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { serve, setup } = require('./docs');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/docs', serve, setup);

app.get('/health', getHealth);

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
