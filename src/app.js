require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { serve, setup } = require('./docs');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/docs', serve, setup);

app.use('/api/v1', routes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
