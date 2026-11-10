
const express = require('express');

const router = express.Router();

const authController = require('../auth/auth.controller');

const AuthController = new authController();
const AuthValidation = require('../auth/auth.validation');

const UserController = require('./user.controller');

// Add new student (Admin only)
router.route('/addUser').post(
    AuthController.isAdmin,
    AuthValidation.addUserValidation,
    UserController.addUser
);

// Change password
router.route('/changePassword').put(
    AuthController.isUser,
    UserController.changePassword
);

// Update own profile
router.route('/updateProfile').put(
    AuthController.isUser,
    UserController.updateProfile
);

// Get own profile
router.route('/getProfile').get(
    AuthController.isUser,
    UserController.getProfile
);

// Get all mess users (Admin only)
router.route('/getUsers').get(
    AuthController.isAdmin,
    UserController.getUsers
);

// Edit student details (Admin only)
router.route('/updateStudent/:userId').put(
    AuthController.isAdmin,
    UserController.updateStudent
);

// Delete student (Admin only)
router.route('/removeUser/:userId').delete(
    AuthController.isAdmin,
    UserController.removeUser
);

module.exports = router;
