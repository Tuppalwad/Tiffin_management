/**
 * Application Constants
 * Centralized definition of all enums, statuses, and constant values
 * used throughout the application.
 */

// Order status progression
const ORDER_STATUSES = {
  ORDER_RECEIVED: 'order_received',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  TIFFIN_READY: 'tiffin_ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Payment statuses
const PAYMENT_STATUSES = {
  PAID: 'paid',
  PENDING: 'pending',
  PARTIAL: 'partial',
  REFUNDED: 'refunded',
};

// Payment methods
const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI: 'upi',
  ONLINE: 'online',
};

// Payment purposes
const PAYMENT_PURPOSES = {
  SUBSCRIPTION: 'subscription',
  EXTRA_ORDER: 'extra_order',
  OTHER: 'other',
};

// User roles
const USER_ROLES = {
  OWNER: 'owner',
  CUSTOMER: 'customer',
};

// Subscription plan types
const PLAN_TYPES = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
};

// Meal types
const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
};

// Subscription statuses
const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

// Order types
const ORDER_TYPES = {
  DAILY: 'daily',
  EXTRA: 'extra',
  SUBSCRIPTION: 'subscription',
};

// Delivery types
const DELIVERY_TYPES = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
};

// Skip request statuses
const SKIP_REQUEST_STATUSES = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Notification types
const NOTIFICATION_TYPES = {
  ORDER: 'order',
  PAYMENT: 'payment',
  SUBSCRIPTION: 'subscription',
  SKIP: 'skip',
  GENERAL: 'general',
};

// Enum value arrays (for Sequelize ENUM definitions)
const ENUM_VALUES = {
  userRoles: Object.values(USER_ROLES),
  orderStatuses: Object.values(ORDER_STATUSES),
  paymentStatuses: Object.values(PAYMENT_STATUSES),
  paymentMethods: Object.values(PAYMENT_METHODS),
  paymentPurposes: Object.values(PAYMENT_PURPOSES),
  planTypes: Object.values(PLAN_TYPES),
  mealTypes: Object.values(MEAL_TYPES),
  subscriptionStatuses: Object.values(SUBSCRIPTION_STATUSES),
  orderTypes: Object.values(ORDER_TYPES),
  deliveryTypes: Object.values(DELIVERY_TYPES),
  skipRequestStatuses: Object.values(SKIP_REQUEST_STATUSES),
};

module.exports = {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_PURPOSES,
  USER_ROLES,
  PLAN_TYPES,
  MEAL_TYPES,
  SUBSCRIPTION_STATUSES,
  ORDER_TYPES,
  DELIVERY_TYPES,
  SKIP_REQUEST_STATUSES,
  NOTIFICATION_TYPES,
  ENUM_VALUES,
};
