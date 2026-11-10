
const FeedbackModel = require('./feedback.model');
const UserModel = require('../user/user.model');

class FeedbackLib {
  static async getAllFeedback(messId) {
    const feedbacks = await FeedbackModel.find({ messId })
      .sort({ createdAt: -1 })
      .lean();

    const userIds = [...new Set(
      feedbacks.map((item) => String(item.userId))
    )];

    const users = await UserModel.find({
      _id: { $in: userIds },
    })
      .select('username email')
      .lean();

    const userMap = new Map(
      users.map((user) => [String(user._id), user])
    );

    return feedbacks.map((item) => {
      const user = userMap.get(String(item.userId));

      return {
        ...item,
        username: user?.username || 'Unknown Student',
        email: user?.email || '',
      };
    });
  }

  static async addFeedback(feedbackData) {
    return await FeedbackModel.create(feedbackData);
  }

  static async getUserFeedback(userId, messId) {
    return await FeedbackModel.find({
      userId,
      messId,
    }).sort({ createdAt: -1 });
  }

  static async updateFeedback(feedbackId, messId, updateData) {
    return await FeedbackModel.findOneAndUpdate(
      { _id: feedbackId, messId },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  static async deleteFeedback(feedbackId, messId) {
    return await FeedbackModel.findOneAndDelete({
      _id: feedbackId,
      messId,
    });
  }

  static async getFeedbackStats(messId) {
    const feedbacks = await FeedbackModel.find({ messId })
      .select('type status rating')
      .lean();

    const ratings = feedbacks
      .filter((item) => item.rating != null)
      .map((item) => item.rating);

    const averageRating = ratings.length
      ? Number(
          (
            ratings.reduce((sum, rating) => sum + rating, 0) /
            ratings.length
          ).toFixed(1)
        )
      : 0;

    return {
      total: feedbacks.length,
      complaints: feedbacks.filter(
        (item) => item.type === 'Complaint'
      ).length,
      feedback: feedbacks.filter(
        (item) => item.type === 'Feedback'
      ).length,
      pending: feedbacks.filter(
        (item) => item.status === 'Pending'
      ).length,
      inProgress: feedbacks.filter(
        (item) => item.status === 'In Progress'
      ).length,
      resolved: feedbacks.filter(
        (item) => item.status === 'Resolved'
      ).length,
      averageRating,
    };
  }
}

module.exports = FeedbackLib;
