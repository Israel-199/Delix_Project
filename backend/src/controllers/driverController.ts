import { Request, Response } from 'express';
import { DriverStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TRIP_CYCLE_LENGTH } from '../services/driverTripCycleService';
import { getDriverTripCycle, recordDriverTripComplete } from '../services/driverTripService';

const mockDriverList = [
  {
    id: 'DRV-101',
    name: 'Yared Moges',
    phone: '+251911234567',
    vehicleType: 'MINI_TRUCK',
    plateNumber: 'AA-3-90812',
    licenseNumber: 'ETH-89412',
    city: 'Addis Ababa',
    status: 'PENDING_APPROVAL',
    completedTrips: 0,
    commissionBalance: 0,
  },
  {
    id: 'DRV-102',
    name: 'Ahmed Hassan',
    phone: '+25377123456',
    vehicleType: 'LARGE_TRUCK',
    plateNumber: 'DJ-5-44312',
    licenseNumber: 'DJI-00319',
    city: 'Djibouti City',
    status: 'PENDING_APPROVAL',
    completedTrips: 0,
    commissionBalance: 0,
  },
  {
    id: 'DRV-103',
    name: 'Kassahun Bekele',
    phone: '+251912887766',
    vehicleType: 'PICKUP_TRUCK',
    plateNumber: 'AA-2-12894',
    licenseNumber: 'ETH-11029',
    city: 'Adama',
    status: 'ACTIVE',
    completedTrips: 6,
    commissionBalance: 350,
  },
];

export const registerDriver = async (req: Request, res: Response) => {
  try {
    const { name, phone, licenseNumber, vehicleType, plateNumber, city } = req.body;

    if (!name || !phone || !licenseNumber || !vehicleType || !plateNumber) {
      return res.status(400).json({ error: 'Missing required driver fields' });
    }

    const normalizedPhone = String(phone).replace(/\s/g, '');
    const vehicle = String(vehicleType).toUpperCase() as 'LADA_BED' | 'PICKUP_TRUCK' | 'MINI_TRUCK' | 'LARGE_TRUCK';

    try {
      let user = await prisma.user.findFirst({
        where: { OR: [{ phone }, { phone: normalizedPhone }] },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { phone: normalizedPhone, role: 'DRIVER', firstName: String(name).split(' ')[0] },
        });
      }

      const existingDriver = await prisma.driver.findFirst({
        where: { OR: [{ userId: user.id }, { plateNumber }, { licenseNumber }] },
      });

      if (existingDriver) {
        return res.status(200).json({
          success: true,
          message: 'Driver profile already exists.',
          driver: {
            id: existingDriver.id,
            plateNumber: existingDriver.plateNumber,
            vehicleType: existingDriver.vehicleType,
            status: existingDriver.status,
          },
        });
      }

      const driver = await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber,
          vehicleType: vehicle,
          plateNumber: plateNumber.toUpperCase(),
          status: 'PENDING_APPROVAL',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Driver profile registered successfully. Awaiting Admin document verification.',
        driver: {
          id: driver.id,
          name,
          phone: normalizedPhone,
          licenseNumber,
          vehicleType: driver.vehicleType,
          plateNumber: driver.plateNumber,
          city: city || 'Addis Ababa',
          status: driver.status,
          completedTrips: 0,
          commissionBalance: 0,
        },
      });
    } catch {
      // fall through to mock list
    }

    const newDriver = {
      id: `DRV-${Math.floor(100 + Math.random() * 900)}`,
      name,
      phone: normalizedPhone,
      licenseNumber,
      vehicleType,
      plateNumber: plateNumber.toUpperCase(),
      city: city || 'Addis Ababa',
      status: 'PENDING_APPROVAL',
      completedTrips: 0,
      commissionBalance: 0,
    };

    mockDriverList.push(newDriver);

    res.status(201).json({
      success: true,
      message: 'Driver profile registered successfully. Awaiting Admin document verification.',
      driver: newDriver,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Driver registration failed';
    res.status(500).json({ error: message });
  }
};

