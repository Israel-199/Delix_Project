import { Router } from 'express';
import multer from 'multer';
import { requestOtp, verifyOtp } from '../controllers/authController';
import { estimateOrderPrice, createOrder, getUserOrders, acceptOrder, getOrderById } from '../controllers/orderController';
import { registerDriver, getDrivers, getDriverProfile, updateDriverStatus, getDriverCycle, completeDriverTrip, getDriverTrips, getDriverEarnings, getDriverActiveOrder } from '../controllers/driverController';
import { updateProfile, getProfile } from '../controllers/userController';
import { uploadImage } from '../controllers/uploadController';
import { getNotifications, readNotification } from '../controllers/notificationController';
import { getDriverDocuments, saveDriverDocument } from '../controllers/driverDocumentController';
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
  getAdminCommissions,
  resetDriverCommissionCycle,
  getAdminUsers,
  updateUserBlockStatus,
  getAdminDriverDocuments,
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
router.get('/users/notifications', getNotifications);
router.patch('/users/notifications/:id/read', readNotification);

// Order & Pricing Endpoints
router.get('/users/orders', getUserOrders);
router.post('/orders/estimate', estimateOrderPrice);
router.post('/orders/create', createOrder);
router.get('/orders/:id', getOrderById);
router.post('/orders/accept', acceptOrder);

// Driver Verification Endpoints
router.post('/drivers/register', registerDriver);
router.get('/drivers', getDrivers);
router.get('/drivers/profile', getDriverProfile);
router.get('/drivers/nearby', getNearbyDrivers);
router.get('/drivers/:id/cycle', getDriverCycle);
router.get('/drivers/:id/trips', getDriverTrips);
router.get('/drivers/:id/active-order', getDriverActiveOrder);
router.get('/drivers/:id/earnings', getDriverEarnings);
router.get('/drivers/:id/documents', getDriverDocuments);
router.post('/drivers/:id/documents', saveDriverDocument);
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
router.get('/admin/commissions', getAdminCommissions);
router.post('/admin/drivers/:id/reset-cycle', resetDriverCommissionCycle);
router.get('/admin/drivers/:id/documents', getAdminDriverDocuments);
router.get('/admin/users', getAdminUsers);
router.patch('/admin/users/:id/block', updateUserBlockStatus);

export default router;

