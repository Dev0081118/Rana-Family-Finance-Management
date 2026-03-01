const Expense = require('../models/Expense');
const asyncHandler = require('../middleware/asyncHandler');

const getAllExpenses = asyncHandler(async (req, res, next) => {
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

  const expenses = await Expense.find(query)
    .populate('member', 'name email')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Expense.countDocuments(query);

  res.status(200).json({
    success: true,
    count: expenses.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: expenses
  });
});

const getExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    member: req.user._id
  }).populate('member', 'name email');

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  res.status(200).json({
    success: true,
    data: expense
  });
});

const createExpense = asyncHandler(async (req, res, next) => {
  const { amount, category, date, description } = req.body;

  const expense = await Expense.create({
    amount,
    category,
    date: date || Date.now(),
    member: req.user._id,
    description
  });

  await expense.populate('member', 'name email');

  res.status(201).json({
    success: true,
    data: expense
  });
});

const updateExpense = asyncHandler(async (req, res, next) => {
  const { amount, category, date, description } = req.body;

  const expense = await Expense.findOneAndUpdate(
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

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  res.status(200).json({
    success: true,
    data: expense
  });
});

const deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    member: req.user._id
  });

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

const getExpenseSummary = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = { member: req.user._id };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const summary = await Expense.aggregate([
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

  const grandTotal = await Expense.aggregate([
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
  getAllExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
