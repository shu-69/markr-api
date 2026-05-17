const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  razorpay_payment_id: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed', 'cancelled'], default: 'success' }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
  name: { type: String },
  dob: { type: String },
  profile_img: { type: mongoose.Schema.Types.ObjectId },
  transactions: [TransactionSchema],
  enrolledCourses: [{ type: String }],
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true
  }
}, { collection: 'users', strict: false });

module.exports = mongoose.model('User', UserSchema);
