const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true
  },
  proctoring: {
    enabled: { type: Boolean, default: false }
  }
}, { collection: 'tests', strict: false });

module.exports = mongoose.model('Test', TestSchema);
