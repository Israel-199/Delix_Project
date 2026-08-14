"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllLiveDrivers = exports.findNearbyDrivers = exports.setDriverOffline = exports.markDriverUnavailable = exports.upsertDriverLocation = void 0;
const liveDrivers = new Map();
const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const upsertDriverLocation = (payload) => {
    liveDrivers.set(payload.driverId, {
        driverId: payload.driverId,
        latitude: payload.lat,
        longitude: payload.lng,
        vehicleType: payload.vehicleType,
        online: payload.online ?? true,
        available: payload.available ?? true,
        approved: payload.approved ?? true,
        plateNumber: payload.plateNumber,
        name: payload.name,
        lastUpdate: new Date().toISOString(),
    });
};
exports.upsertDriverLocation = upsertDriverLocation;
const markDriverUnavailable = (driverId) => {
    const existing = liveDrivers.get(driverId);
    if (existing) {
        liveDrivers.set(driverId, {
            ...existing,
            available: false,
            lastUpdate: new Date().toISOString(),
        });
    }
};
exports.markDriverUnavailable = markDriverUnavailable;
const setDriverOffline = (driverId) => {
    const existing = liveDrivers.get(driverId);
    if (existing) {
        liveDrivers.set(driverId, {
            ...existing,
            online: false,
            available: false,
            lastUpdate: new Date().toISOString(),
        });
    }
};
exports.setDriverOffline = setDriverOffline;
const findNearbyDrivers = (lat, lng, vehicleType, radiusKm = 15) => {
    const normalizedType = vehicleType?.toUpperCase();
    return Array.from(liveDrivers.values())
        .filter((d) => d.online && d.available && d.approved)
        .filter((d) => !normalizedType || d.vehicleType.toUpperCase() === normalizedType)
        .map((d) => ({
        ...d,
        distanceKm: Math.round(haversineKm(lat, lng, d.latitude, d.longitude) * 10) / 10,
    }))
        .filter((d) => d.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 20);
};
exports.findNearbyDrivers = findNearbyDrivers;
const getAllLiveDrivers = () => Array.from(liveDrivers.values()).filter((d) => d.online);
exports.getAllLiveDrivers = getAllLiveDrivers;
