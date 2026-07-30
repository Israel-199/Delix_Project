import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/authController';
import { estimateOrderPrice, createOrder } from '../controllers/orderController';
import { registerDriver, getDrivers, updateDriverStatus } from '../controllers/driverController';

const router = Router();

// Auth Endpoints
router.post('/auth/request-otp', requestOtp);
router.post('/auth/verify-otp', verifyOtp);

// Order & Pricing Endpoints
router.post('/orders/estimate', estimateOrderPrice);
router.post('/orders/create', createOrder);

// Driver Verification Endpoints
router.post('/drivers/register', registerDriver);
router.get('/drivers', getDrivers);
router.patch('/drivers/:id/status', updateDriverStatus);

export default router;
