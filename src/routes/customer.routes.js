/**
 * Customer Routes
 * Endpoints for Customer features (discovery, ordering, subscriptions, skip tiffin, payments).
 * All routes require authentication and role 'customer'.
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all customer routes
router.use(authenticate, authorize('customer'));

// 1. Profile
router.get('/profile', customerController.getCustomerProfile);
router.put('/profile', customerController.updateCustomerProfile);

// 2. Discover Providers
router.get('/providers', customerController.getProviders);
router.get('/providers/:id', customerController.getProviderDetails);

// 3. Orders
router.post('/orders', customerController.createOrder);
router.get('/orders', customerController.getCustomerOrders);
router.get('/orders/:id', customerController.getCustomerOrderById);
router.patch('/orders/:id/cancel', customerController.cancelOrder);

// 4. Subscriptions
router.post('/subscriptions', customerController.createSubscription);
router.get('/subscriptions', customerController.getCustomerSubscriptions);

// 5. Skip Tiffin
router.post('/skips', customerController.requestSkipTiffin);
router.get('/skips', customerController.getCustomerSkips);

// 6. Payments
router.get('/payments', customerController.getCustomerPayments);

module.exports = router;
