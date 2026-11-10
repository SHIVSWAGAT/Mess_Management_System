const MealModel = require('./meal.model');
const UserModel = require('../user/user.model');
const ExpenseLib = require('../expense/expense.lib');

class MealLib {
    static async addMeal(mealObject) {
        try {
            return await MealModel.create(mealObject);
        } catch (e) {
            throw e;
        }
    }

    static async updateMeal(mealId, updateObj) {
        try {
            return await MealModel.findByIdAndUpdate({ _id: mealId }, updateObj, { new: true });
        } catch (e) {
            throw e;
        }
    }

    static async deleteMeal(mealId) {
        try {
            return await MealModel.findByIdAndRemove(mealId);
        } catch (e) {
            throw e;
        }
    }

    static async totalMealInMonth(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const data = await MealModel.find(
                {
                    messId,
                    date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
                },
            );

            if (data.length) {
                const mealDetails = await Promise.all(data.map(async (item) => {
                    const usr = await UserModel.findById(item.userId);
                    return {
                        username: usr ? usr.username : 'Unknown User',
                        ...item.toObject(),
                    };
                }));

                const MealArr = data.map(item => item.numberOfMeal);
                const meals = MealArr.reduce((sum, meal) => sum + meal, 0);
                return { data: mealDetails, meals };
            } return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }


    static async totalMeal(currentMonth, currentMonthLastDate, messId) {
        try {
            const data = await MealModel.find(
                {
                    messId,
                    date: { $gte: currentMonth, $lte: currentMonthLastDate },
                },
            );

            if (data.length) {
                const mealDetails = await Promise.all(data.map(async (item) => {
                    const usr = await UserModel.findById(item.userId);
                    return {
                        username: usr ? usr.username : 'Unknown User',
                        ...item.toObject(),
                    };
                }));
                const MealArr = data.map(item => item.numberOfMeal);
                const result = MealArr.reduce((sum, meal) => sum + meal, 0);
                return { data: mealDetails, meals: result };
            }
            return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }


    static async currentMeal(currentMonth, currentMonthLastDate, messId) {
        try {
            const data = await MealModel.find(
                {
                    messId,
                    date: { $gte: currentMonth, $lte: currentMonthLastDate },
                },
            );
            if (data.length) {
                const mealDetails = await Promise.all(data.map(async (item) => {
                    const usr = await UserModel.findById(item.userId);
                    return {
                        username: usr ? usr.username : 'Unknown User',
                        ...item.toObject(),
                    };
                }));

                const MealArr = data.map(item => item.numberOfMeal);
                const result = MealArr.reduce((sum, meal) => sum + meal, 0);
                return { data: mealDetails, meals: result };
            }
            return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async userWiseMeal(currentMonthFirstDate, currentMonthLastDate, userId) {
        try {
            const data = await MealModel.find({
                userId,
                date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
            });

            if (data.length) {
                const MealArr = data.map(item => item.numberOfMeal);
                const result = MealArr.reduce((sum, meal) => sum + meal, 0);
                return { data, meals: result };
            }
            return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }


    static async mealRateInMonth(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            return await Promise.all(
                [
                    ExpenseLib.totalMealExpense(currentMonthFirstDate, currentMonthLastDate, messId),
                    MealLib.totalMealInMonth(currentMonthFirstDate, currentMonthLastDate, messId),
                ],
            ).then(result => {
                const meals = result[1]?.meals;
                if (!meals || meals === 0) return 0;
                return (result[0]?.total || 0) / meals;
            });
        } catch (e) {
            throw e;
        }
    }


    static async mealRate(messId) {
        try {
            return await Promise.all(
                [
                    ExpenseLib.totalMessExpense(messId),
                    MealLib.totalMeal(messId),
                ],
            ).then(result => {
                const meals = typeof result[1] === 'object' ? result[1]?.meals : result[1];
                if (!meals || meals === 0) return 0;
                return (result[0]?.total || 0) / meals;
            });
        } catch (e) {
            throw e;
        }
    }
}


module.exports = MealLib;
