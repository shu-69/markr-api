const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const USERS_COLLECTION = 'users';

// GET /users/getSubmissions
router.get('/getSubmissions', async (req, res) => {
  const db = mongoose.connection.db;
  const { email } = req.query;

  try {
    const doc = await db.collection(USERS_COLLECTION).findOne({ email });

    if (doc) {
      res.json({ success: true, result: doc.submissions || [] });
    } else {
      res.json({ success: false, err: 'No User found with this email' });
    }
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

module.exports = router;
