
const { validId } = require('../../database/sqlite');
const response = require('../../../helper/response');
const MenuLib = require('./menu.lib');

class MenuController {

    // Get complete weekly menu
    static async getWeeklyMenu(req, res) {
        try {
            const { messId } = req.auth;

            const menus = await MenuLib.getWeeklyMenu(messId);

            return res.status(200).json(
                response.single(
                    true,
                    'Weekly menu fetched successfully',
                    menus
                )
            );
        } catch (error) {
            return res.status(500).json(
                response.error(false, 'Unable to fetch weekly menu')
            );
        }
    }

    // Add a new daily menu
    static async addMenu(req, res) {
        try {
            const { messId, id: adminId } = req.auth;

            const result = await MenuLib.addMenu(
                messId,
                adminId,
                req.body
            );

            if (!result.success) {
                return res.status(result.status || 400).json(
                    response.error(false, result.message)
                );
            }

            return res.status(201).json(
                response.single(
                    true,
                    'Menu added successfully',
                    result.data
                )
            );
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json(
                    response.error(false, error.message)
                );
            }

            return res.status(500).json(
                response.error(false, 'Unable to add menu')
            );
        }
    }

    // Update an existing daily menu
    static async updateMenu(req, res) {
        try {
            const { menuId } = req.params;
            const { messId, id: adminId } = req.auth;

            if (!validId(menuId)) {
                return res.status(400).json(
                    response.error(false, 'Invalid menu ID')
                );
            }

            const result = await MenuLib.updateMenu(
                messId,
                menuId,
                adminId,
                req.body
            );

            if (!result.success) {
                return res.status(result.status || 400).json(
                    response.error(false, result.message)
                );
            }

            return res.status(200).json(
                response.single(
                    true,
                    'Menu updated successfully',
                    result.data
                )
            );
        } catch (error) {
            if (error.name === 'ValidationError' ||
                error.name === 'CastError') {
                return res.status(400).json(
                    response.error(false, error.message)
                );
            }

            return res.status(500).json(
                response.error(false, 'Unable to update menu')
            );
        }
    }

    // Delete an existing daily menu
    static async deleteMenu(req, res) {
        try {
            const { menuId } = req.params;
            const { messId } = req.auth;

            if (!validId(menuId)) {
                return res.status(400).json(
                    response.error(false, 'Invalid menu ID')
                );
            }

            const result = await MenuLib.deleteMenu(
                messId,
                menuId
            );

            if (!result.success) {
                return res.status(result.status || 404).json(
                    response.error(false, result.message)
                );
            }

            return res.status(200).json(
                response.single(
                    true,
                    result.message,
                    null
                )
            );
        } catch (error) {
            return res.status(500).json(
                response.error(false, 'Unable to delete menu')
            );
        }
    }
}

module.exports = MenuController;
