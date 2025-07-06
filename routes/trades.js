const express = require('express');
const { ObjectId } = require('mongodb');

function tradeRoutes(getCollection, authenticateJWT) {
  const router = express.Router();

  // Get all trades for the logged-in user
  router.get('/', authenticateJWT, async (req, res) => {
    const col = await getCollection();
    const trades = await col.find({ userId: req.user.userId }).sort({ date: -1 }).toArray();
    res.json(trades);
  });

  // Add a trade for the logged-in user
  router.post('/', authenticateJWT, async (req, res) => {
    const col = await getCollection();
    const trade = req.body;
    trade.date = new Date(trade.date || Date.now());
    trade.userId = req.user.userId;
    if (typeof trade.target !== 'string') trade.target = '';
    const result = await col.insertOne(trade);
    res.json({ ...trade, _id: result.insertedId });
  });

  // Delete a trade (only if it belongs to the user)
  router.delete('/:id', authenticateJWT, async (req, res) => {
    const col = await getCollection();
    await col.deleteOne({ _id: new ObjectId(req.params.id), userId: req.user.userId });
    res.json({ success: true });
  });

  // Edit a trade (only if it belongs to the user)
  router.put('/:id', authenticateJWT, async (req, res) => {
    const col = await getCollection();
    const { id } = req.params;
    const update = req.body;
    if (update.date) update.date = new Date(update.date);
    await col.updateOne({ _id: new ObjectId(id), userId: req.user.userId }, { $set: update });
    const updated = await col.findOne({ _id: new ObjectId(id), userId: req.user.userId });
    res.json(updated);
  });

  return router;
}

module.exports = tradeRoutes;
