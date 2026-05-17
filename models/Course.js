const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'General' },
  isFree: { type: Boolean, default: false },
  price: { type: Number },
  duration: { type: String, default: 'Self-paced' },
  thumbnailUrl: { type: String }
});

module.exports = mongoose.model('Course', CourseSchema);
