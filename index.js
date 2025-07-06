
// Route and library imports
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { connectToDb, getDb } = require('./db');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trades');
const targetRoutes = require('./routes/target');
const userRoutes = require('./routes/users');
require('dotenv').config();
require('./config/passport');

const app = express();

// Update this list for all your frontend URLs (Render, Vercel, localhost, etc)
const allowedOrigins = [
  'http://localhost:5173',
  'https://mytradingjournal.vercel.app'
];



// Ensure MongoDB is connected before handling requests (for serverless)
let mongoReady = false;
let mongoError = null;
const mongoPromise = connectToDb()
  .then(() => {
    mongoReady = true;
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    mongoError = err;
    console.error('Failed to connect to MongoDB:', err);
  });

// Middleware
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

if (!process.env.JWT_SECRET || !process.env.SESSION_SECRET) {
  throw new Error('JWT_SECRET and SESSION_SECRET must be set in environment variables!');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// MongoDB collection helpers
function getCollection() {
  return getDb().collection('trades');
}
function getUserCollection() {
  return getDb().collection('users');
}

const authenticateJWT = require('./middleware/authenticateJWT');

// Mount routes
app.use('/api/health', healthRoutes(getDb));
app.use('/api', authRoutes(getUserCollection));
app.use('/api/trades', tradeRoutes(getCollection, authenticateJWT));
app.use('/api/settings/target', targetRoutes(getUserCollection, authenticateJWT));
app.use('/api', userRoutes(getUserCollection, authenticateJWT));


// Export the app for serverless (Vercel)
module.exports = app;

// Only start the server if run directly (for local dev)
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}
