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
// Order & Pricing Endpoints
router.get('/users/orders', orderController_1.getUserOrders);
router.post('/orders/estimate', orderController_1.estimateOrderPrice);
router.post('/orders/create', orderController_1.createOrder);
// Driver Verification Endpoints
router.post('/drivers/register', driverController_1.registerDriver);
router.get('/drivers', driverController_1.getDrivers);
router.patch('/drivers/:id/status', driverController_1.updateDriverStatus);
exports.default = router;
