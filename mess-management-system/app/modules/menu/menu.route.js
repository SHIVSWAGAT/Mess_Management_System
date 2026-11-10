
const express = require('express');

const router = express.Router();

const authController = require('../auth/auth.controller');
const AuthController = new authController();

const MenuController = require('./menu.controller');

/**
 * Mess Menu Management Routes
 */

// Get complete weekly menu (Admin + Student)
router.route('/weekly').get(
    AuthController.isUser,
    MenuController.getWeeklyMenu
);

// Add new daily menu (Admin only)
router.route('/add').post(
    AuthController.isAdmin,
    MenuController.addMenu
);

// Update existing daily menu (Admin only)
router.route('/update/:menuId').put(
    AuthController.isAdmin,
    MenuController.updateMenu
);

// Delete daily menu (Admin only)
router.route('/delete/:menuId').delete(
    AuthController.isAdmin,
    MenuController.deleteMenu
);

module.exports = router;
