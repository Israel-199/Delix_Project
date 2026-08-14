import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  BASE_FARE_ETB,
  DISTANCE_RATE_ETB_PER_KM,
  WAITING_RATE_ETB_PER_HOUR,
} from '../utils/pricing';
import { getAllLiveDrivers } from '../services/driverLocationStore';
import { TRIP_CYCLE_LENGTH } from '../services/driverTripCycleService';
import { resetDriverTripCycle } from '../services/driverTripService';
import { notifyDriver } from '../services/driverNotificationService';
import {
  formatPricingFormula,
  getCachedPricing,
  refreshPricingCache,
  updatePricingSettings,
} from '../services/pricingService';

const formatOrderStatus = (status: string) => {
  switch (status) {
    case 'SEARCHING_DRIVER':
      return 'Searching';
    case 'DRIVER_ACCEPTED':
    case 'ARRIVED_PICKUP':
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

export const getAdminStats = async (_req: Request, res: Response) => {
  try {
    const [activeOrders, completedOrders, drivers, users] = await Promise.all([
      prisma.order.count({
        where: {
          status: { in: ['SEARCHING_DRIVER', 'DRIVER_ACCEPTED', 'ARRIVED_PICKUP', 'IN_TRANSIT'] },
        },
      }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.driver.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        activeDeliveries: activeOrders,
        verifiedDrivers: drivers,
        completedOrders,
        totalUsers: users,
      },
    });
  } catch {
    return res.status(200).json({
      success: true,
      stats: {
        activeDeliveries: 0,
        verifiedDrivers: 0,
        completedOrders: 0,
        totalUsers: 0,
      },
    });
  }
};

export const getAdminOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { phone: true, firstName: true, lastName: true } },
        driver: {
          select: {
            plateNumber: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json({
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        customerName:
          [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') ||
          'Customer',
        customerPhone: order.customer.phone,
        cargoCategory: order.cargoCategory.replace(/_/g, ' '),
        vehicleRequested: order.vehicleRequested.replace(/_/g, ' '),
        pickup: order.pickupAddress,
        destination: order.destinationAddress,
        price: `${Math.round(order.estimatedPrice)} ETB`,
        status: formatOrderStatus(order.status),
        date: order.createdAt.toISOString(),
        driverPlate: order.driver?.plateNumber ?? null,
      })),
    });
  } catch {
    return res.status(200).json({ success: true, orders: [] });
  }
};

export const getPricingConfig = async (_req: Request, res: Response) => {
  await refreshPricingCache();
  const pricing = getCachedPricing();

  res.status(200).json({
    success: true,
    pricing: {
      baseFare: pricing.baseFare,
      perKmRate: pricing.perKmRate,
      waitingRatePerHour: pricing.waitingRatePerHour,
      formula: formatPricingFormula(pricing),
    },
  });
};

export const updatePricingConfig = async (req: Request, res: Response) => {
  try {
    const pricing = await updatePricingSettings({
      baseFare: Number(req.body.baseFare ?? BASE_FARE_ETB),
      perKmRate: Number(req.body.perKmRate ?? DISTANCE_RATE_ETB_PER_KM),
      waitingRatePerHour: Number(req.body.waitingRatePerHour ?? WAITING_RATE_ETB_PER_HOUR),
    });

    res.status(200).json({
      success: true,
      message: 'Pricing updated. New rates apply immediately to all estimates and orders.',
      pricing: {
        baseFare: pricing.baseFare,
        perKmRate: pricing.perKmRate,
        waitingRatePerHour: pricing.waitingRatePerHour,
        formula: formatPricingFormula(pricing),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Pricing update failed';
    res.status(400).json({ error: message });
  }
};

export const getLiveDrivers = async (_req: Request, res: Response) => {
  const drivers = getAllLiveDrivers().map((d) => ({
    id: d.driverId,
    latitude: d.latitude,
    longitude: d.longitude,
    vehicleType: d.vehicleType,
    plateNumber: d.plateNumber,
    name: d.name,
    available: d.available,
    lastUpdate: d.lastUpdate,
  }));

  res.status(200).json({ success: true, drivers });
};

export const getAdminCommissions = async (_req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: { select: { phone: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const commissions = drivers.map((driver) => {
      const completedTripsInCycle = driver.completedTrips % TRIP_CYCLE_LENGTH;
      const needsRecharge = driver.commissionBalance > 0 && completedTripsInCycle === 0;

      return {
        driverId: driver.id,
        driverName:
          [driver.user.firstName, driver.user.lastName].filter(Boolean).join(' ') ||
          driver.plateNumber,
        phone: driver.user.phone,
        completedTripsInCycle,
        cycleStatus: needsRecharge ? 'Recharge Required' : 'Active',
        commissionAmount: Math.round(driver.commissionBalance),
        lastPaymentDate: driver.updatedAt.toISOString().slice(0, 10),
      };
    });

    return res.status(200).json({ success: true, commissions });
  } catch {
    return res.status(200).json({ success: true, commissions: [] });
  }
};

export const resetDriverCommissionCycle = async (req: Request, res: Response) => {
  try {
    const driverRef = String(req.params.id);
    const cycle = await resetDriverTripCycle(driverRef);

    await notifyDriver(
      driverRef,
      'PAYMENT_CONFIRMED',
      'Payment confirmed',
      'Your Delix commission payment was confirmed. A new 10-trip cycle has started.'
    );

    return res.status(200).json({
      success: true,
      message: 'Commission cycle reset. Driver can start a new 10-trip batch.',
      ...cycle,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset cycle';
    return res.status(500).json({ error: message });
  }
};

export const getAdminUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        _count: { select: { customerOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        name:
          [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') ||
          user.phone,
        phone: user.phone,
        totalOrders: user._count.customerOrders,
        registeredDate: user.createdAt.toISOString().slice(0, 10),
        status: user.isBlocked ? 'Blocked' : 'Active',
      })),
    });
  } catch {
    return res.status(200).json({ success: true, users: [] });
  }
};

export const updateUserBlockStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'blocked boolean required' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked: blocked },
    });

    return res.status(200).json({
      success: true,
      message: blocked ? 'Customer account blocked' : 'Customer account unblocked',
      user: {
        id: user.id,
        phone: user.phone,
        status: user.isBlocked ? 'Blocked' : 'Active',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user status';
    return res.status(500).json({ error: message });
  }
};

export const getAdminDriverDocuments = async (req: Request, res: Response) => {
  try {
    const driverRef = String(req.params.id);
    const driver = await prisma.driver.findFirst({
      where: {
        OR: [
          { id: driverRef },
          { plateNumber: driverRef },
          { licenseNumber: driverRef },
          { user: { phone: driverRef } },
        ],
      },
    });

    if (!driver) {
      return res.status(200).json({ success: true, documents: [], requiredTypes: [] });
    }

    const documents = await prisma.driverDocument.findMany({
      where: { driverId: driver.id },
      orderBy: { type: 'asc' },
    });

    return res.status(200).json({
      success: true,
      documents: documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        publicId: doc.publicId,
        updatedAt: doc.updatedAt.toISOString(),
      })),
      requiredTypes: ['LICENSE', 'NATIONAL_ID', 'REGISTRATION_BOOK', 'INSURANCE'],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load driver documents';
    return res.status(500).json({ error: message });
  }
};
