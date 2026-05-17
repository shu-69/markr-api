const mongoose = require('mongoose');

const PracticePaperSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true
  }
}, { collection: 'practice_papers', strict: false });

module.exports = mongoose.model('PracticePaper', PracticePaperSchema);
