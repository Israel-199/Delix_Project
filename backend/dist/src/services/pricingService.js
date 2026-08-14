"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePricingSettings = exports.refreshPricingCache = exports.formatPricingFormula = exports.getCachedPricing = void 0;
const prisma_1 = require("../lib/prisma");
const DEFAULT_PRICING = {
    baseFare: 300,
    perKmRate: 90,
    waitingRatePerHour: 50,
};
let cachedPricing = { ...DEFAULT_PRICING };
const getCachedPricing = () => cachedPricing;
exports.getCachedPricing = getCachedPricing;
const formatPricingFormula = (pricing) => `${pricing.baseFare} + (distanceKm × ${pricing.perKmRate}) + (waitingHours × ${pricing.waitingRatePerHour})`;
exports.formatPricingFormula = formatPricingFormula;
const refreshPricingCache = async () => {
    try {
        const row = await prisma_1.prisma.pricingSettings.findUnique({ where: { id: 'default' } });
        if (row) {
            cachedPricing = {
                baseFare: row.baseFare,
                perKmRate: row.distanceRatePerKm,
                waitingRatePerHour: row.waitingRatePerHour,
            };
        }
    }
    catch {
        cachedPricing = { ...DEFAULT_PRICING };
    }
    return cachedPricing;
};
exports.refreshPricingCache = refreshPricingCache;
const updatePricingSettings = async (payload) => {
    const baseFare = Number(payload.baseFare);
    const perKmRate = Number(payload.perKmRate);
    const waitingRatePerHour = Number(payload.waitingRatePerHour);
    if (![baseFare, perKmRate, waitingRatePerHour].every((n) => Number.isFinite(n) && n >= 0)) {
        throw new Error('Pricing values must be non-negative numbers');
    }
    try {
        const row = await prisma_1.prisma.pricingSettings.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                baseFare,
                distanceRatePerKm: perKmRate,
                waitingRatePerHour,
            },
            update: {
                baseFare,
                distanceRatePerKm: perKmRate,
                waitingRatePerHour,
            },
        });
        cachedPricing = {
            baseFare: row.baseFare,
            perKmRate: row.distanceRatePerKm,
            waitingRatePerHour: row.waitingRatePerHour,
        };
    }
    catch {
        cachedPricing = { baseFare, perKmRate, waitingRatePerHour };
    }
    return cachedPricing;
};
exports.updatePricingSettings = updatePricingSettings;
