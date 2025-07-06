const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function getUserCollection(client, dbName) {
  if (!client.topology || !client.topology.isConnected()) await client.connect();
  return client.db(dbName).collection('users');
}

async function findUserByUsername(client, dbName, username) {
  const col = await getUserCollection(client, dbName);
  return col.findOne({ username });
}

async function createUser(client, dbName, { username, passwordHash, email, name }) {
  const col = await getUserCollection(client, dbName);
  return col.insertOne({ 
    username, 
    passwordHash, 
    email,
    name,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

module.exports = { getUserCollection, findUserByUsername, createUser };
