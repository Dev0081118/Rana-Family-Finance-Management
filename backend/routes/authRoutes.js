const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword, forgotPassword, getAllUsers, updateUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, userValidation, idValidation } = require('../middleware/validation');

router.post('/register', validate(userValidation), register);

router.post('/login', login);

router.get('/profile', protect, getProfile);

router.put('/profile', protect, updateProfile);

router.put('/change-password', protect, changePassword);

router.post('/forgot-password', forgotPassword);

// Admin only routes
router.get('/users', protect, getAllUsers);

router.put('/users/:id', protect, validate(idValidation), updateUser);

module.exports = router;
