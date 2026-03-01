const Investment = require('../models/Investment');
const asyncHandler = require('../middleware/asyncHandler');

const getAllInvestments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { member: req.user._id };

  if (req.query.assetType) {
    query.assetType = req.query.assetType;
  }
  if (req.query.minValue || req.query.maxValue) {
    query.currentValue = {};
    if (req.query.minValue) query.currentValue.$gte = parseFloat(req.query.minValue);
    if (req.query.maxValue) query.currentValue.$lte = parseFloat(req.query.maxValue);
  }

  const sortBy = req.query.sortBy || 'purchaseDate';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const investments = await Investment.find(query)
    .populate('member', 'name email')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Investment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: investments.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: investments
  });
});

const getInvestment = asyncHandler(async (req, res, next) => {
  const investment = await Investment.findOne({
    _id: req.params.id,
    member: req.user._id
  }).populate('member', 'name email');

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: investment
  });
});

const createInvestment = asyncHandler(async (req, res, next) => {
  const { assetName, assetType, investedAmount, currentValue, purchaseDate } = req.body;

  const investment = await Investment.create({
    assetName,
    assetType,
    investedAmount,
    currentValue,
    purchaseDate: purchaseDate || Date.now(),
    member: req.user._id
  });

  await investment.populate('member', 'name email');

  res.status(201).json({
    success: true,
    data: investment
  });
});

const updateInvestment = asyncHandler(async (req, res, next) => {
  const { assetName, assetType, investedAmount, currentValue, purchaseDate } = req.body;

  const investment = await Investment.findOneAndUpdate(
    {
      _id: req.params.id,
      member: req.user._id
    },
    {
      assetName,
      assetType,
      investedAmount,
      currentValue,
      purchaseDate
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('member', 'name email');

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: investment
  });
});

const deleteInvestment = asyncHandler(async (req, res, next) => {
  const investment = await Investment.findOneAndDelete({
    _id: req.params.id,
    member: req.user._id
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Investment deleted successfully'
  });
});

const getInvestmentSummary = asyncHandler(async (req, res, next) => {
  const summary = await Investment.aggregate([
    { $match: { member: req.user._id } },
    {
      $group: {
        _id: '$assetType',
        totalInvested: { $sum: '$investedAmount' },
        totalCurrentValue: { $sum: '$currentValue' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalCurrentValue: -1 }
    }
  ]);

  const overall = await Investment.aggregate([
    { $match: { member: req.user._id } },
    {
      $group: {
        _id: null,
        totalInvested: { $sum: '$investedAmount' },
        totalCurrentValue: { $sum: '$currentValue' }
      }
    }
  ]);

  const totalInvested = overall[0]?.totalInvested || 0;
  const totalCurrentValue = overall[0]?.totalCurrentValue || 0;
  const totalProfitLoss = parseFloat((totalCurrentValue - totalInvested).toFixed(2));
  const overallROI = totalInvested > 0 ? parseFloat(((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(2)) : 0;

  res.status(200).json({
    success: true,
    data: {
      byAssetType: summary,
      overall: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        overallROI
      }
    }
  });
});

const getTopPerformers = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 5;

  const topPerformers = await Investment.find({ member: req.user._id })
    .sort({ roi: -1 })
    .limit(limit)
    .lean();

  const worstPerformers = await Investment.find({ member: req.user._id })
    .sort({ roi: 1 })
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      topPerformers,
      worstPerformers
    }
  });
});

module.exports = {
  getAllInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentSummary,
  getTopPerformers
};
