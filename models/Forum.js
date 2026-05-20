const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  author: { type: String, required: true },
  email: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ForumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [ReplySchema],
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute'
  }
}, { collection: 'forums', strict: false });

module.exports = mongoose.model('Forum', ForumSchema);
