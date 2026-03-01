const express = require('express');
const router = express.Router();
const {
  getNetWorth,
  getMonthlyCashFlow,
  getSavingsGrowth,
  getInvestmentPerformance,
  getMemberContributions,
  getCategoryBreakdown,
  getYearlySummary
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { validate, dateRangeValidation } = require('../middleware/validation');

router.use(protect);

router.route('/net-worth')
  .get(getNetWorth);

router.route('/monthly-cashflow')
  .get(getMonthlyCashFlow);

router.route('/savings-growth')
  .get(getSavingsGrowth);

router.route('/investment-performance')
  .get(getInvestmentPerformance);

router.route('/member-contributions')
  .get(getMemberContributions);

router.route('/category-breakdown')
  .get(getCategoryBreakdown);

router.route('/yearly-summary')
  .get(getYearlySummary);

module.exports = router;
