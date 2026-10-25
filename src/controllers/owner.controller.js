/**
 * Owner Controller
 * Handles Owner business profile, dashboard statistics, menu management,
 * subscription plans, customer orders, subscriptions, payments, and service calendar.
 */

const { Op } = require('sequelize');
const {
  User,
  OwnerProfile,
  CustomerProfile,
  MenuItem,
  SubscriptionPlan,
  PlanItem,
  Subscription,
  Order,
  OrderItem,
  Payment,
  SkipRequest,
  Notification,
  ServiceCalendar,
  sequelize,
} = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, getPagination, getPaginatedResponse } = require('../utils/helpers');

// ============================================================
// 1. Owner Profile
// ============================================================

const getOwnerProfile = async (req, res, next) => {
  try {
    const profile = await OwnerProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'email'] }],
    });

    if (!profile) {
      throw new AppError('Owner profile not found', 404);
    }

    return res.status(200).json(successResponse(profile, 'Owner profile retrieved'));
  } catch (error) {
    next(error);
  }
};

const updateOwnerProfile = async (req, res, next) => {
  try {
    const {
      business_name,
      description,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      service_radius_km,
      delivery_available,
      pickup_available,
      profile_image,
      opening_time,
      closing_time,
      owner_name,
    } = req.body;

    let profile = await OwnerProfile.findOne({ where: { user_id: req.user.id } });

    if (!profile) {
      profile = await OwnerProfile.create({
        user_id: req.user.id,
        business_name: business_name || 'My Tiffin Service',
      });
    }

    if (business_name !== undefined) profile.business_name = business_name;
    if (description !== undefined) profile.description = description;
    if (address !== undefined) profile.address = address;
    if (city !== undefined) profile.city = city;
    if (state !== undefined) profile.state = state;
    if (pincode !== undefined) profile.pincode = pincode;
    if (latitude !== undefined) profile.latitude = latitude;
    if (longitude !== undefined) profile.longitude = longitude;
    if (service_radius_km !== undefined) profile.service_radius_km = service_radius_km;
    if (delivery_available !== undefined) profile.delivery_available = delivery_available;
    if (pickup_available !== undefined) profile.pickup_available = pickup_available;
    if (profile_image !== undefined) profile.profile_image = profile_image;
    if (opening_time !== undefined) profile.opening_time = opening_time;
    if (closing_time !== undefined) profile.closing_time = closing_time;

    await profile.save();

    if (owner_name) {
      await User.update({ name: owner_name }, { where: { id: req.user.id } });
    }

    const updated = await OwnerProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'email'] }],
    });

    return res.status(200).json(successResponse(updated, 'Owner profile updated'));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 2. Owner Dashboard
// ============================================================

