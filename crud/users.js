const { ObjectId } = require('mongodb');

// User CRUD
async function updateUserProfile(users, userId, name, email) {
  // Check if email is already taken by another user
  if (email) {
    const existingUser = await users.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      throw new Error('Email is already in use');
    }
  }
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { name, email } }
  );
  return { message: 'Profile updated successfully' };
}

async function updateUserPassword(users, userId, currentPassword, newPassword, bcrypt) {
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('User not found');
  const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validPassword) throw new Error('Current password is incorrect');
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { passwordHash: newPasswordHash } }
  );
  return { message: 'Password updated successfully' };
}

async function deleteUserAccount(users, trades, userId) {
  await trades.deleteMany({ userId });
  await users.deleteOne({ _id: new ObjectId(userId) });
  return { message: 'Account and all trades deleted.' };
}

module.exports = {
  updateUserProfile,
  updateUserPassword,
  deleteUserAccount,
};
