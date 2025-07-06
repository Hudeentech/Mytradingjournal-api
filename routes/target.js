const express = require('express');
const { ObjectId } = require('mongodb');

function targetRoutes(getUserCollection, authenticateJWT) {
  const router = express.Router();

  // Get the current user's target
  router.get('/', authenticateJWT, async (req, res) => {
    try {
      const users = await getUserCollection();
      const user = await users.findOne({ _id: new ObjectId(req.user.userId) });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ target: user.target || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch target' });
    }
  });

  // Update the current user's target
  router.put('/', authenticateJWT, async (req, res) => {
    try {
      const { target } = req.body;
      if (typeof target !== 'number' || target < 0) {
        return res.status(400).json({ error: 'Invalid target value' });
      }
      const users = await getUserCollection();
      await users.updateOne(
        { _id: new ObjectId(req.user.userId) },
        { $set: { target } }
      );
      res.json({ message: 'Target updated', target });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update target' });
    }
  });

  return router;
}

module.exports = targetRoutes;
