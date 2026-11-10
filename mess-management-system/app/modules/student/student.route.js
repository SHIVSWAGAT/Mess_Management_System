
const express = require('express');

const router = express.Router();

const UserModel = require('../user/user.model');
const MealModel = require('../meal/meal.model');
const BalanceModel = require('../balance/balance.model');
const FeedbackModel = require('../feedback/feedback.model');

const response = require('../../../helper/response');

// Only authenticated students can access these routes.
// Global authentication middleware runs before this router.
router.use((req, res, next) => {
    if (!req.auth || req.auth.role !== 'user') {
        return res.status(403).json(
            response.error(false, 'Student access only')
        );
    }

    next();
});

// GET /api/v1/student/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.auth.id;
        const messId = req.auth.messId;

        const student = await UserModel.findOne({
            _id: userId,
            messId,
            role: 'user'
        }).select('-password');

        if (!student) {
            return res.status(404).json(
                response.error(false, 'Student not found')
            );
        }

        const [meals, payments, complaints] = await Promise.all([
            MealModel.find({ userId, messId }).sort({ date: -1 }),
            BalanceModel.find({ userId, messId }).sort({ date: -1 }),
            FeedbackModel.find({ userId, messId }).sort({
                createdAt: -1
            })
        ]);

        const totalMeals = meals.reduce(
            (sum, item) => sum + Number(item.numberOfMeal || 0),
            0
        );

        const totalPayments = payments.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

        const pendingComplaints = complaints.filter(
            item =>
                item.type === 'Complaint' &&
                item.status !== 'Resolved'
        ).length;

        return res.json(
            response.single(true, 'Student dashboard loaded', {
                student,
                totalMeals,
                totalPayments,
                pendingComplaints
            })
        );
    } catch (error) {
        return res.status(500).json(
            response.error(
                false,
                'Failed to load dashboard',
                error.message
            )
        );
    }
});

// GET /api/v1/student/meals
router.get('/meals', async (req, res) => {
    try {
        const meals = await MealModel.find({
            userId: req.auth.id,
            messId: req.auth.messId
        }).sort({ date: -1 });

        return res.json(
            response.single(true, 'Student meals loaded', meals)
        );
    } catch (error) {
        return res.status(500).json(
            response.error(
                false,
                'Failed to load meals',
                error.message
            )
        );
    }
});

// GET /api/v1/student/payments
router.get('/payments', async (req, res) => {
    try {
        const payments = await BalanceModel.find({
            userId: req.auth.id,
            messId: req.auth.messId
        }).sort({ date: -1 });

        return res.json(
            response.single(true, 'Student payments loaded', payments)
        );
    } catch (error) {
        return res.status(500).json(
            response.error(
                false,
                'Failed to load payments',
                error.message
            )
        );
    }
});

// GET /api/v1/student/complaints
router.get('/complaints', async (req, res) => {
    try {
        const complaints = await FeedbackModel.find({
            userId: req.auth.id,
            messId: req.auth.messId
        }).sort({ createdAt: -1 });

        return res.json(
            response.single(true, 'Student complaints loaded', complaints)
        );
    } catch (error) {
        return res.status(500).json(
            response.error(
                false,
                'Failed to load complaints',
                error.message
            )
        );
    }
});

// GET /api/v1/student/profile
router.get('/profile', async (req, res) => {
    try {
        const student = await UserModel.findOne({
            _id: req.auth.id,
            messId: req.auth.messId,
            role: 'user'
        }).select('-password');

        if (!student) {
            return res.status(404).json(
                response.error(false, 'Student not found')
            );
        }

        return res.json(
            response.single(true, 'Student profile loaded', student)
        );
    } catch (error) {
        return res.status(500).json(
            response.error(
                false,
                'Failed to load profile',
                error.message
            )
        );
    }
});

module.exports = router;
