const express = require('express');
const router = express.Router();
const {
  getAllExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { validate, idValidation, paginationValidation, dateRangeValidation } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(getAllExpenses)
  .post(createExpense);

router.route('/summary')
  .get(getExpenseSummary);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
