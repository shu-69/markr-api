const express = require('express');
const router = express.Router();
const Forum = require('../models/Forum');

// GET all forums
router.get('/', async (req, res) => {
  try {
    const forums = await Forum.find().sort({ createdAt: -1 });
    res.json({ success: true, result: forums });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET single forum
router.get('/:id', async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.json({ success: false, err: 'Not found' });
    res.json({ success: true, result: forum });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// POST create forum
router.post('/create', async (req, res) => {
  try {
    const forum = new Forum(req.body);
    await forum.save();
    res.json({ success: true, result: forum });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// POST add reply
router.post('/:id/reply', async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.json({ success: false, err: 'Not found' });
    
    forum.replies.push(req.body);
    await forum.save();
    
    res.json({ success: true, result: forum });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

module.exports = router;
