import { Request, Response } from 'express';

// Driver state in-memory mock for high-speed API response
const mockDriverList = [
  { id: 'DRV-101', name: 'Yared Moges', phone: '+251 911 234 567', vehicleType: 'MINI_TRUCK', plateNumber: 'AA-3-90812', licenseNumber: 'ETH-89412', city: 'Addis Ababa', status: 'PENDING_APPROVAL', completedTrips: 0, commissionBalance: 0 },
  { id: 'DRV-102', name: 'Ahmed Hassan', phone: '+253 77 12 34 56', vehicleType: 'LARGE_TRUCK', plateNumber: 'DJ-5-44312', licenseNumber: 'DJI-00319', city: 'Djibouti City', status: 'PENDING_APPROVAL', completedTrips: 0, commissionBalance: 0 },
  { id: 'DRV-103', name: 'Kassahun Bekele', phone: '+251 912 887 766', vehicleType: 'PICKUP_TRUCK', plateNumber: 'AA-2-12894', licenseNumber: 'ETH-11029', city: 'Adama', status: 'ACTIVE', completedTrips: 10, commissionBalance: 350 },
];

/**
 * Register Driver Profile & Upload Credentials
 */
export const registerDriver = async (req: Request, res: Response) => {
  try {
    const { name, phone, licenseNumber, vehicleType, plateNumber, city } = req.body;

    const newDriver = {
      id: `DRV-${Math.floor(100 + Math.random() * 900)}`,
      name,
      phone,
      licenseNumber,
      vehicleType,
      plateNumber,
      city: city || 'Addis Ababa',
      status: 'PENDING_APPROVAL',
      completedTrips: 0,
      commissionBalance: 0
    };

    mockDriverList.push(newDriver);

    res.status(201).json({
      success: true,
      message: 'Driver profile registered successfully. Awaiting Admin document verification.',
      driver: newDriver
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Driver registration failed' });
  }
};

/**
 * Get all drivers for Admin Approval panel
 */
export const getDrivers = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      count: mockDriverList.length,
      drivers: mockDriverList
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch drivers' });
  }
};

/**
 * Update Driver Status (Approve / Suspend)
 */
export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const driver = mockDriverList.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.status = status;

    res.status(200).json({
      success: true,
      message: `Driver status updated to ${status}`,
      driver
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Driver status update failed' });
  }
};
