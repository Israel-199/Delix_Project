import { Router } from 'express';
import multer from 'multer';
import { requestOtp, verifyOtp } from '../controllers/authController';
import { estimateOrderPrice, createOrder, getUserOrders, acceptOrder } from '../controllers/orderController';
import { registerDriver, getDrivers, getDriverProfile, updateDriverStatus, getDriverCycle, completeDriverTrip } from '../controllers/driverController';
import { updateProfile, getProfile } from '../controllers/userController';
import { uploadImage } from '../controllers/uploadController';
import {
  searchLocations,
  getRecentLocations,
  saveRecentLocation,
  getNearbyRecommendations,
} from '../controllers/locationController';
import { getNearbyDrivers } from '../controllers/nearbyDriversController';
import {
  getAdminStats,
  getAdminOrders,
  getPricingConfig,
  updatePricingConfig,
  getLiveDrivers,
} from '../controllers/adminController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth Endpoints
router.post('/auth/request-otp', requestOtp);
router.post('/auth/verify-otp', verifyOtp);

// Upload Endpoint
router.post('/upload', upload.single('file'), uploadImage);

// User Profile Endpoints
router.get('/users/profile', getProfile);
router.put('/users/profile', updateProfile);

// Order & Pricing Endpoints
router.get('/users/orders', getUserOrders);
router.post('/orders/estimate', estimateOrderPrice);
router.post('/orders/create', createOrder);
router.post('/orders/accept', acceptOrder);

// Driver Verification Endpoints
router.post('/drivers/register', registerDriver);
router.get('/drivers', getDrivers);
router.get('/drivers/profile', getDriverProfile);
router.get('/drivers/nearby', getNearbyDrivers);
router.get('/drivers/:id/cycle', getDriverCycle);
router.post('/drivers/:id/complete-trip', completeDriverTrip);
router.patch('/drivers/:id/status', updateDriverStatus);

// Location search & recent places
router.get('/locations/search', searchLocations);
router.get('/locations/recent', getRecentLocations);
router.post('/locations/recent', saveRecentLocation);
router.get('/locations/nearby', getNearbyRecommendations);

// Admin endpoints
router.get('/admin/stats', getAdminStats);
router.get('/admin/orders', getAdminOrders);
router.get('/admin/pricing', getPricingConfig);
router.put('/admin/pricing', updatePricingConfig);
router.get('/admin/live-drivers', getLiveDrivers);

export default router;

