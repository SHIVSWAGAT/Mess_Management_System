
const { validId } = require('../../database/sqlite');
const response = require('../../../helper/response');
const UserLib = require('./user.lib');

class UserController {

    // Add new student
    static async addUser(req, res) {
        try {
            const user = { ...req.body, messId: req.auth.messId };

            const userData = await UserLib.addUser(user);

            if (userData.success) {
                const newUser = userData.data.toObject();
                delete newUser.password;

                return res.status(201).json(
                    response.single(true, 'New User Created', newUser)
                );
            }

            return res.status(400).json(
                response.error(false, userData.message)
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }

    // Change own password
    static async changePassword(req, res) {
        try {
            const { id } = req.auth;
            const { oldPassword, newPassword } = req.body;

            const user = await UserLib.changPassword(
                id,
                oldPassword,
                newPassword
            );

            if (user.success) {
                return res.status(200).json(
                    response.single(
                        true,
                        'Password changed successfully',
                        'Password updated'
                    )
                );
            }

            return res.status(400).json(
                response.error(false, user.message)
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }

    // Update own profile
    static async updateProfile(req, res) {
        try {
            const data = await UserLib.updateProfile(
                req.auth.id,
                req.body
            );

            return res.status(200).json(
                response.single(true, 'Profile updated successfully', data)
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }

    // Get own profile
    static async getProfile(req, res) {
        try {
            const { id } = req.auth;
            const data = await UserLib.getProfile(id);

            return res.status(200).json(
                response.single(true, `Welcome ${data.username}`, data)
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }

    // Get all users from current mess
    static async getUsers(req, res) {
        try {
            const { messId } = req.auth;
            const users = await UserLib.getUsers(messId);

            return res.status(200).json(
                response.single(true, 'Mess users', users)
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }

    // Edit student details (Admin only)
    static async updateStudent(req, res) {
        try {
            const { userId } = req.params;
            const { messId } = req.auth;

            if (!validId(userId)) {
                return res.status(400).json(
                    response.error(false, 'Invalid student ID')
                );
            }

            const result = await UserLib.updateStudent(
                userId,
                messId,
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
                    'Student updated successfully',
                    result.data
                )
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'Unable to update student', `${e}`)
            );
        }
    }

    // Delete student (Admin only)
    static async removeUser(req, res) {
        try {
            const { userId } = req.params;
            const { messId } = req.auth;

            if (!validId(userId)) {
                return res.status(400).json(
                    response.error(false, 'Invalid student ID')
                );
            }

            const result = await UserLib.removeUser(userId, messId);

            if (!result.success) {
                return res.status(404).json(
                    response.error(false, result.message)
                );
            }

            return res.status(200).json(
                response.single(
                    true,
                    'Student removed successfully',
                    result.message
                )
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }
}

module.exports = UserController;
