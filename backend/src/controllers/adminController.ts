import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  BASE_FARE_ETB,
  DISTANCE_RATE_ETB_PER_KM,
  WAITING_RATE_ETB_PER_HOUR,
} from '../utils/pricing';
import { getAllLiveDrivers } from '../services/driverLocationStore';

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
  res.status(200).json({
    success: true,
    pricing: {
      baseFare: BASE_FARE_ETB,
      perKmRate: DISTANCE_RATE_ETB_PER_KM,
      waitingRatePerHour: WAITING_RATE_ETB_PER_HOUR,
      formula: '300 + (distanceKm × 90) + (waitingHours × 50)',
    },
  });
};

export const updatePricingConfig = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message:
      'Pricing constants are compiled into the backend. Update pricing.ts and redeploy to change rates.',
    pricing: {
      baseFare: Number(req.body.baseFare ?? BASE_FARE_ETB),
      perKmRate: Number(req.body.perKmRate ?? DISTANCE_RATE_ETB_PER_KM),
      waitingRatePerHour: Number(req.body.waitingRatePerHour ?? WAITING_RATE_ETB_PER_HOUR),
    },
  });
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
