const { ObjectId } = require('mongodb');

// Target CRUD
async function getUserTarget(users, userId) {
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('User not found');
  return { target: user.target || 0 };
}

async function updateUserTarget(users, userId, target) {
  if (typeof target !== 'number' || target < 0) {
    throw new Error('Invalid target value');
  }
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { target } }
  );
  return { message: 'Target updated', target };
}

module.exports = {
  getUserTarget,
  updateUserTarget,
};
