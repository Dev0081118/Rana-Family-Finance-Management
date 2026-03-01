const Income = require('../models/Income');
const asyncHandler = require('../middleware/asyncHandler');

const getAllIncomes = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { member: req.user._id };

  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.startDate || req.query.endDate) {
    query.date = {};
    if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
  }

  const sortBy = req.query.sortBy || 'date';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const incomes = await Income.find(query)
    .populate('member', 'name email')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Income.countDocuments(query);

  res.status(200).json({
    success: true,
    count: incomes.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: incomes
  });
});

const getIncome = asyncHandler(async (req, res, next) => {
  const income = await Income.findOne({
    _id: req.params.id,
    member: req.user._id
  }).populate('member', 'name email');

  if (!income) {
    return res.status(404).json({
      success: false,
      message: 'Income not found'
    });
  }

  res.status(200).json({
    success: true,
    data: income
  });
});

const createIncome = asyncHandler(async (req, res, next) => {
  const { amount, category, date, description } = req.body;

  const income = await Income.create({
    amount,
    category,
    date: date || Date.now(),
    member: req.user._id,
    description
  });

  await income.populate('member', 'name email');

  res.status(201).json({
    success: true,
    data: income
  });
});

const updateIncome = asyncHandler(async (req, res, next) => {
  const { amount, category, date, description } = req.body;

  const income = await Income.findOneAndUpdate(
    {
      _id: req.params.id,
      member: req.user._id
    },
    {
      amount,
      category,
      date,
      description
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('member', 'name email');

  if (!income) {
    return res.status(404).json({
      success: false,
      message: 'Income not found'
    });
  }

  res.status(200).json({
    success: true,
    data: income
  });
});

const deleteIncome = asyncHandler(async (req, res, next) => {
  const income = await Income.findOneAndDelete({
    _id: req.params.id,
    member: req.user._id
  });

  if (!income) {
    return res.status(404).json({
      success: false,
      message: 'Income not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Income deleted successfully'
  });
});

const getIncomeSummary = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = { member: req.user._id };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const summary = await Income.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);

  const grandTotal = await Income.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byCategory: summary,
      grandTotal: grandTotal[0]?.total || 0
    }
  });
});

module.exports = {
  getAllIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary
};
