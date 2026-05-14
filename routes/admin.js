const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { decrypt } = require('../services/encryption');

const ADMINS_COLLECTION = 'admins';

// GET /admin/authenticate
router.get('/authenticate', async (req, res) => {
  const { username, password } = req.query;
  const db = mongoose.connection.db;

  try {
    const doc = await db.collection(ADMINS_COLLECTION).findOne({ username });

    if (!doc) return res.json({ success: false, err: 'Username not found!' });

    const decrypted = decrypt(doc.password);
    if (password !== decrypted) {
      return res.json({ success: false, err: 'Password did not match.' });
    }

    const result = { ...doc };
    delete result.password;
    delete result._id;

    res.json({ success: true, result });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

module.exports = router;
