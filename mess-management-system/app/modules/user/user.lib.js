
const bcrypt = require('bcryptjs');

const saltRounds = 10;

const BalanceModule = require('../balance/index');

const { BalanceModel } = BalanceModule;
const ExpenseModel = require('../expense/expense.model');
const MealModel = require('../meal/meal.model');
const UserModel = require('./user.model');

const BRANCH_RULES = {
    'CSE-A': { code: '1', start: 1, end: 75 },
    'CSE-B': { code: '1', start: 76, end: 150 },
    ETC: { code: '2', start: 1, end: 75 },
    EEE: { code: '3', start: 1, end: 75 },
    IT: { code: '4', start: 1, end: 75 },
    CE: { code: '5', start: 1, end: 75 },
};

function validateStudentPlacement(department, rollNumber) {
    const rule = BRANCH_RULES[department];
    const match = /^B([1-5])(\d{5})$/.exec(rollNumber || '');
    if (!rule || !match) {
        return 'Department must be CSE-A, CSE-B, ETC, EEE, IT, or CE, and roll number must follow the Bx##### format';
    }
    const serial = Number(match[2]);
    if (match[1] !== rule.code || serial < rule.start || serial > rule.end) {
        return `Roll number ${rollNumber} is not valid for ${department}`;
    }
    return null;
}

class UserLib {
    static async getProfile(id) {
        try {
            return await UserModel.findById(id, { password: 0 });
        } catch (e) {
            throw e;
        }
    }

    static async updateProfile(id, updateObject) {
        try {
            return await UserModel.findByIdAndUpdate(
                id,
                updateObject,
                { new: true }
            );
        } catch (e) {
            throw e;
        }
    }

    static async changPassword(id, oldPassword, newPassword) {
        try {
            const user = await UserModel.findOne({ _id: id });

            if (user) {
                const isMatched = await bcrypt.compare(
                    oldPassword,
                    user.password
                );

                if (isMatched) {
                    const hashed = bcrypt.hashSync(
                        newPassword,
                        saltRounds
                    );

                    return {
                        success: true,
                        data: await UserModel.findOneAndUpdate(
                            { _id: id },
                            { $set: { password: hashed } },
                            { new: true }
                        ),
                    };
                }

                return {
                    success: false,
                    message: 'Password not matched',
                };
            }

            return {
                success: false,
                message: 'User not found',
            };
        } catch (e) {
            throw e;
        }
    }

    static async getUsers(messId) {
        try {
            return await UserModel.find(
                { messId },
                { password: 0 }
            );
        } catch (e) {
            throw e;
        }
    }

    // Admin can edit students belonging to their own mess only
    static async updateStudent(userId, messId, studentData) {
        try {
            const allowedFields = [
                'username',
                'email',
                'phone',
                'rollNumber',
                'department',
                'hostel',
                'roomNumber',
            ];

            const updates = {};

            for (const field of allowedFields) {
                if (Object.prototype.hasOwnProperty.call(studentData, field)) {
                    if (
                        typeof studentData[field] !== 'string' ||
                        !studentData[field].trim()
                    ) {
                        return {
                            success: false,
                            status: 400,
                            message: `${field} must be a non-empty string`,
                        };
                    }

                    updates[field] = studentData[field].trim();
                }
            }

            if (Object.keys(updates).length === 0) {
                return {
                    success: false,
                    status: 400,
                    message: 'No valid student fields provided',
                };
            }

            if (updates.department || updates.rollNumber) {
                const currentStudent = await UserModel.findOne({ _id: userId, messId, role: 'user' });
                if (!currentStudent) {
                    return { success: false, status: 404, message: 'Student not found in your mess' };
                }
                const placementError = validateStudentPlacement(
                    updates.department || currentStudent.department,
                    updates.rollNumber || currentStudent.rollNumber
                );
                if (placementError) return { success: false, status: 400, message: placementError };
            }

            if (updates.email) {
                updates.email = updates.email.toLowerCase();

                const existingUser = await UserModel.findOne({
                    email: updates.email,
                    _id: { $ne: userId },
                });

                if (existingUser) {
                    return {
                        success: false,
                        status: 409,
                        message: 'Email already exists',
                    };
                }
            }

            const updatedStudent = await UserModel.findOneAndUpdate(
                {
                    _id: userId,
                    messId,
                    role: 'user',
                },
                { $set: updates },
                {
                    new: true,
                    runValidators: true,
                    projection: { password: 0 },
                }
            );

            if (!updatedStudent) {
                return {
                    success: false,
                    status: 404,
                    message: 'Student not found in your mess',
                };
            }

            return {
                success: true,
                data: updatedStudent,
            };
        } catch (e) {
            if (e.code === 11000 || e.code === 'SQLITE_CONSTRAINT_UNIQUE' || e.code === 'SQLITE_CONSTRAINT' || (e.message && e.message.includes('UNIQUE'))) {
                return {
                    success: false,
                    status: 409,
                    message: 'Email already exists',
                };
            }

            throw e;
        }
    }

    // Securely remove only students belonging to the admin's mess
    static async removeUser(userId, messId) {
        try {
            const user = await UserModel.findOne({
                _id: userId,
                messId,
                role: 'user',
            });

            if (!user) {
                return {
                    success: false,
                    message: 'Student not found in your mess',
                };
            }

            await UserModel.deleteOne({
                _id: userId,
                messId,
                role: 'user',
            });

            await BalanceModel.deleteMany({ userId, messId });
            await ExpenseModel.deleteMany({ userId, messId });
            await MealModel.deleteMany({ userId, messId });

            return {
                success: true,
                message: 'Student removed successfully',
            };
        } catch (e) {
            throw e;
        }
    }

    static async addUser(user) {
        try {
            const placementError = validateStudentPlacement(user.department, user.rollNumber);
            if (placementError) return { success: false, message: placementError };

            const existingRoll = await UserModel.findOne({ rollNumber: user.rollNumber });
            if (existingRoll) return { success: false, message: 'Roll number already exists' };

            const branchCount = await UserModel.countDocuments({ department: user.department, role: 'user' });
            if (branchCount >= 75) return { success: false, message: `${user.department} already has the maximum of 75 students` };

            user.password = bcrypt.hashSync(
                user.password,
                saltRounds
            );

            user.role = 'user';

            const found = await UserModel.findOne({
                email: user.email,
            });

            if (found) {
                return {
                    success: false,
                    message: 'Email already exist',
                };
            }

            return {
                success: true,
                data: await UserModel.create(user),
            };
        } catch (e) {
            throw e;
        }
    }
}

module.exports = UserLib;
