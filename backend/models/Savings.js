const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['deposit', 'withdraw'],
    default: 'deposit'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
    get: v => parseFloat(v.toFixed(2)),
    set: v => parseFloat(v.toFixed(2))
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

savingsSchema.index({ member: 1, date: -1 });
savingsSchema.index({ type: 1 });

module.exports = mongoose.model('Savings', savingsSchema);
