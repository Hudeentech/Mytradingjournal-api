const express = require('express');
const { ObjectId } = require('mongodb');

function healthRoutes(getDb) {
  const router = express.Router();

  // Health check endpoint for deployment debugging
  router.get('/', async (req, res) => {
    try {
      await getDb().command({ ping: 1 });
      res.json({ status: 'ok', db: true });
    } catch (e) {
      res.status(500).json({ status: 'error', db: false, error: e.message });
    }
  });

  return router;
}

module.exports = healthRoutes;
