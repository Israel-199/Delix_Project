"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authController_1 = require("../controllers/authController");
const orderController_1 = require("../controllers/orderController");
const driverController_1 = require("../controllers/driverController");
const userController_1 = require("../controllers/userController");
const uploadController_1 = require("../controllers/uploadController");
const notificationController_1 = require("../controllers/notificationController");
const driverDocumentController_1 = require("../controllers/driverDocumentController");
const locationController_1 = require("../controllers/locationController");
const nearbyDriversController_1 = require("../controllers/nearbyDriversController");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Auth Endpoints
router.post('/auth/request-otp', authController_1.requestOtp);
router.post('/auth/verify-otp', authController_1.verifyOtp);
// Upload Endpoint
router.post('/upload', upload.single('file'), uploadController_1.uploadImage);
// User Profile Endpoints
router.get('/users/profile', userController_1.getProfile);
router.put('/users/profile', userController_1.updateProfile);
router.get('/users/notifications', notificationController_1.getNotifications);
router.patch('/users/notifications/:id/read', notificationController_1.readNotification);
// Order & Pricing Endpoints
router.get('/users/orders', orderController_1.getUserOrders);
router.post('/orders/estimate', orderController_1.estimateOrderPrice);
router.post('/orders/create', orderController_1.createOrder);
router.get('/orders/:id', orderController_1.getOrderById);
router.post('/orders/accept', orderController_1.acceptOrder);
// Driver Verification Endpoints
router.post('/drivers/register', driverController_1.registerDriver);
router.get('/drivers', driverController_1.getDrivers);
router.get('/drivers/profile', driverController_1.getDriverProfile);
router.get('/drivers/nearby', nearbyDriversController_1.getNearbyDrivers);
router.get('/drivers/:id/cycle', driverController_1.getDriverCycle);
router.get('/drivers/:id/trips', driverController_1.getDriverTrips);
router.get('/drivers/:id/active-order', driverController_1.getDriverActiveOrder);
router.get('/drivers/:id/earnings', driverController_1.getDriverEarnings);
router.get('/drivers/:id/documents', driverDocumentController_1.getDriverDocuments);
router.post('/drivers/:id/documents', driverDocumentController_1.saveDriverDocument);
router.post('/drivers/:id/complete-trip', driverController_1.completeDriverTrip);
router.patch('/drivers/:id/status', driverController_1.updateDriverStatus);
// Location search & recent places
router.get('/locations/search', locationController_1.searchLocations);
router.get('/locations/recent', locationController_1.getRecentLocations);
router.post('/locations/recent', locationController_1.saveRecentLocation);
router.get('/locations/nearby', locationController_1.getNearbyRecommendations);
// Admin endpoints
router.get('/admin/stats', adminController_1.getAdminStats);
router.get('/admin/orders', adminController_1.getAdminOrders);
router.get('/admin/pricing', adminController_1.getPricingConfig);
router.put('/admin/pricing', adminController_1.updatePricingConfig);
router.get('/admin/live-drivers', adminController_1.getLiveDrivers);
router.get('/admin/commissions', adminController_1.getAdminCommissions);
router.post('/admin/drivers/:id/reset-cycle', adminController_1.resetDriverCommissionCycle);
router.get('/admin/drivers/:id/documents', adminController_1.getAdminDriverDocuments);
router.get('/admin/users', adminController_1.getAdminUsers);
router.patch('/admin/users/:id/block', adminController_1.updateUserBlockStatus);
exports.default = router;
