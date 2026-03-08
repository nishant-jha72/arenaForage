const express = require('express');
const router = express.Router();

const userController = require('../Controllers/user.controllers');
const upload = require('../Middleware/multer.middlewares');
const authMiddleware = require('../Middleware/auth.middlewares');

// --- THE LOGS THAT WILL SOLVE THIS ---
console.log("Check 1 (Controller):", typeof userController?.login);
console.log("Check 2 (Multer):", typeof upload?.single);
console.log("Check 3 (Auth):", typeof authMiddleware);

// --- PROTECTED ROUTING ---
if (typeof userController.register === 'function' && typeof upload?.single === 'function') {
    router.post('/register', upload.single('profilePicture'), userController.register);
} else {
    console.error("ERROR: Register or Multer is broken");
}

if (typeof userController.login === 'function') {
    router.post('/login', userController.login);
} else {
    console.error("ERROR: Login function is missing");
}

if (typeof authMiddleware === 'function' && typeof userController.logout === 'function') {
    router.post('/logout', authMiddleware, userController.logout);
} else {
    console.error("ERROR: AuthMiddleware or Logout is missing");
}

module.exports = router;