const serverlessExpress = require('@vendia/serverless-express');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
require('../config/passport');
const { connectToDb, getDb } = require('../db');
const tradeRoutes = require('../routes/trades');
const authenticateJWT = require('../middleware/authenticateJWT');

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

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

function getCollection() {
  return getDb().collection('trades');
}

app.use('/api/trades', tradeRoutes(getCollection, authenticateJWT));

module.exports = serverlessExpress({ app });
