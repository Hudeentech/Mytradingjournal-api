const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function authRoutes(getUserCollection) {
  const router = express.Router();

  // Register endpoint
  router.post('/register', async (req, res) => {
    const { username, password, email, name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    try {
      const users = await getUserCollection();
      const existingUsername = await users.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      if (email) {
        const existingEmail = await users.findOne({ email });
        if (existingEmail) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await users.insertOne({ username, passwordHash, email, name, createdAt: new Date(), updatedAt: new Date() });
      const token = jwt.sign(
        { userId: result.insertedId, username, email, name },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      res.json({ token, username, email, name });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  // Login endpoint
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const users = await getUserCollection();
    const user = await users.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, username });
  });

  return router;
}

module.exports = authRoutes;
