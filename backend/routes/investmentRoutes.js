const express = require('express');
const router = express.Router();
const {
  getAllInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentSummary,
  getTopPerformers
} = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');
const { validate, idValidation, paginationValidation } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(getAllInvestments)
  .post(createInvestment);

router.route('/summary')
  .get(getInvestmentSummary);

router.route('/top-performers')
  .get(getTopPerformers);

router.route('/:id')
  .get(getInvestment)
  .put(updateInvestment)
  .delete(deleteInvestment);

module.exports = router;
