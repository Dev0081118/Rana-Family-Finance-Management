const Savings = require('../models/Savings');
const asyncHandler = require('../middleware/asyncHandler');

const getAllSavings = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { member: req.user._id };

  if (req.query.type) {
    query.type = req.query.type;
  }
  if (req.query.startDate || req.query.endDate) {
    query.date = {};
    if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
  }

  const sortBy = req.query.sortBy || 'date';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const savings = await Savings.find(query)
    .populate('member', 'name email')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Savings.countDocuments(query);

  res.status(200).json({
    success: true,
    count: savings.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: savings
  });
});

const getSaving = asyncHandler(async (req, res, next) => {
  const saving = await Savings.findOne({
    _id: req.params.id,
    member: req.user._id
  }).populate('member', 'name email');

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Saving not found'
    });
  }

  res.status(200).json({
    success: true,
    data: saving
  });
});

const createSaving = asyncHandler(async (req, res, next) => {
  const { type, amount, date, note } = req.body;

  const saving = await Savings.create({
    type: type || 'deposit',
    amount,
    date: date || Date.now(),
    member: req.user._id,
    note
  });

  await saving.populate('member', 'name email');

  res.status(201).json({
    success: true,
    data: saving
  });
});

const updateSaving = asyncHandler(async (req, res, next) => {
  const { type, amount, date, note } = req.body;

  const saving = await Savings.findOneAndUpdate(
    {
      _id: req.params.id,
      member: req.user._id
    },
    {
      type,
      amount,
      date,
      note
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('member', 'name email');

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Saving not found'
    });
  }

  res.status(200).json({
    success: true,
    data: saving
  });
});

const deleteSaving = asyncHandler(async (req, res, next) => {
  const saving = await Savings.findOneAndDelete({
    _id: req.params.id,
    member: req.user._id
  });

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Saving not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Saving deleted successfully'
  });
});

const getSavingsSummary = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = { member: req.user._id };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const summary = await Savings.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const netSavings = await Savings.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        deposits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0]
          }
        },
        withdrawals: {
          $sum: {
            $cond: [{ $eq: ['$type', 'withdraw'] }, '$amount', 0]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byType: summary,
      netSavings: netSavings[0] ? netSavings[0].deposits - netSavings[0].withdrawals : 0,
      totalDeposits: netSavings[0]?.deposits || 0,
      totalWithdrawals: netSavings[0]?.withdrawals || 0
    }
  });
});

module.exports = {
  getAllSavings,
  getSaving,
  createSaving,
  updateSaving,
  deleteSaving,
  getSavingsSummary
};
