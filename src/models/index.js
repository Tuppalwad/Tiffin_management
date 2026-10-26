/**
 * Models Index
 * Central hub for all Sequelize models and their associations.
 * Imports every model, defines relationships, and exports them.
 */

const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const OwnerProfile = require('./OwnerProfile');
const CustomerProfile = require('./CustomerProfile');
const MenuItem = require('./MenuItem');
const SubscriptionPlan = require('./SubscriptionPlan');
const PlanItem = require('./PlanItem');
const Subscription = require('./Subscription');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const SkipRequest = require('./SkipRequest');
const Notification = require('./Notification');
const ServiceCalendar = require('./ServiceCalendar');

// ============================================================
// Define Associations / Relationships
// ============================================================

// --- User <-> OwnerProfile (One-to-One) ---
User.hasOne(OwnerProfile, {
  foreignKey: 'user_id',
  as: 'ownerProfile',
  onDelete: 'CASCADE',
});
OwnerProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// --- User <-> CustomerProfile (One-to-One) ---
User.hasOne(CustomerProfile, {
  foreignKey: 'user_id',
  as: 'customerProfile',
  onDelete: 'CASCADE',
});
CustomerProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// --- User (owner) <-> MenuItem (One-to-Many) ---
User.hasMany(MenuItem, {
  foreignKey: 'owner_id',
  as: 'menuItems',
});
MenuItem.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});

// --- User (owner) <-> SubscriptionPlan (One-to-Many) ---
User.hasMany(SubscriptionPlan, {
  foreignKey: 'owner_id',
  as: 'subscriptionPlans',
});
SubscriptionPlan.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});

// --- SubscriptionPlan <-> PlanItem (One-to-Many) ---
SubscriptionPlan.hasMany(PlanItem, {
  foreignKey: 'plan_id',
  as: 'planItems',
  onDelete: 'CASCADE',
});
PlanItem.belongsTo(SubscriptionPlan, {
  foreignKey: 'plan_id',
  as: 'plan',
});

// --- PlanItem <-> MenuItem (Many-to-One) ---
PlanItem.belongsTo(MenuItem, {
  foreignKey: 'menu_item_id',
  as: 'menuItem',
});
MenuItem.hasMany(PlanItem, {
  foreignKey: 'menu_item_id',
  as: 'planItems',
});

// --- Subscription Associations ---
// Subscription belongsTo User (customer)
Subscription.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});
User.hasMany(Subscription, {
  foreignKey: 'customer_id',
  as: 'customerSubscriptions',
});

// Subscription belongsTo User (owner)
Subscription.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});
User.hasMany(Subscription, {
  foreignKey: 'owner_id',
  as: 'ownerSubscriptions',
});

// Subscription belongsTo SubscriptionPlan
Subscription.belongsTo(SubscriptionPlan, {
  foreignKey: 'plan_id',
  as: 'plan',
});
SubscriptionPlan.hasMany(Subscription, {
  foreignKey: 'plan_id',
  as: 'subscriptions',
});

// --- Order Associations ---
// Order belongsTo User (customer)
Order.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});
User.hasMany(Order, {
  foreignKey: 'customer_id',
  as: 'customerOrders',
});

// Order belongsTo User (owner)
Order.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});
User.hasMany(Order, {
  foreignKey: 'owner_id',
  as: 'ownerOrders',
});

// Order belongsTo Subscription (optional)
Order.belongsTo(Subscription, {
  foreignKey: 'subscription_id',
  as: 'subscription',
});
Subscription.hasMany(Order, {
  foreignKey: 'subscription_id',
  as: 'orders',
});

// --- Order <-> OrderItem (One-to-Many) ---
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'orderItems',
  onDelete: 'CASCADE',
});

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// --- OrderItem <-> MenuItem (Many-to-One) ---
OrderItem.belongsTo(MenuItem, {
  foreignKey: 'menu_item_id',
  as: 'menuItem',
});
MenuItem.hasMany(OrderItem, {
  foreignKey: 'menu_item_id',
  as: 'orderItems',
});

// --- Payment Associations ---
// Payment belongsTo User (customer)
Payment.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});
User.hasMany(Payment, {
  foreignKey: 'customer_id',
  as: 'customerPayments',
});

// Payment belongsTo User (owner)
Payment.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});
User.hasMany(Payment, {
  foreignKey: 'owner_id',
  as: 'ownerPayments',
});

// Payment belongsTo Order (optional)
Payment.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});
Order.hasMany(Payment, {
  foreignKey: 'order_id',
  as: 'payments',
});

// Payment belongsTo Subscription (optional)
Payment.belongsTo(Subscription, {
  foreignKey: 'subscription_id',
  as: 'subscription',
});
Subscription.hasMany(Payment, {
  foreignKey: 'subscription_id',
  as: 'payments',
});

// --- SkipRequest Associations ---
SkipRequest.belongsTo(Subscription, {
  foreignKey: 'subscription_id',
  as: 'subscription',
});
Subscription.hasMany(SkipRequest, {
  foreignKey: 'subscription_id',
  as: 'skipRequests',
});

SkipRequest.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});
User.hasMany(SkipRequest, {
  foreignKey: 'customer_id',
  as: 'customerSkipRequests',
});

SkipRequest.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});
User.hasMany(SkipRequest, {
  foreignKey: 'owner_id',
  as: 'ownerSkipRequests',
});

// --- Notification Associations ---
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
});

// --- ServiceCalendar Associations ---
ServiceCalendar.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});
User.hasMany(ServiceCalendar, {
  foreignKey: 'owner_id',
  as: 'serviceCalendar',
});

// ============================================================
// Export all models and sequelize instance
// ============================================================
module.exports = {
  sequelize,
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
};
