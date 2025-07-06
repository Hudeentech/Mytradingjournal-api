const { MongoClient } = require('mongodb');

let db;

async function connectToDb() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'trading_journal';
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { connectToDb, getDb };
