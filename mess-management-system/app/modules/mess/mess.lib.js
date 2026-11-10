const BalanceLib = require('../balance/balance.lib');
const MealLib = require('../meal/meal.lib');
const ExpenseLib = require('../expense/expense.lib');

class MessLib {
    static async userSummary(currentMonthFirstDate, currentMonthLastDate, userId, messId) {
        try {
            const totalSavings = await BalanceLib.userMealBalance(currentMonthFirstDate, currentMonthLastDate, userId, messId);
            const meal = await MealLib.userWiseMeal(currentMonthFirstDate, currentMonthLastDate, userId);
            const mealRate = await MealLib.mealRateInMonth(currentMonthFirstDate, currentMonthLastDate, messId);
            const safeRate = Number.isFinite(mealRate) ? mealRate : 0;
            const userMeals = meal?.meals || 0;
            const totalExpense = safeRate * userMeals;
            const balanceStatus = (totalSavings?.total || 0) - totalExpense;
            return {
                totalSavings: totalSavings?.total || 0,
                totalExpense: totalExpense.toFixed(2),
                balanceStatus: balanceStatus.toFixed(2),
                meals: userMeals,
            };
        } catch (e) {
            throw e;
        }
    }

    static async messSummary(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const totalSavings = await BalanceLib.totalMealBalance(currentMonthFirstDate, currentMonthLastDate, messId);
            const totalExpense = await ExpenseLib.totalMealExpense(currentMonthFirstDate, currentMonthLastDate, messId);
            const totalMeals = await MealLib.totalMealInMonth(currentMonthFirstDate, currentMonthLastDate, messId);
            const mealRate = await MealLib.mealRateInMonth(currentMonthFirstDate, currentMonthLastDate, messId);
            const safeRate = Number.isFinite(mealRate) ? mealRate : 0;
            const balanceStatus = (totalSavings?.total || 0) - (totalExpense?.total || 0);
            return {
                totalSavings: totalSavings?.total || 0,
                totalExpense: totalExpense?.total || 0,
                balanceStatus: balanceStatus.toFixed(2),
                totalMeals: totalMeals?.meals || 0,
                mealRate: safeRate.toFixed(2),
            };
        } catch (e) {
            throw e;
        }
    }
}
module.exports = MessLib;