export const getDrivers = async (_req: Request, res: Response) => {
  try {
    try {
      const drivers = await prisma.driver.findMany({
        include: {
          user: { select: { phone: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (drivers.length > 0) {
        return res.status(200).json({
          success: true,
          count: drivers.length,
          drivers: drivers.map((d) => ({
            id: d.id,
            name: [d.user.firstName, d.user.lastName].filter(Boolean).join(' ') || d.plateNumber,
            phone: d.user.phone,
            vehicleType: d.vehicleType,
            plateNumber: d.plateNumber,
            licenseNumber: d.licenseNumber,
            status: d.status,
            completedTrips: d.completedTrips,
            commissionBalance: d.commissionBalance,
          })),
        });
      }
    } catch {
      // fall through to mock list
    }

    res.status(200).json({
      success: true,
      count: mockDriverList.length,
      drivers: mockDriverList,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch drivers';
    res.status(500).json({ error: message });
  }
};

export const getDriverProfile = async (req: Request, res: Response) => {
  try {
    const phone = String(req.query.phone ?? '').trim();
    if (!phone) {
      return res.status(400).json({ error: 'phone query param required' });
    }

    const normalized = phone.replace(/\s/g, '');

    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ phone }, { phone: normalized }],
        },
        include: { driverProfile: true },
      });

      if (user?.driverProfile) {
        return res.status(200).json({
          success: true,
          driver: {
            id: user.driverProfile.id,
            plateNumber: user.driverProfile.plateNumber,
            vehicleType: user.driverProfile.vehicleType,
            status: user.driverProfile.status,
            completedTrips: user.driverProfile.completedTrips,
          },
        });
      }
    } catch {
      // fall through
    }

    const mock = mockDriverList.find(
      (d) => d.phone.replace(/\s/g, '') === normalized || d.phone === phone
    );

    if (mock) {
      return res.status(200).json({
        success: true,
        driver: {
          id: mock.id,
          plateNumber: mock.plateNumber,
          vehicleType: mock.vehicleType,
          status: mock.status,
          completedTrips: mock.completedTrips,
        },
      });
    }

    res.status(200).json({ success: true, driver: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch driver profile';
    res.status(500).json({ error: message });
  }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const updated = await prisma.driver.update({
        where: { id },
        data: { status: status as DriverStatus },
      });

      return res.status(200).json({
        success: true,
        message: `Driver status updated to ${status}`,
        driver: updated,
      });
    } catch {
      // fall through
    }

    const driver = mockDriverList.find((d) => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.status = status;

    res.status(200).json({
      success: true,
      message: `Driver status updated to ${status}`,
      driver,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Driver status update failed';
    res.status(500).json({ error: message });
  }
};

export const getDriverCycle = async (req: Request, res: Response) => {
  try {
    const driverRef = String(req.params.id);
    const cycle = await getDriverTripCycle(driverRef);

    res.status(200).json({
      success: true,
      cycleLength: TRIP_CYCLE_LENGTH,
      ...cycle,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch trip cycle';
    res.status(500).json({ error: message });
  }
};

export const completeDriverTrip = async (req: Request, res: Response) => {
  try {
    const driverRef = String(req.params.id);
    const { orderId, earnings = 0 } = req.body;

    if (orderId) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' },
        });
      } catch {
        // order may be in-memory only
      }
    }

    const cycle = await recordDriverTripComplete(driverRef, Number(earnings) || 0);

    res.status(200).json({
      success: true,
      message: cycle.cycleReset
        ? 'Trip completed. 10-trip cycle finished — Telebirr commission recharge required.'
        : 'Trip completed.',
      cycleLength: TRIP_CYCLE_LENGTH,
      ...cycle,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to complete trip';
    res.status(500).json({ error: message });
  }
};
