const serverlessExpress = require('@vendia/serverless-express');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectToDb, getDb } = require('../db');
const healthRoutes = require('../routes/health');

const allowedOrigins = [
  'http://localhost:5173',
  'https://mytradingjournal.vercel.app'
];

const app = express();

let mongoReady = false;
let mongoError = null;
const mongoPromise = connectToDb()
  .then(() => { mongoReady = true; })
  .catch(err => { mongoError = err; });

app.use(async (req, res, next) => {
  if (!mongoReady) {
    await mongoPromise;
    if (mongoError) {
      return res.status(500).json({ error: 'Failed to connect to database' });
    }
  }
  next();
});
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));
app.use(express.json());

app.use('/api/health', healthRoutes(getDb));

module.exports = serverlessExpress({ app });
