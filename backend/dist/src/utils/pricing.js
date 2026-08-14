"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAuthoritativeFare = exports.WAITING_RATE_ETB_PER_HOUR = exports.DISTANCE_RATE_ETB_PER_KM = exports.BASE_FARE_ETB = void 0;
const pricingService_1 = require("../services/pricingService");
exports.BASE_FARE_ETB = 300;
exports.DISTANCE_RATE_ETB_PER_KM = 90;
exports.WAITING_RATE_ETB_PER_HOUR = 50;
const calculateAuthoritativeFare = (distanceKm, waitingHours = 0) => {
    const pricing = (0, pricingService_1.getCachedPricing)();
    const base = pricing.baseFare;
    const distance = Math.round(distanceKm * pricing.perKmRate);
    const waiting = Math.round(waitingHours * pricing.waitingRatePerHour);
    return {
        priceAmount: base + distance + waiting,
        currency: 'ETB',
        breakdown: { base, distance, waiting },
    };
};
exports.calculateAuthoritativeFare = calculateAuthoritativeFare;
