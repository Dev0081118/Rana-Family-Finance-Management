const express = require('express');
const router = express.Router();
const {
  getAllSavings,
  getSaving,
  createSaving,
  updateSaving,
  deleteSaving,
  getSavingsSummary
} = require('../controllers/savingsController');
const { protect } = require('../middleware/auth');
const { validate, idValidation, paginationValidation, dateRangeValidation } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(getAllSavings)
  .post(createSaving);

router.route('/summary')
  .get(getSavingsSummary);

router.route('/:id')
  .get(getSaving)
  .put(updateSaving)
  .delete(deleteSaving);

module.exports = router;
