import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/authController';
import { estimateOrderPrice, createOrder, getUserOrders } from '../controllers/orderController';
import { registerDriver, getDrivers, updateDriverStatus } from '../controllers/driverController';
import { updateProfile, getProfile } from '../controllers/userController';

const router = Router();

// Auth Endpoints
router.post('/auth/request-otp', requestOtp);
router.post('/auth/verify-otp', verifyOtp);

// User Profile Endpoints
router.get('/users/profile', getProfile);
router.put('/users/profile', updateProfile);

// Order & Pricing Endpoints
router.get('/users/orders', getUserOrders);
router.post('/orders/estimate', estimateOrderPrice);
router.post('/orders/create', createOrder);

// Driver Verification Endpoints
router.post('/drivers/register', registerDriver);
router.get('/drivers', getDrivers);
router.patch('/drivers/:id/status', updateDriverStatus);

export default router;

