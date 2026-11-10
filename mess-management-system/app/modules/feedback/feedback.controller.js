
const { validId } = require('../../database/sqlite');
const FeedbackLib = require('./feedback.lib');

class FeedbackController {
  static async getAllFeedback(req, res) {
    try {
      const feedbacks = await FeedbackLib.getAllFeedback(
        req.auth.messId
      );

      return res.status(200).json({
        success: true,
        message: 'Feedback records fetched successfully',
        data: feedbacks,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async addFeedback(req, res) {
    try {
      const {
        userId,
        type,
        category,
        subject,
        description,
        rating,
      } = req.body;

      if (!type || !category || !subject || !description) {
        return res.status(400).json({
          success: false,
          message: 'Please fill all required fields',
        });
      }

      const targetUserId =
        req.auth.role === 'admin' && userId
          ? userId
          : req.auth.id;

      if (!validId(targetUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID',
        });
      }

      const UserModel = require('../user/user.model');

      const student = await UserModel.findOne({
        _id: targetUserId,
        messId: req.auth.messId,
        role: 'user',
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found in this mess',
        });
      }

      const feedback = await FeedbackLib.addFeedback({
        userId: targetUserId,
        messId: req.auth.messId,
        type,
        category,
        subject,
        description,
        rating: rating === '' || rating == null
          ? null
          : Number(rating),
      });

      return res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: feedback,
      });
    } catch (error) {
      return res.status(
        error.name === 'ValidationError' ? 400 : 500
      ).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getUserFeedback(req, res) {
    try {
      const feedbacks = await FeedbackLib.getUserFeedback(
        req.auth.id,
        req.auth.messId
      );

      return res.status(200).json({
        success: true,
        message: 'Your feedback records',
        data: feedbacks,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateFeedback(req, res) {
    try {
      const { feedbackId } = req.params;

      if (!validId(feedbackId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid feedback ID',
        });
      }

      const { status, adminResponse } = req.body;

      const updateData = {};

      if (status !== undefined) {
        updateData.status = status;
      }

      if (adminResponse !== undefined) {
        updateData.adminResponse = adminResponse;
      }

      if (!Object.keys(updateData).length) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update',
        });
      }

      const feedback = await FeedbackLib.updateFeedback(
        feedbackId,
        req.auth.messId,
        updateData
      );

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Feedback updated successfully',
        data: feedback,
      });
    } catch (error) {
      return res.status(
        error.name === 'ValidationError' ? 400 : 500
      ).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteFeedback(req, res) {
    try {
      const { feedbackId } = req.params;

      if (!validId(feedbackId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid feedback ID',
        });
      }

      const feedback = await FeedbackLib.deleteFeedback(
        feedbackId,
        req.auth.messId
      );

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Feedback deleted successfully',
        data: feedback,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getFeedbackStats(req, res) {
    try {
      const stats = await FeedbackLib.getFeedbackStats(
        req.auth.messId
      );

      return res.status(200).json({
        success: true,
        message: 'Feedback statistics fetched successfully',
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = FeedbackController;
