const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, userValidation, idValidation } = require('../middleware/validation');

router.post('/register', validate(userValidation), register);

router.post('/login', login);

router.get('/profile', protect, getProfile);

router.put('/profile', protect, updateProfile);

router.put('/change-password', protect, changePassword);

router.post('/forgot-password', forgotPassword);

module.exports = router;
