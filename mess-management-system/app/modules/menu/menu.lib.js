
const MenuModel = require('./menu.model');

class MenuLib {

    // Get weekly menu in Monday-to-Sunday order
    static async getWeeklyMenu(messId) {
        const dayOrder = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
        ];

        const menus = await MenuModel.find({ messId }).lean();

        return menus.sort(
            (a, b) =>
                dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
        );
    }

    // Add a new day's menu
    static async addMenu(messId, adminId, menuData) {
        const existingMenu = await MenuModel.findOne({
            messId,
            day: menuData.day
        });

        if (existingMenu) {
            return {
                success: false,
                status: 409,
                message: `Menu for ${menuData.day} already exists. Please edit it instead.`
            };
        }

        try {
            const menu = await MenuModel.create({
                messId,
                day: menuData.day,
                breakfast: menuData.breakfast,
                lunch: menuData.lunch,
                snacks: menuData.snacks,
                dinner: menuData.dinner,
                specialNote: menuData.specialNote || '',
                isSpecialDay: menuData.isSpecialDay || false,
                updatedBy: adminId
            });

            return {
                success: true,
                data: menu
            };
        } catch (error) {
            if (error.code === 11000 || error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT' || (error.message && error.message.includes('UNIQUE'))) {
                return {
                    success: false,
                    status: 409,
                    message: 'Menu for this day already exists'
                };
            }

            throw error;
        }
    }

    // Update a day's menu belonging to this mess
    static async updateMenu(messId, menuId, adminId, menuData) {
        const allowedFields = [
            'breakfast',
            'lunch',
            'snacks',
            'dinner',
            'specialNote',
            'isSpecialDay'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(menuData, field)) {
                updates[field] = menuData[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return {
                success: false,
                status: 400,
                message: 'No valid menu fields provided'
            };
        }

        updates.updatedBy = adminId;

        const updatedMenu = await MenuModel.findOneAndUpdate(
            {
                _id: menuId,
                messId
            },
            {
                $set: updates
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedMenu) {
            return {
                success: false,
                status: 404,
                message: 'Menu not found in your mess'
            };
        }

        return {
            success: true,
            data: updatedMenu
        };
    }

    // Delete a day's menu belonging to this mess
    static async deleteMenu(messId, menuId) {
        const deletedMenu = await MenuModel.findOneAndDelete({
            _id: menuId,
            messId
        });

        if (!deletedMenu) {
            return {
                success: false,
                status: 404,
                message: 'Menu not found in your mess'
            };
        }

        return {
            success: true,
            message: `${deletedMenu.day} menu deleted successfully`
        };
    }
}

module.exports = MenuLib;