const getDashboardStats = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Active subscribers count
    const activeSubscribers = await Subscription.count({
      where: { owner_id: ownerId, status: 'active' },
    });

    // Today's total orders
    const todayOrders = await Order.count({
      where: { owner_id: ownerId, order_date: today },
    });

    // Today's completed orders
    const todayCompletedOrders = await Order.count({
      where: { owner_id: ownerId, order_date: today, order_status: 'delivered' },
    });

    // Today's cancelled orders
    const todayCancelledOrders = await Order.count({
      where: { owner_id: ownerId, order_date: today, order_status: 'cancelled' },
    });

    // Today's skipped tiffins
    const todaySkippedTiffins = await SkipRequest.count({
      where: { owner_id: ownerId, skip_date: today, status: 'approved' },
    });

    // Today's total earnings (delivered orders + payments received today)
    const todayPayments = await Payment.findAll({
      where: { owner_id: ownerId, payment_date: today, payment_status: 'paid' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const todayEarnings = parseFloat(todayPayments[0]?.getDataValue('total') || 0);

    // Total collections (all paid payments)
    const totalCollectedResult = await Payment.findAll({
      where: { owner_id: ownerId, payment_status: 'paid' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const totalCollected = parseFloat(totalCollectedResult[0]?.getDataValue('total') || 0);

    // Total pending payments
    const pendingPaymentsResult = await Payment.findAll({
      where: { owner_id: ownerId, payment_status: 'pending' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const totalPending = parseFloat(pendingPaymentsResult[0]?.getDataValue('total') || 0);

    // Monthly revenue (first day of current month to now)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthlyRevenueResult = await Payment.findAll({
      where: {
        owner_id: ownerId,
        payment_status: 'paid',
        payment_date: { [Op.gte]: startOfMonth },
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const monthlyRevenue = parseFloat(monthlyRevenueResult[0]?.getDataValue('total') || 0);

    // New subscriptions in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newSubscriptions = await Subscription.count({
      where: {
        owner_id: ownerId,
        start_date: { [Op.gte]: sevenDaysAgo },
      },
    });

    // Upcoming renewals (ending in next 5 days)
    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const upcomingRenewals = await Subscription.count({
      where: {
        owner_id: ownerId,
        status: 'active',
        end_date: { [Op.between]: [today, fiveDaysLater] },
      },
    });

    return res.status(200).json(
      successResponse(
        {
          activeSubscribers,
          todayOrders,
          todayCompletedOrders,
          todayCancelledOrders,
          todaySkippedTiffins,
          todayEarnings,
          totalCollected,
          totalPending,
          monthlyRevenue,
          newSubscriptions,
          upcomingRenewals,
        },
        'Dashboard statistics retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 3. Menu Items Management
// ============================================================

const getMenuItems = async (req, res, next) => {
  try {
    const { category, is_available, meal_type, search } = req.query;
    const where = { owner_id: req.user.id, is_active: true };

    if (category) where.category = category;
    if (is_available !== undefined) where.is_available = is_available === 'true';
    if (meal_type) where.meal_type = meal_type;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const items = await MenuItem.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json(successResponse(items, 'Menu items retrieved'));
  } catch (error) {
    next(error);
  }
};

const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      where: { id: req.params.id, owner_id: req.user.id, is_active: true },
    });

    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    return res.status(200).json(successResponse(item, 'Menu item retrieved'));
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      image_url,
      category,
      price,
      is_available = true,
      meal_type = 'lunch',
      serving_size,
      delivery_available = true,
      pickup_available = true,
    } = req.body;

    if (!name || price === undefined) {
      throw new AppError('Item name and price are required', 400);
    }

    const item = await MenuItem.create({
      owner_id: req.user.id,
      name,
      description,
      image_url,
      category: category || 'Full Tiffin',
      price,
      is_available,
      meal_type,
      serving_size,
      delivery_available,
      pickup_available,
    });

    return res.status(201).json(successResponse(item, 'Menu item created successfully', 201));
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      where: { id: req.params.id, owner_id: req.user.id, is_active: true },
    });

    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    const {
      name,
      description,
      image_url,
      category,
      price,
      is_available,
      meal_type,
      serving_size,
      delivery_available,
      pickup_available,
    } = req.body;

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (image_url !== undefined) item.image_url = image_url;
    if (category !== undefined) item.category = category;
    if (price !== undefined) item.price = price;
    if (is_available !== undefined) item.is_available = is_available;
    if (meal_type !== undefined) item.meal_type = meal_type;
    if (serving_size !== undefined) item.serving_size = serving_size;
    if (delivery_available !== undefined) item.delivery_available = delivery_available;
    if (pickup_available !== undefined) item.pickup_available = pickup_available;

    await item.save();

    return res.status(200).json(successResponse(item, 'Menu item updated successfully'));
  } catch (error) {
    next(error);
  }
};

const toggleMenuItemAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      where: { id: req.params.id, owner_id: req.user.id, is_active: true },
    });

    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    item.is_available = !item.is_available;
    await item.save();

    return res.status(200).json(
      successResponse(item, `Item availability marked as ${item.is_available ? 'available' : 'unavailable'}`)
    );
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      where: { id: req.params.id, owner_id: req.user.id, is_active: true },
    });

    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    item.is_active = false;
    await item.save();

    return res.status(200).json(successResponse(null, 'Menu item deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 4. Subscription Plans Management
// ============================================================

const getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { owner_id: req.user.id, is_active: true },
      include: [
        {
          model: PlanItem,
          as: 'planItems',
          include: [{ model: MenuItem, as: 'menuItem' }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json(successResponse(plans, 'Subscription plans retrieved'));
  } catch (error) {
    next(error);
  }
};

const createSubscriptionPlan = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      description,
      plan_type = 'monthly',
      price,
      duration_days = 30,
      meals_per_day = 1,
      delivery_charges = 0,
      is_available = true,
      items = [], // array of { menu_item_id, quantity }
    } = req.body;

    if (!name || price === undefined) {
      throw new AppError('Plan name and price are required', 400);
    }

    const plan = await SubscriptionPlan.create(
      {
        owner_id: req.user.id,
        name,
        description,
        plan_type,
        price,
        duration_days,
        meals_per_day,
        delivery_charges,
        is_available,
      },
      { transaction: t }
    );

    if (items.length > 0) {
      const planItemsData = items.map((i) => ({
        plan_id: plan.id,
        menu_item_id: i.menu_item_id,
        quantity: i.quantity || 1,
      }));
      await PlanItem.bulkCreate(planItemsData, { transaction: t });
    }

    await t.commit();

    const createdPlan = await SubscriptionPlan.findByPk(plan.id, {
      include: [
        {
          model: PlanItem,
          as: 'planItems',
          include: [{ model: MenuItem, as: 'menuItem' }],
        },
      ],
    });

    return res.status(201).json(successResponse(createdPlan, 'Subscription plan created', 201));
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updateSubscriptionPlan = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const plan = await SubscriptionPlan.findOne({
      where: { id: req.params.id, owner_id: req.user.id, is_active: true },
    });

    if (!plan) {
      throw new AppError('Subscription plan not found', 404);
    }

    const {
      name,
      description,
      plan_type,
      price,
      duration_days,
      meals_per_day,
      delivery_charges,
      is_available,
      items,
    } = req.body;

    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (plan_type !== undefined) plan.plan_type = plan_type;
    if (price !== undefined) plan.price = price;
    if (duration_days !== undefined) plan.duration_days = duration_days;
    if (meals_per_day !== undefined) plan.meals_per_day = meals_per_day;
    if (delivery_charges !== undefined) plan.delivery_charges = delivery_charges;
    if (is_available !== undefined) plan.is_available = is_available;

    await plan.save({ transaction: t });

    if (items && Array.isArray(items)) {
      await PlanItem.destroy({ where: { plan_id: plan.id }, transaction: t });
      const planItemsData = items.map((i) => ({
        plan_id: plan.id,
        menu_item_id: i.menu_item_id,
        quantity: i.quantity || 1,
      }));
      await PlanItem.bulkCreate(planItemsData, { transaction: t });
    }

    await t.commit();

    const updatedPlan = await SubscriptionPlan.findByPk(plan.id, {
      include: [
        {
          model: PlanItem,
          as: 'planItems',
          include: [{ model: MenuItem, as: 'menuItem' }],
        },
      ],
    });

    return res.status(200).json(successResponse(updatedPlan, 'Subscription plan updated'));
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const deleteSubscriptionPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findOne({
      where: { id: req.params.id, owner_id: req.user.id, is_active: true },
    });

    if (!plan) {
      throw new AppError('Subscription plan not found', 404);
    }

    plan.is_active = false;
    await plan.save();

    return res.status(200).json(successResponse(null, 'Subscription plan deleted'));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 5. Orders Management
// ============================================================

const getOrders = async (req, res, next) => {
  try {
    const { date, status, meal_timing, page = 1, pageSize = 20 } = req.query;
    const where = { owner_id: req.user.id };

    if (date) where.order_date = date;
    if (status) where.order_status = status;
    if (meal_timing) where.meal_timing = meal_timing;

    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize);

    const ordersData = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
          include: [{ model: CustomerProfile, as: 'customerProfile' }],
        },
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: Subscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan' }],
        },
      ],
    });

    return res.status(200).json(
      successResponse(getPaginatedResponse(ordersData, currentPage, size), 'Orders retrieved')
    );
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, owner_id: req.user.id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
          include: [{ model: CustomerProfile, as: 'customerProfile' }],
        },
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: Subscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan' }],
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return res.status(200).json(successResponse(order, 'Order details retrieved'));
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'order_received',
      'confirmed',
      'preparing',
      'tiffin_ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];

    if (!status || !validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const order = await Order.findOne({
      where: { id: req.params.id, owner_id: req.user.id },
      include: [{ model: User, as: 'customer' }],
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    order.order_status = status;
    await order.save();

    // Send customer notification on key status transitions
    const statusTitles = {
      confirmed: 'Order Confirmed! 👨‍🍳',
      preparing: 'Preparing your meal! 🍲',
      tiffin_ready: 'Your tiffin is ready! 🍱',
      out_for_delivery: 'Out for delivery! 🛵',
      delivered: 'Order Delivered! Enjoy your meal 😋',
      cancelled: 'Order Cancelled ❌',
    };

    if (statusTitles[status]) {
      await Notification.create({
        user_id: order.customer_id,
        title: statusTitles[status],
        message: `Order #${order.order_number} status updated to ${status.replace(/_/g, ' ')}.`,
        type: 'order',
        reference_id: order.id,
        reference_type: 'order',
      });
    }

    return res.status(200).json(successResponse(order, `Order status updated to ${status}`));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 6. Subscriptions & Customer Management
// ============================================================

const getSubscriptions = async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const where = { owner_id: req.user.id };

    if (status) where.status = status;

    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize);

    const subscriptionsData = await Subscription.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
          include: [{ model: CustomerProfile, as: 'customerProfile' }],
        },
        {
          model: SubscriptionPlan,
          as: 'plan',
          include: [
            {
              model: PlanItem,
              as: 'planItems',
              include: [{ model: MenuItem, as: 'menuItem' }],
            },
          ],
        },
      ],
    });

    return res.status(200).json(
      successResponse(getPaginatedResponse(subscriptionsData, currentPage, size), 'Subscriptions retrieved')
    );
  } catch (error) {
    next(error);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Fetch distinct customers who have ordered or subscribed from this owner
    const subscriptions = await Subscription.findAll({
      where: { owner_id: ownerId },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
          include: [{ model: CustomerProfile, as: 'customerProfile' }],
        },
        {
          model: SubscriptionPlan,
          as: 'plan',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json(successResponse(subscriptions, 'Customers list retrieved'));
  } catch (error) {
    next(error);
  }
};

const getSkipRequests = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const where = { owner_id: req.user.id };

    if (status) where.status = status;
    if (date) where.skip_date = date;

    const skips = await SkipRequest.findAll({
      where,
      order: [['skip_date', 'ASC']],
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: Subscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan' }],
        },
      ],
    });

    return res.status(200).json(successResponse(skips, 'Skip requests retrieved'));
  } catch (error) {
    next(error);
  }
};

