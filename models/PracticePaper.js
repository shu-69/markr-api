const mongoose = require('mongoose');

const PracticePaperSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true
  },
  proctoring: {
    enabled: { type: Boolean, default: false }
  }
}, { collection: 'practice_papers', strict: false });

module.exports = mongoose.model('PracticePaper', PracticePaperSchema);
