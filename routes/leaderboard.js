const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET leaderboard
router.get('/', async (req, res) => {
  try {
    // Return users sorted by points descending, limit to top 100
    const users = await User.find({ points: { $gt: 0 } })
                            .select('name email username points badges profile_img')
                            .sort({ points: -1 })
                            .limit(100);
    res.json({ success: true, result: users });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

module.exports = router;
