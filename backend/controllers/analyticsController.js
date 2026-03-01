const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Savings = require('../models/Savings');
const Investment = require('../models/Investment');
const asyncHandler = require('../middleware/asyncHandler');

const getNetWorth = asyncHandler(async (req, res, next) => {
  const { asOfDate } = req.query;

  const matchCondition = { member: req.user._id };
  if (asOfDate) {
    const date = new Date(asOfDate);
    matchCondition.date = { $lte: date };
  }

  const totalIncome = await Income.aggregate([
    { $match: matchCondition },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalExpenses = await Expense.aggregate([
    { $match: matchCondition },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalSavings = await Savings.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        netSavings: {
          $sum: {
            $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', { $multiply: [-1, '$amount'] }]
          }
        }
      }
    }
  ]);

  const totalInvestments = await Investment.aggregate([
    { $match: { member: req.user._id } },
    { $group: { _id: null, total: { $sum: '$currentValue' } } }
  ]);

  const totalInvested = await Investment.aggregate([
    { $match: { member: req.user._id } },
    { $group: { _id: null, total: { $sum: '$investedAmount' } } }
  ]);

  const income = totalIncome[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;
  const savings = totalSavings[0]?.netSavings || 0;
  const investments = totalInvestments[0]?.total || 0;
  const invested = totalInvested[0]?.total || 0;
  const investmentProfit = parseFloat((investments - invested).toFixed(2));

  const netWorth = parseFloat((income - expenses + savings + investments).toFixed(2));

  res.status(200).json({
    success: true,
    data: {
      netWorth,
      breakdown: {
        totalIncome: income,
        totalExpenses: expenses,
        netSavings: savings,
        investments: investments,
        investmentProfitLoss: investmentProfit
      }
    }
  });
});

const getMonthlyCashFlow = asyncHandler(async (req, res, next) => {
  const { year, month } = req.query;
  const matchCondition = { member: req.user._id };

  if (year) {
    matchCondition.date = { ...matchCondition.date, $gte: new Date(`${year}-01-01`) };
    if (month) {
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      matchCondition.date = { $gte: startDate, $lt: endDate };
    } else {
      const endDate = new Date(`${year}-12-31`);
      matchCondition.date.$lte = endDate;
    }
  }

  const monthlyIncome = await Income.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const monthlyExpenses = await Expense.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const monthlySavings = await Savings.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
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
    },
    { $sort: { _id: 1 } }
  ]);

  const cashFlow = monthlyIncome.map(month => {
    const expenseMonth = monthlyExpenses.find(e => e._id === month._id) || { total: 0, count: 0 };
    const savingsMonth = monthlySavings.find(s => s._id === month._id) || { deposits: 0, withdrawals: 0 };

    return {
      month: month._id,
      income: month.total,
      incomeCount: month.count,
      expenses: expenseMonth.total,
      expenseCount: expenseMonth.count,
      deposits: savingsMonth.deposits,
      withdrawals: savingsMonth.withdrawals,
      netCashFlow: parseFloat((month.total - expenseMonth.total + savingsMonth.deposits - savingsMonth.withdrawals).toFixed(2))
    };
  });

  res.status(200).json({
    success: true,
    data: cashFlow
  });
});

const getSavingsGrowth = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const matchCondition = { member: req.user._id };
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) matchCondition.date.$gte = new Date(startDate);
    if (endDate) matchCondition.date.$lte = new Date(endDate);
  }

  const savingsData = await Savings.aggregate([
    { $match: matchCondition },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
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

  let cumulative = 0;
  const growth = savingsData.map(month => {
    const net = month.deposits - month.withdrawals;
    cumulative += net;
    return {
      month: month._id,
      deposits: month.deposits,
      withdrawals: month.withdrawals,
      netChange: net,
      cumulativeSavings: parseFloat(cumulative.toFixed(2))
    };
  });

  res.status(200).json({
    success: true,
    data: growth
  });
});

const getInvestmentPerformance = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const matchCondition = { member: req.user._id };
  if (startDate || endDate) {
    matchCondition.purchaseDate = {};
    if (startDate) matchCondition.purchaseDate.$gte = new Date(startDate);
    if (endDate) matchCondition.purchaseDate.$lte = new Date(endDate);
  }

  const performance = await Investment.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$assetType',
        totalInvested: { $sum: '$investedAmount' },
        totalCurrentValue: { $sum: '$currentValue' },
        count: { $sum: 1 },
        avgROI: { $avg: { $subtract: ['$currentValue', '$investedAmount'] } }
      }
    },
    {
      $addFields: {
        profitLoss: { $subtract: ['$totalCurrentValue', '$totalInvested'] },
        roi: {
          $cond: {
            if: { $eq: ['$totalInvested', 0] },
            then: 0,
            else: {
              $multiply: [
                { $divide: [{ $subtract: ['$totalCurrentValue', '$totalInvested'] }, '$totalInvested'] },
                100
              ]
            }
          }
        }
      }
    },
    {
      $sort: { roi: -1 }
    }
  ]);

  const overall = await Investment.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalInvested: { $sum: '$investedAmount' },
        totalCurrentValue: { $sum: '$currentValue' },
        totalProfitLoss: { $sum: { $subtract: ['$currentValue', '$investedAmount'] } }
      }
    }
  ]);

  const totalInvested = overall[0]?.totalInvested || 0;
  const totalCurrentValue = overall[0]?.totalCurrentValue || 0;
  const overallROI = totalInvested > 0 ? parseFloat(((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(2)) : 0;

  res.status(200).json({
    success: true,
    data: {
      byAssetType: performance,
      overall: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss: overall[0]?.totalProfitLoss || 0,
        overallROI
      }
    }
  });
});

