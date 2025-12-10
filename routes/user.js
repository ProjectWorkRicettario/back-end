// backend/routes/user.js
const router = require('express').Router();
const userController = require('../controllers/userController');
const isAuthenticated = require('../middleware/authMiddleware');

router.get('/profile', isAuthenticated, userController.getProfile);

module.exports = router;