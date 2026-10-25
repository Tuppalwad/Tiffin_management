/**
 * Notification Controller
 * Manages in-app notifications for both Owners and Customers.
 */

const { Notification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, getPagination, getPaginatedResponse } = require('../utils/helpers');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize);

    const notificationsData = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    const paginated = getPaginatedResponse(notificationsData, currentPage, size);

    return res.status(200).json(
      successResponse(
        {
          ...paginated,
          unreadCount,
        },
        'Notifications retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.is_read = true;
    await notification.save();

    return res.status(200).json(successResponse(notification, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );

    return res.status(200).json(successResponse(null, 'All notifications marked as read'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

