const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true
  }
}, { collection: 'tests', strict: false });

module.exports = mongoose.model('Test', TestSchema);
