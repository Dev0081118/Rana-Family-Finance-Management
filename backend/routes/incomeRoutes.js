const express = require('express');
const router = express.Router();
const {
  getAllIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary
} = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');
const { validate, idValidation, paginationValidation, dateRangeValidation } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(getAllIncomes)
  .post(createIncome);

router.route('/summary')
  .get(getIncomeSummary);

router.route('/:id')
  .get(getIncome)
  .put(updateIncome)
  .delete(deleteIncome);

module.exports = router;
