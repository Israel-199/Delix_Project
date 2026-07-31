import { Request, Response } from 'express';

// Strict 150 ETB per kilometer standard logic as requested
const BASE_RATE_PER_KM_ETB = 150;
const ETB_TO_DJF_RATE = 3.15; // Approximate conversion rate

// Vehicle Add-on Fees (Assuming fixed for now)
const vehicleRates: Record<string, { base: number; loading: number; unloading: number }> = {
  LADA_BED: { base: 150, loading: 50, unloading: 50 },
  PICKUP_TRUCK: { base: 250, loading: 100, unloading: 100 },
  MINI_TRUCK: { base: 450, loading: 200, unloading: 200 },
  LARGE_TRUCK: { base: 1200, loading: 500, unloading: 500 },
};

/**
 * Helper to Calculate Price based on user location (Djibouti or Ethiopia)
 */
const calculatePrice = (vehicleType: string, distanceKm: number, pickupAddress: string, hasLoading: boolean, hasUnloading: boolean) => {
  const rates = vehicleRates[vehicleType] || vehicleRates.PICKUP_TRUCK;
  const isDjibouti = pickupAddress.toLowerCase().includes('djibouti');
  
  // Total in ETB
  let totalEtb = rates.base + ((distanceKm || 5) * BASE_RATE_PER_KM_ETB);
  if (hasLoading) totalEtb += rates.loading;
  if (hasUnloading) totalEtb += rates.unloading;

  // Conversion logic
  if (isDjibouti) {
    return {
      priceAmount: Math.round(totalEtb * ETB_TO_DJF_RATE),
      currency: 'DJF',
    };
  }

  return {
    priceAmount: Math.round(totalEtb),
    currency: 'ETB',
  };
};

/**
 * Calculate estimated distance & price for cargo delivery
 */
export const estimateOrderPrice = async (req: Request, res: Response) => {
  try {
    const { vehicleType, distanceKm, pickupAddress = 'Addis Ababa', loadingAssistance = false, unloadingAssistance = false } = req.body;

    const { priceAmount, currency } = calculatePrice(vehicleType, distanceKm, pickupAddress, loadingAssistance, unloadingAssistance);

    res.status(200).json({
      success: true,
      vehicleType,
      distanceKm: distanceKm || 5,
      estimatedPrice: priceAmount,
      currency,
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
      paymentMethod // NEW: CBE, Cash, Telebirr
    } = req.body;

    const { priceAmount, currency } = calculatePrice(
      vehicleRequested || 'PICKUP_TRUCK', 
      distanceKm, 
      pickupAddress || 'Addis Ababa', 
      loadingAssistance, 
      unloadingAssistance
    );

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
      estimatedPrice: priceAmount,
      currency,
      paymentMethod: paymentMethod || 'Cash',
      status: 'SEARCHING_DRIVER',
      createdAt: new Date().toISOString()
    };

    // In a real production system with PostGIS, we would use:
    // UPDATE driver SET status='PINGED' WHERE ST_DWithin(location, pickup, 5000)
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully. Searching for nearby drivers...',
      order: newOrder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Order creation failed' });
  }
};
