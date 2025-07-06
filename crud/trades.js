const { ObjectId } = require('mongodb');

// Trade CRUD
async function getAllTrades(col, userId) {
  return await col.find({ userId }).sort({ date: -1 }).toArray();
}

async function addTrade(col, trade, userId) {
  trade.date = new Date(trade.date || Date.now());
  trade.userId = userId;
  if (typeof trade.target !== 'string') trade.target = '';
  const result = await col.insertOne(trade);
  return { ...trade, _id: result.insertedId };
}

async function deleteTrade(col, id, userId) {
  await col.deleteOne({ _id: new ObjectId(id), userId });
  return { success: true };
}

async function updateTrade(col, id, update, userId) {
  if (update.date) update.date = new Date(update.date);
  await col.updateOne({ _id: new ObjectId(id), userId }, { $set: update });
  return await col.findOne({ _id: new ObjectId(id), userId });
}

module.exports = {
  getAllTrades,
  addTrade,
  deleteTrade,
  updateTrade,
};
