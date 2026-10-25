/**
 * Owner Routes
 * Endpoints for Owner business operations (profile, menu, plans, orders, payments, calendar).
 * All routes require authentication and role 'owner'.
 */

const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/owner.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all owner routes
router.use(authenticate, authorize('owner'));

// 1. Profile
router.get('/profile', ownerController.getOwnerProfile);
router.put('/profile', ownerController.updateOwnerProfile);

// 2. Dashboard
router.get('/dashboard', ownerController.getDashboardStats);

// 3. Menu Management
router.get('/menu', ownerController.getMenuItems);
router.post('/menu', ownerController.createMenuItem);
router.get('/menu/:id', ownerController.getMenuItemById);
router.put('/menu/:id', ownerController.updateMenuItem);
router.patch('/menu/:id/toggle', ownerController.toggleMenuItemAvailability);
router.delete('/menu/:id', ownerController.deleteMenuItem);

// 4. Subscription Plans
router.get('/plans', ownerController.getSubscriptionPlans);
router.post('/plans', ownerController.createSubscriptionPlan);
router.put('/plans/:id', ownerController.updateSubscriptionPlan);
router.delete('/plans/:id', ownerController.deleteSubscriptionPlan);

// 5. Orders Management
router.get('/orders', ownerController.getOrders);
router.get('/orders/:id', ownerController.getOrderById);
router.patch('/orders/:id/status', ownerController.updateOrderStatus);

// 6. Subscriptions & Customer Management
router.get('/subscriptions', ownerController.getSubscriptions);
router.get('/customers', ownerController.getCustomers);
router.get('/skips', ownerController.getSkipRequests);
router.patch('/skips/:id', ownerController.updateSkipStatus);

// 7. Payment Management
router.get('/payments', ownerController.getPayments);
router.post('/payments', ownerController.recordPayment);
router.get('/payments/summary', ownerController.getPaymentSummary);

// 8. Service Calendar
router.get('/calendar', ownerController.getCalendar);
router.post('/calendar', ownerController.addHoliday);
router.delete('/calendar/:id', ownerController.deleteHoliday);

module.exports = router;
