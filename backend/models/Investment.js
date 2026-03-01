const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [200, 'Asset name cannot exceed 200 characters']
  },
  assetType: {
    type: String,
    required: [true, 'Asset type is required'],
    trim: true,
    enum: [
      'Stocks',
      'Bonds',
      'Mutual Funds',
      'Cryptocurrency',
      'Real Estate',
      'Gold',
      'Fixed Deposit',
      'PPF',
      'SIP',
      'Other'
    ]
  },
  investedAmount: {
    type: Number,
    required: [true, 'Invested amount is required'],
    min: [0, 'Invested amount cannot be negative'],
    get: v => parseFloat(v.toFixed(2)),
    set: v => parseFloat(v.toFixed(2))
  },
  currentValue: {
    type: Number,
    required: [true, 'Current value is required'],
    min: [0, 'Current value cannot be negative'],
    get: v => parseFloat(v.toFixed(2)),
    set: v => parseFloat(v.toFixed(2))
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

investmentSchema.index({ member: 1, assetType: 1 });
investmentSchema.index({ purchaseDate: -1 });

investmentSchema.virtual('profitLoss').get(function () {
  return parseFloat((this.currentValue - this.investedAmount).toFixed(2));
});

investmentSchema.virtual('roi').get(function () {
  if (this.investedAmount === 0) return 0;
  return parseFloat(((this.currentValue - this.investedAmount) / this.investedAmount * 100).toFixed(2));
});

module.exports = mongoose.model('Investment', investmentSchema);
