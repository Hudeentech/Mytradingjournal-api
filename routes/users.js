const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


function userRoutes(getUserCollection, authenticateJWT) {
  const router = express.Router();

  // Update user profile
  router.put('/settings/profile', authenticateJWT, async (req, res) => {
    try {
      const { name, email } = req.body;
      const users = await getUserCollection();
      if (email) {
        const existingUser = await users.findOne({ email, _id: { $ne: req.user.userId } });
        if (existingUser) {
          return res.status(400).json({ error: 'Email is already in use' });
        }
      }
      await users.updateOne(
        { _id: new ObjectId(req.user.userId) },
        { $set: { name, email } }
      );
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Update password
  router.put('/settings/password', authenticateJWT, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const users = await getUserCollection();
      const user = await users.findOne({ _id: new ObjectId(req.user.userId) });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await users.updateOne(
        { _id: new ObjectId(req.user.userId) },
        { $set: { passwordHash: newPasswordHash } }
      );
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  // Delete user account and all trades
  router.delete('/delete-account', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      if (!userId) return res.status(400).json({ error: 'User not found' });
      const users = await getUserCollection();
      const trades = await require('../db').getDb().collection('trades');
      await trades.deleteMany({ userId });
      await users.deleteOne({ _id: new ObjectId(userId) });
      res.json({ message: 'Account and all trades deleted.' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  return router;
}

module.exports = userRoutes;
