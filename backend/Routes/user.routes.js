const express = require('express');
const router = express.Router();
const userController = require('../Controllers/user.controllers');
console.log("CONTROLLER CHECK:", userController);
const authMiddleware = require('../Middleware/auth.middlewares'); // Optional: see below

/**
 * PUBLIC ROUTES
 * Anyone can access these (e.g., to create an account or log in)
 */
console.log("Type of Register:", typeof userController.register);
console.log("Type of Login:", typeof userController.login);
console.log("Type of AuthMiddleware:", typeof authMiddleware);

router.post('/register', userController.register);
router.post('/login', userController.login);

/**
 * PROTECTED ROUTES
 * Only logged-in users with a valid JWT token can access these
 */
// Update user profile (Name, Age, Profile Picture)
router.put('/update/:id', authMiddleware, userController.updateProfile);

// Verify email status
router.patch('/verify/:id', authMiddleware, userController.verifyEmail);

/**
 * PRIVATE GET ROUTE
 * Useful for fetching the current user's data for a "Profile" page
 */
router.get('/profile/:id', authMiddleware, async (req, res) => {
    // Logic to fetch user data by ID and return it
});

module.exports = router;