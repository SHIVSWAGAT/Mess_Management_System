
const express = require('express');

const router = express.Router();

const AuthController = require('../auth/auth.controller');
const authController = new AuthController();

const FeedbackController = require('./feedback.controller');

// Admin: Get all feedback and complaints
router
  .route('/all')
  .get(
    authController.isAdmin,
    FeedbackController.getAllFeedback
  );

// Admin: Feedback statistics
router
  .route('/stats')
  .get(
    authController.isAdmin,
    FeedbackController.getFeedbackStats
  );

// Admin or Student: Submit feedback
router
  .route('/add')
  .post(
    authController.isUser,
    FeedbackController.addFeedback
  );

// Student: View own feedback
router
  .route('/my')
  .get(
    authController.isUser,
    FeedbackController.getUserFeedback
  );

// Admin: Update complaint status / response
router
  .route('/update/:feedbackId')
  .put(
    authController.isAdmin,
    FeedbackController.updateFeedback
  );

// Admin: Delete feedback
router
  .route('/delete/:feedbackId')
  .delete(
    authController.isAdmin,
    FeedbackController.deleteFeedback
  );

module.exports = router;
