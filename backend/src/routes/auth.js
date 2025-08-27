const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middlewares/auth');
const { validateRequired, validateEmail, validatePassword } = require('../middlewares/validation');

const router = express.Router();

router.post('/login', 
    validateRequired(['email', 'password']),
    validateEmail,
    AuthController.login
);

router.get('/profile', 
    authenticateToken, 
    AuthController.getProfile
);

router.post('/change-password',
    authenticateToken,
    validateRequired(['currentPassword', 'newPassword']),
    validatePassword,
    AuthController.changePassword
);

router.post('/refresh-token',
    authenticateToken,
    AuthController.refreshToken
);

module.exports = router;
