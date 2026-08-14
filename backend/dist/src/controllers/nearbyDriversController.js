"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyDrivers = void 0;
const driverLocationStore_1 = require("../services/driverLocationStore");
const getNearbyDrivers = async (req, res) => {
    try {
        const lat = parseFloat(String(req.query.lat));
        const lng = parseFloat(String(req.query.lng));
        const vehicleType = req.query.vehicleType ? String(req.query.vehicleType) : undefined;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ error: 'lat and lng required' });
        }
        const drivers = (0, driverLocationStore_1.findNearbyDrivers)(lat, lng, vehicleType).map((d) => ({
            id: d.driverId,
            coordinate: { latitude: d.latitude, longitude: d.longitude },
            vehicleType: d.vehicleType,
            plateNumber: d.plateNumber,
            name: d.name,
            distanceKm: d.distanceKm,
        }));
        res.status(200).json({ success: true, drivers });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch drivers';
        res.status(500).json({ error: message });
    }
};
exports.getNearbyDrivers = getNearbyDrivers;
