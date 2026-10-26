/**
 * Customer Controller
 * Handles Customer discovery of tiffin providers, viewing menus & plans,
 * placing daily/extra orders, subscribing to monthly plans, requesting tiffin skips,
 * and viewing order and payment history.
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
// 1. Customer Profile
// ============================================================

const getCustomerProfile = async (req, res, next) => {
  try {
    const profile = await CustomerProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'email'] }],
    });

    if (!profile) {
      throw new AppError('Customer profile not found', 404);
    }

    return res.status(200).json(successResponse(profile, 'Customer profile retrieved'));
  } catch (error) {
    next(error);
  }
};

const updateCustomerProfile = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      delivery_address,
      food_preferences,
    } = req.body;

    let profile = await CustomerProfile.findOne({ where: { user_id: req.user.id } });

    if (!profile) {
      profile = await CustomerProfile.create({ user_id: req.user.id });
    }

    if (address !== undefined) profile.address = address;
    if (city !== undefined) profile.city = city;
    if (state !== undefined) profile.state = state;
    if (pincode !== undefined) profile.pincode = pincode;
    if (latitude !== undefined) profile.latitude = latitude;
    if (longitude !== undefined) profile.longitude = longitude;
    if (delivery_address !== undefined) profile.delivery_address = delivery_address;
    if (food_preferences !== undefined) profile.food_preferences = food_preferences;

    await profile.save();

    if (name) {
      await User.update({ name }, { where: { id: req.user.id } });
    }

    const updated = await CustomerProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'email'] }],
    });

    return res.status(200).json(successResponse(updated, 'Customer profile updated'));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 2. Discover Providers
// ============================================================

const getProviders = async (req, res, next) => {
  try {
    const { search, city, pincode, delivery_available } = req.query;
    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { business_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (pincode) where.pincode = pincode;
    if (delivery_available !== undefined) {
      where.delivery_available = delivery_available === 'true';
    }

    const providers = await OwnerProfile.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'phone'] },
      ],
      order: [['business_name', 'ASC']],
    });

    // Also fetch active menu items count and sample plans for each provider
    const formattedProviders = await Promise.all(
      providers.map(async (p) => {
        const menuCount = await MenuItem.count({
          where: { owner_id: p.user_id, is_active: true, is_available: true },
        });
        const planCount = await SubscriptionPlan.count({
          where: { owner_id: p.user_id, is_active: true, is_available: true },
        });
        return {
          ...p.toJSON(),
          menuItemCount: menuCount,
          planCount: planCount,
        };
      })
    );

    return res.status(200).json(successResponse(formattedProviders, 'Providers list retrieved'));
  } catch (error) {
    next(error);
  }
};

const getProviderDetails = async (req, res, next) => {
  try {
    const ownerId = req.params.id;

    const profile = await OwnerProfile.findOne({
      where: { user_id: ownerId, is_active: true },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }],
    });

    if (!profile) {
      throw new AppError('Tiffin provider not found', 404);
    }

    // Get menu items
    const menuItems = await MenuItem.findAll({
      where: { owner_id: ownerId, is_active: true },
      order: [['category', 'ASC'], ['price', 'ASC']],
    });

    // Get subscription plans with plan items
    const subscriptionPlans = await SubscriptionPlan.findAll({
      where: { owner_id: ownerId, is_active: true },
      include: [
        {
          model: PlanItem,
          as: 'planItems',
          include: [{ model: MenuItem, as: 'menuItem' }],
        },
      ],
    });

    // Get calendar holidays
    const holidays = await ServiceCalendar.findAll({
      where: { owner_id: ownerId, is_holiday: true },
      order: [['date', 'ASC']],
    });

    return res.status(200).json(
      successResponse(
        {
          provider: profile,
          menu: menuItems,
          plans: subscriptionPlans,
          holidays,
        },
        'Provider details retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 3. Orders Placement & History
// ============================================================

const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const customerId = req.user.id;
    const {
      owner_id,
      items, // array of { menu_item_id, quantity }
      order_date,
      meal_timing = 'lunch',
      delivery_type = 'delivery',
      delivery_address,
      notes,
    } = req.body;

    if (!owner_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Owner ID and at least one food item are required', 400);
    }

    // Fetch items from DB to verify price and availability
    const itemIds = items.map((i) => i.menu_item_id);
    const dbItems = await MenuItem.findAll({
      where: {
        id: { [Op.in]: itemIds },
        owner_id,
        is_active: true,
      },
    });

    if (dbItems.length !== items.length) {
      throw new AppError('One or more selected menu items are not valid', 400);
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = dbItems.find((d) => d.id === item.menu_item_id);
      const qty = parseInt(item.quantity, 10) || 1;
      const unitPrice = parseFloat(dbItem.price);
      const totalPrice = unitPrice * qty;

      subtotal += totalPrice;
      orderItemsData.push({
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    // Fetch owner delivery charges if applicable
    let deliveryCharges = 0;
    if (delivery_type === 'delivery') {
      const ownerProfile = await OwnerProfile.findOne({ where: { user_id: owner_id } });
      if (ownerProfile && ownerProfile.delivery_available === false) {
        throw new AppError('This provider does not offer delivery currently', 400);
      }
    }

    const totalAmount = subtotal + deliveryCharges;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await Order.create(
      {
        order_number: orderNumber,
        customer_id: customerId,
        owner_id,
        order_type: 'daily',
        order_date: order_date || new Date().toISOString().split('T')[0],
        meal_timing,
        delivery_type,
        delivery_address: delivery_address || 'Customer registered address',
        subtotal,
        delivery_charges: deliveryCharges,
        discount: 0,
        total_amount: totalAmount,
        payment_status: 'pending',
        order_status: 'order_received',
        notes,
      },
      { transaction: t }
    );

    // Link order_id to orderItems
    const fullOrderItems = orderItemsData.map((oi) => ({
      ...oi,
      order_id: order.id,
    }));

    await OrderItem.bulkCreate(fullOrderItems, { transaction: t });

    // Send owner notification
    const customer = await User.findByPk(customerId);
    await Notification.create(
      {
        user_id: owner_id,
        title: 'New Daily Tiffin Order! 🍱',
        message: `${customer ? customer.name || 'A customer' : 'A customer'} placed order #${orderNumber} for ₹${totalAmount}.`,
        type: 'order',
        reference_id: order.id,
        reference_type: 'order',
      },
      { transaction: t }
    );

    await t.commit();

    let createdOrder = order;
    try {
      const fetched = await Order.findByPk(order.id, {
        include: [
          { model: OrderItem, as: 'orderItems' },
          { model: User, as: 'owner', attributes: ['id', 'name', 'phone'] },
        ],
      });
      if (fetched) createdOrder = fetched;
    } catch (fetchErr) {
      console.warn('Warning: Could not fetch associations for created order:', fetchErr.message);
    }

    return res.status(201).json(successResponse(createdOrder, 'Order placed successfully', 201));
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

const getCustomerOrders = async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const where = { customer_id: req.user.id };

    if (status) where.order_status = status;

    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize);

    const ordersData = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'phone'],
          include: [{ model: OwnerProfile, as: 'ownerProfile' }],
        },
        { model: OrderItem, as: 'orderItems' },
        {
          model: Subscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan' }],
        },
      ],
    });

    return res.status(200).json(
      successResponse(getPaginatedResponse(ordersData, currentPage, size), 'Customer orders retrieved')
    );
  } catch (error) {
    next(error);
  }
};

const getCustomerOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customer_id: req.user.id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'phone'],
          include: [{ model: OwnerProfile, as: 'ownerProfile' }],
        },
        { model: OrderItem, as: 'orderItems' },
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

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customer_id: req.user.id },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Orders can only be cancelled before preparing
    if (['preparing', 'tiffin_ready', 'out_for_delivery', 'delivered'].includes(order.order_status)) {
      throw new AppError('Cannot cancel order as food preparation has already begun', 400);
    }

    order.order_status = 'cancelled';
    await order.save();

    // Notify owner
    await Notification.create({
      user_id: order.owner_id,
      title: 'Order Cancelled by Customer ❌',
      message: `Order #${order.order_number} was cancelled by customer.`,
      type: 'order',
      reference_id: order.id,
      reference_type: 'order',
    });

    return res.status(200).json(successResponse(order, 'Order cancelled successfully'));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 4. Subscriptions
// ============================================================

const createSubscription = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { owner_id, plan_id, start_date, notes } = req.body;

    if (!owner_id || !plan_id || !start_date) {
      throw new AppError('Owner ID, Plan ID, and Start Date are required', 400);
    }

    const plan = await SubscriptionPlan.findOne({
      where: { id: plan_id, owner_id, is_active: true },
    });

    if (!plan) {
      throw new AppError('Subscription plan not found or inactive', 404);
    }

    // Calculate end date based on duration_days
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + (plan.duration_days || 30));
    const endDate = endDateObj.toISOString().split('T')[0];

    const totalAmount = parseFloat(plan.price) + parseFloat(plan.delivery_charges || 0);

    const subscription = await Subscription.create({
      customer_id: customerId,
      owner_id,
      plan_id,
      start_date,
      end_date: endDate,
      status: 'active',
      total_amount: totalAmount,
      paid_amount: 0,
      remaining_days: plan.duration_days || 30,
      auto_renew: false,
      notes,
    });

    // Notify owner
    const customer = await User.findByPk(customerId);
    await Notification.create({
      user_id: owner_id,
      title: 'New Subscription! 🎉',
      message: `${customer ? customer.name || 'A customer' : 'A customer'} subscribed to ${plan.name} (₹${totalAmount}).`,
      type: 'subscription',
      reference_id: subscription.id,
      reference_type: 'subscription',
    });

    const fullSubscription = await Subscription.findByPk(subscription.id, {
      include: [
        { model: SubscriptionPlan, as: 'plan' },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'phone'],
          include: [{ model: OwnerProfile, as: 'ownerProfile' }],
        },
      ],
    });

    return res.status(201).json(
      successResponse(fullSubscription, 'Subscribed successfully! Welcome aboard', 201)
    );
  } catch (error) {
    next(error);
  }
};

const getCustomerSubscriptions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { customer_id: req.user.id };

    if (status) where.status = status;

    const subscriptions = await Subscription.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
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
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'phone'],
          include: [{ model: OwnerProfile, as: 'ownerProfile' }],
        },
        {
          model: SkipRequest,
          as: 'skipRequests',
        },
      ],
    });

    return res.status(200).json(successResponse(subscriptions, 'Subscriptions retrieved'));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 5. Skip Today's Tiffin
// ============================================================

const requestSkipTiffin = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { subscription_id, skip_date, reason } = req.body;

    if (!subscription_id || !skip_date) {
      throw new AppError('Subscription ID and skip date are required', 400);
    }

    const subscription = await Subscription.findOne({
      where: { id: subscription_id, customer_id: customerId, status: 'active' },
    });

    if (!subscription) {
      throw new AppError('Active subscription not found', 404);
    }

    // Check if skip already exists for this date
    const existing = await SkipRequest.findOne({
      where: { subscription_id, skip_date },
    });

    if (existing) {
      throw new AppError('A skip request already exists for this date', 400);
    }

    const skip = await SkipRequest.create({
      subscription_id,
      customer_id: customerId,
      owner_id: subscription.owner_id,
      skip_date,
      reason,
      status: 'requested',
    });

    // Notify owner
    const customer = await User.findByPk(customerId);
    await Notification.create({
      user_id: subscription.owner_id,
      title: 'Tiffin Skip Request ⏸️',
      message: `${customer ? customer.name || 'A customer' : 'Customer'} requested to skip tiffin for ${skip_date}.`,
      type: 'skip',
      reference_id: skip.id,
      reference_type: 'skip_request',
    });

    return res.status(201).json(successResponse(skip, 'Tiffin skip request submitted', 201));
  } catch (error) {
    next(error);
  }
};

const getCustomerSkips = async (req, res, next) => {
  try {
    const skips = await SkipRequest.findAll({
      where: { customer_id: req.user.id },
      order: [['skip_date', 'DESC']],
      include: [
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

// ============================================================
// 6. Payment History
// ============================================================

const getCustomerPayments = async (req, res, next) => {
  try {
    const payments = await Payment.findAll({
      where: { customer_id: req.user.id },
      order: [['payment_date', 'DESC']],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
          include: [{ model: OwnerProfile, as: 'ownerProfile' }],
        },
        { model: Order, as: 'order', attributes: ['id', 'order_number'] },
        { model: Subscription, as: 'subscription', attributes: ['id', 'start_date', 'end_date'] },
      ],
    });

    return res.status(200).json(successResponse(payments, 'Customer payments retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  getProviders,
  getProviderDetails,
  createOrder,
  getCustomerOrders,
  getCustomerOrderById,
  cancelOrder,
  createSubscription,
  getCustomerSubscriptions,
  requestSkipTiffin,
  getCustomerSkips,
  getCustomerPayments,
};