const updateSkipStatus = async (req, res, next) => {
  try {
    const { status, credit_amount } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new AppError("Status must be 'approved' or 'rejected'", 400);
    }

    const skip = await SkipRequest.findOne({
      where: { id: req.params.id, owner_id: req.user.id },
      include: [{ model: User, as: 'customer' }],
    });

    if (!skip) {
      throw new AppError('Skip request not found', 404);
    }

    skip.status = status;
    if (credit_amount !== undefined) {
      skip.credit_applied = true;
      skip.credit_amount = credit_amount;
    }
    await skip.save();

    // Notify customer
    await Notification.create({
      user_id: skip.customer_id,
      title: `Tiffin Skip Request ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: `Your skip request for ${skip.skip_date} has been ${status}.`,
      type: 'skip',
      reference_id: skip.id,
      reference_type: 'skip_request',
    });

    return res.status(200).json(successResponse(skip, `Skip request marked as ${status}`));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 7. Payments Management
// ============================================================

const getPayments = async (req, res, next) => {
  try {
    const { payment_status, payment_method, page = 1, pageSize = 20 } = req.query;
    const where = { owner_id: req.user.id };

    if (payment_status) where.payment_status = payment_status;
    if (payment_method) where.payment_method = payment_method;

    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize);

    const paymentsData = await Payment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'total_amount'],
        },
        {
          model: Subscription,
          as: 'subscription',
          attributes: ['id', 'start_date', 'end_date'],
        },
      ],
    });

    return res.status(200).json(
      successResponse(getPaginatedResponse(paymentsData, currentPage, size), 'Payments retrieved')
    );
  } catch (error) {
    next(error);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const {
      customer_id,
      order_id,
      subscription_id,
      amount,
      payment_method = 'cash',
      payment_purpose = 'subscription',
      payment_status = 'paid',
      payment_date,
      transaction_id,
      notes,
    } = req.body;

    if (!customer_id || !amount) {
      throw new AppError('Customer ID and payment amount are required', 400);
    }

    const payment = await Payment.create({
      customer_id,
      owner_id: req.user.id,
      order_id: order_id || null,
      subscription_id: subscription_id || null,
      amount,
      payment_method,
      payment_purpose,
      payment_status,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      transaction_id,
      notes,
    });

    // If linked to order and paid, mark order as paid
    if (order_id && payment_status === 'paid') {
      await Order.update({ payment_status: 'paid' }, { where: { id: order_id } });
    }

    // If linked to subscription, increment paid_amount
    if (subscription_id && payment_status === 'paid') {
      const sub = await Subscription.findByPk(subscription_id);
      if (sub) {
        sub.paid_amount = parseFloat(sub.paid_amount || 0) + parseFloat(amount);
        await sub.save();
      }
    }

    // Notify customer
    await Notification.create({
      user_id: customer_id,
      title: 'Payment Recorded 💳',
      message: `A payment of ₹${amount} (${payment_method.toUpperCase()}) was recorded.`,
      type: 'payment',
      reference_id: payment.id,
      reference_type: 'payment',
    });

    return res.status(201).json(successResponse(payment, 'Payment recorded successfully', 201));
  } catch (error) {
    next(error);
  }
};

const getPaymentSummary = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Today's collections
    const todayPayments = await Payment.findAll({
      where: { owner_id: ownerId, payment_date: today, payment_status: 'paid' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const todayCollections = parseFloat(todayPayments[0]?.getDataValue('total') || 0);

    // Cash collections
    const cashResult = await Payment.findAll({
      where: { owner_id: ownerId, payment_method: 'cash', payment_status: 'paid' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const cashCollections = parseFloat(cashResult[0]?.getDataValue('total') || 0);

    // Online / UPI collections
    const onlineResult = await Payment.findAll({
      where: {
        owner_id: ownerId,
        payment_method: { [Op.in]: ['upi', 'online'] },
        payment_status: 'paid',
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const onlineCollections = parseFloat(onlineResult[0]?.getDataValue('total') || 0);

    // Total outstanding / pending
    const pendingResult = await Payment.findAll({
      where: { owner_id: ownerId, payment_status: 'pending' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    });
    const pendingCollections = parseFloat(pendingResult[0]?.getDataValue('total') || 0);

    return res.status(200).json(
      successResponse(
        {
          todayCollections,
          cashCollections,
          onlineCollections,
          pendingCollections,
          totalRevenue: cashCollections + onlineCollections,
        },
        'Payment summary retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 8. Service Calendar
// ============================================================

const getCalendar = async (req, res, next) => {
  try {
    const holidays = await ServiceCalendar.findAll({
      where: { owner_id: req.user.id },
      order: [['date', 'ASC']],
    });
    return res.status(200).json(successResponse(holidays, 'Service calendar retrieved'));
  } catch (error) {
    next(error);
  }
};

const addHoliday = async (req, res, next) => {
  try {
    const { date, reason, is_holiday = true } = req.body;
    if (!date) {
      throw new AppError('Date is required', 400);
    }

    const [holiday] = await ServiceCalendar.findOrCreate({
      where: { owner_id: req.user.id, date },
      defaults: { owner_id: req.user.id, date, reason, is_holiday },
    });

    holiday.is_holiday = is_holiday;
    if (reason !== undefined) holiday.reason = reason;
    await holiday.save();

    return res.status(201).json(successResponse(holiday, 'Calendar updated', 201));
  } catch (error) {
    next(error);
  }
};

const deleteHoliday = async (req, res, next) => {
  try {
    const deleted = await ServiceCalendar.destroy({
      where: { id: req.params.id, owner_id: req.user.id },
    });
    if (!deleted) {
      throw new AppError('Calendar entry not found', 404);
    }
    return res.status(200).json(successResponse(null, 'Calendar entry removed'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOwnerProfile,
  updateOwnerProfile,
  getDashboardStats,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getSubscriptions,
  getCustomers,
  getSkipRequests,
  updateSkipStatus,
  getPayments,
  recordPayment,
  getPaymentSummary,
  getCalendar,
  addHoliday,
  deleteHoliday,
};

