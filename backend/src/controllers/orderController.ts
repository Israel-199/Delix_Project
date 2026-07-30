import { Request, Response } from 'express';

// Vehicle pricing rates (ETB)
const vehicleRates: Record<string, { base: number; perKm: number; loading: number; unloading: number }> = {
  LADA_BED: { base: 150, perKm: 25, loading: 50, unloading: 50 },
  PICKUP_TRUCK: { base: 250, perKm: 35, loading: 100, unloading: 100 },
  MINI_TRUCK: { base: 450, perKm: 50, loading: 200, unloading: 200 },
  LARGE_TRUCK: { base: 1200, perKm: 110, loading: 500, unloading: 500 },
};

/**
 * Calculate estimated distance & price for cargo delivery
 */
export const estimateOrderPrice = async (req: Request, res: Response) => {
  try {
    const { vehicleType, distanceKm, loadingAssistance = false, unloadingAssistance = false } = req.body;

    const rates = vehicleRates[vehicleType] || vehicleRates.PICKUP_TRUCK;
    const distanceCost = (distanceKm || 5) * rates.perKm;
    let totalPrice = rates.base + distanceCost;

    if (loadingAssistance) totalPrice += rates.loading;
    if (unloadingAssistance) totalPrice += rates.unloading;

    res.status(200).json({
      success: true,
      vehicleType,
      distanceKm: distanceKm || 5,
      estimatedPrice: Math.round(totalPrice),
      currency: 'ETB',
      breakdown: {
        baseFare: rates.base,
        distanceFare: distanceCost,
        loadingFee: loadingAssistance ? rates.loading : 0,
        unloadingFee: unloadingAssistance ? rates.unloading : 0,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Pricing calculation failed' });
  }
};

/**
 * Create delivery request & dispatch to drivers
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      cargoCategory,
      vehicleRequested,
      pickupAddress,
      pickupLat,
      pickupLng,
      destinationAddress,
      destinationLat,
      destinationLng,
      distanceKm,
      loadingAssistance,
      unloadingAssistance,
    } = req.body;

    const rates = vehicleRates[vehicleRequested] || vehicleRates.PICKUP_TRUCK;
    let totalPrice = rates.base + ((distanceKm || 5) * rates.perKm);
    if (loadingAssistance) totalPrice += rates.loading;
    if (unloadingAssistance) totalPrice += rates.unloading;

    const newOrder = {
      id: `DLX-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customerId || 'USR-TEMP',
      cargoCategory: cargoCategory || 'OTHER',
      vehicleRequested: vehicleRequested || 'PICKUP_TRUCK',
      pickupAddress,
      pickupLat,
      pickupLng,
      destinationAddress,
      destinationLat,
      destinationLng,
      estimatedPrice: Math.round(totalPrice),
      status: 'SEARCHING_DRIVER',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Searching for nearby drivers...',
      order: newOrder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Order creation failed' });
  }
};