const getMemberContributions = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const dateMatch = {};
  if (startDate || endDate) {
    if (startDate) dateMatch.$gte = new Date(startDate);
    if (endDate) dateMatch.$lte = new Date(endDate);
  }

  const incomeByMember = await Income.aggregate([
    { $match: { ...{ member: { $exists: true } }, ...(Object.keys(dateMatch).length ? { date: dateMatch } : {}) } },
    {
      $group: {
        _id: '$member',
        totalIncome: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const expenseByMember = await Expense.aggregate([
    { $match: { ...{ member: { $exists: true } }, ...(Object.keys(dateMatch).length ? { date: dateMatch } : {}) } },
    {
      $group: {
        _id: '$member',
        totalExpenses: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const savingsByMember = await Savings.aggregate([
    { $match: { ...{ member: { $exists: true } }, ...(Object.keys(dateMatch).length ? { date: dateMatch } : {}) } },
    {
      $group: {
        _id: '$member',
        netSavings: {
          $sum: {
            $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', { $multiply: [-1, '$amount'] }]
          }
        }
      }
    }
  ]);

  const investmentsByMember = await Investment.aggregate([
    { $match: { member: { $exists: true } } },
    {
      $group: {
        _id: '$member',
        totalInvestments: { $sum: '$currentValue' }
      }
    }
  ]);

  const User = require('../models/User');
  const members = await User.find({ role: 'member' }, 'name email').lean();

  const contributions = members.map(member => {
    const income = incomeByMember.find(i => i._id.toString() === member._id) || { totalIncome: 0, count: 0 };
    const expense = expenseByMember.find(e => e._id.toString() === member._id) || { totalExpenses: 0, count: 0 };
    const saving = savingsByMember.find(s => s._id.toString() === member._id) || { netSavings: 0 };
    const investment = investmentsByMember.find(i => i._id.toString() === member._id) || { totalInvestments: 0 };

    return {
      member: {
        id: member._id,
        name: member.name,
        email: member.email
      },
      income: income.totalIncome,
      incomeCount: income.count,
      expenses: expense.totalExpenses,
      expenseCount: expense.count,
      netSavings: saving.netSavings,
      investments: investment.totalInvestments,
      netContribution: parseFloat((income.totalIncome - expense.totalExpenses + saving.netSavings).toFixed(2))
    };
  });

  res.status(200).json({
    success: true,
    data: contributions
  });
});

const getCategoryBreakdown = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, type } = req.query;

  const dateMatch = {};
  if (startDate || endDate) {
    if (startDate) dateMatch.$gte = new Date(startDate);
    if (endDate) dateMatch.$lte = new Date(endDate);
  }

  let breakdown = [];

  if (type === 'income' || !type) {
    const incomeBreakdown = await Income.aggregate([
      { $match: { member: req.user._id, ...(Object.keys(dateMatch).length ? { date: dateMatch } : {}) } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    breakdown = breakdown.concat(incomeBreakdown.map(item => ({ ...item, type: 'income' })));
  }

  if (type === 'expense' || !type) {
    const expenseBreakdown = await Expense.aggregate([
      { $match: { member: req.user._id, ...(Object.keys(dateMatch).length ? { date: dateMatch } : {}) } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    breakdown = breakdown.concat(expenseBreakdown.map(item => ({ ...item, type: 'expense' })));
  }

  res.status(200).json({
    success: true,
    data: breakdown
  });
});

const getYearlySummary = asyncHandler(async (req, res, next) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const startDate = new Date(`${targetYear}-01-01`);
  const endDate = new Date(`${targetYear}-12-31 23:59:59`);

  const monthlyIncome = await Income.aggregate([
    {
      $match: {
        member: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $month: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        total: { $sum: '$amount' }
      }
    }
  ]);

  const monthlyExpenses = await Expense.aggregate([
    {
      $match: {
        member: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $month: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        total: { $sum: '$amount' }
      }
    }
  ]);

  const yearlyIncome = await Income.aggregate([
    { $match: { member: req.user._id, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  const yearlyExpenses = await Expense.aggregate([
    { $match: { member: req.user._id, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  const yearlySavings = await Savings.aggregate([
    { $match: { member: req.user._id, date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        netSavings: {
          $sum: {
            $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', { $multiply: [-1, '$amount'] }]
          }
        }
      }
    }
  ]);

  const yearlyInvestments = await Investment.aggregate([
    { $match: { member: req.user._id } },
    {
      $group: {
        _id: null,
        totalInvested: { $sum: '$investedAmount' },
        totalCurrentValue: { $sum: '$currentValue' }
      }
    }
  ]);

  const totalIncome = yearlyIncome[0]?.total || 0;
  const totalExpenses = yearlyExpenses[0]?.total || 0;
  const netSavings = yearlySavings[0]?.netSavings || 0;
  const investments = yearlyInvestments[0]?.totalCurrentValue || 0;
  const invested = yearlyInvestments[0]?.totalInvested || 0;
  const investmentProfit = parseFloat((investments - invested).toFixed(2));

  res.status(200).json({
    success: true,
    data: {
      year: targetYear,
      income: {
        total: totalIncome,
        count: yearlyIncome[0]?.count || 0,
        monthly: monthlyIncome
      },
      expenses: {
        total: totalExpenses,
        count: yearlyExpenses[0]?.count || 0,
        monthly: monthlyExpenses
      },
      savings: {
        net: netSavings
      },
      investments: {
        currentValue: investments,
        invested: invested,
        profitLoss: investmentProfit
      },
      netSavings: parseFloat((totalIncome - totalExpenses + netSavings).toFixed(2))
    }
  });
});

const getDashboardData = asyncHandler(async (req, res, next) => {
  // Set cache control headers to reduce conditional requests
  res.set('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=60');
  
  // Simple in-memory cache per user (in production, use Redis)
  const cacheKey = `dashboard:${req.user._id}`;
  if (global.dashboardCache && global.dashboardCache[cacheKey]) {
    const cached = global.dashboardCache[cacheKey];
    if (Date.now() - cached.timestamp < 30000) { // 30 seconds cache
      return res.status(200).json({
        success: true,
        data: cached.data,
        cached: true
      });
    }
  }

  // Fetch all data in parallel for efficiency
  const [incomeRes, expenseRes, savingsRes, investmentRes] = await Promise.all([
    Income.find({ member: req.user._id }).sort({ date: -1 }).lean(),
    Expense.find({ member: req.user._id }).sort({ date: -1 }).lean(),
    Savings.find({ member: req.user._id }).sort({ date: -1 }).lean(),
    Investment.find({ member: req.user._id }).sort({ purchaseDate: -1 }).lean()
  ]);

const incomes = incomeRes;
const expenses = expenseRes;
const savings = savingsRes;
const investments = investmentRes;

// Calculate totals
const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
const totalSavings = savings
  .filter(s => s.type === 'deposit')
  .reduce((sum, s) => sum + s.amount, 0) -
  savings
  .filter(s => s.type === 'withdraw')
  .reduce((sum, s) => sum + s.amount, 0);
const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
const netWorth = totalSavings + totalInvestments;

// Process monthly data
const processMonthlyData = (data, valueKey) => {
  const monthlyMap = new Map();
  data.forEach(item => {
    const date = new Date(item.date || item.purchaseDate);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthYear, (monthlyMap.get(monthYear) || 0) + (valueKey === 'amount' ? item.amount : item.currentValue));
  });
  return Array.from(monthlyMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const incomeMonthly = processMonthlyData(incomes, 'amount');
const expenseMonthly = processMonthlyData(expenses, 'amount');

// Process expense by category
const categoryMap = new Map();
expenses.forEach(exp => {
  categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
});

const colors = ['#ef4444', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899', '#6b7280'];
const expenseByCategory = Array.from(categoryMap.entries())
  .map(([category, amount], index) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    color: colors[index % colors.length]
  }))
  .sort((a, b) => b.amount - a.amount);

const responseData = {
  success: true,
  data: {
    summary: {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalInvestments,
      netWorth
    },
    income: {
      monthly: incomeMonthly,
      raw: incomes
    },
    expenses: {
      monthly: expenseMonthly,
      byCategory: expenseByCategory,
      raw: expenses
    },
    savings: {
      raw: savings
    },
    investments: {
      raw: investments
    }
  }
};

// Cache the response
if (!global.dashboardCache) {
  global.dashboardCache = {};
}
global.dashboardCache[cacheKey] = {
  data: responseData.data,
  timestamp: Date.now()
};

// Clean up old cache entries (simple LRU)
const cacheKeys = Object.keys(global.dashboardCache);
if (cacheKeys.length > 100) {
  const oldestKey = cacheKeys[0];
  delete global.dashboardCache[oldestKey];
}

res.status(200).json(responseData);
});

module.exports = {
getNetWorth,
getMonthlyCashFlow,
getSavingsGrowth,
getInvestmentPerformance,
getMemberContributions,
getCategoryBreakdown,
getYearlySummary,
getDashboardData
};
