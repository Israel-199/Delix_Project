"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRoute = exports.getNearbyRecommendations = exports.saveRecentLocation = exports.getRecentLocations = exports.searchLocations = void 0;
const prisma_1 = require("../lib/prisma");
const userResolver_1 = require("../utils/userResolver");
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const recentByUser = new Map();
const resolveUserKey = async (userRef) => {
    if (userRef === 'guest')
        return 'guest';
    try {
        return await (0, userResolver_1.resolveCustomerUserId)(userRef);
    }
    catch {
        return userRef;
    }
};
const formatLocation = (loc) => ({
    id: loc.id ?? `${loc.latitude}-${loc.longitude}`,
    title: loc.placeName ?? loc.title ?? 'Location',
    subtitle: loc.address ?? loc.subtitle ?? '',
    latitude: loc.latitude,
    longitude: loc.longitude,
});
const searchLocations = async (req, res) => {
    try {
        const q = String(req.query.q ?? '').trim();
        if (q.length < 2) {
            return res.status(200).json({ success: true, results: [] });
        }
        const params = new URLSearchParams({
            q: `${q}, Addis Ababa, Ethiopia`,
            format: 'json',
            limit: '8',
            countrycodes: 'et',
        });
        const response = await fetch(`${NOMINATIM}?${params.toString()}`, {
            headers: { 'User-Agent': 'DelixBackend/1.0' },
        });
        if (!response.ok) {
            return res.status(502).json({ error: 'Location search unavailable' });
        }
        const raw = (await response.json());
        const results = raw.map((item, index) => ({
            id: `search-${index}`,
            title: item.display_name.split(',')[0],
            subtitle: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        }));
        res.status(200).json({ success: true, results });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Search failed';
        res.status(500).json({ error: message });
    }
};
exports.searchLocations = searchLocations;
const getRecentLocations = async (req, res) => {
    const userRef = String(req.query.userId ?? 'guest');
    try {
        if (userRef !== 'guest') {
            const userId = await resolveUserKey(userRef);
            const saved = await prisma_1.prisma.savedLocation.findMany({
                where: { userId },
                orderBy: [{ selectionCount: 'desc' }, { lastSelectedAt: 'desc' }],
                take: 10,
            });
            if (saved.length > 0) {
                return res.status(200).json({
                    success: true,
                    locations: saved.map((loc) => formatLocation({
                        id: loc.id,
                        placeName: loc.placeName,
                        address: loc.address,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                    })),
                });
            }
        }
    }
    catch {
        // fall through to memory
    }
    const saved = recentByUser.get(userRef) ?? [];
    res.status(200).json({
        success: true,
        locations: saved
            .sort((a, b) => b.selectionCount - a.selectionCount)
            .slice(0, 10)
            .map((loc) => formatLocation(loc)),
    });
};
exports.getRecentLocations = getRecentLocations;
const saveRecentLocation = async (req, res) => {
    try {
        const { userId = 'guest', placeName, address, latitude, longitude } = req.body;
        if (!placeName || latitude == null || longitude == null) {
            return res.status(400).json({ error: 'Invalid location payload' });
        }
        const lat = Number(latitude);
        const lng = Number(longitude);
        try {
            if (userId !== 'guest') {
                const resolvedUserId = await resolveUserKey(String(userId));
                const existing = await prisma_1.prisma.savedLocation.findFirst({
                    where: {
                        userId: resolvedUserId,
                        latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
                        longitude: { gte: lng - 0.0001, lte: lng + 0.0001 },
                    },
                });
                if (existing) {
                    await prisma_1.prisma.savedLocation.update({
                        where: { id: existing.id },
                        data: {
                            selectionCount: existing.selectionCount + 1,
                            lastSelectedAt: new Date(),
                            placeName,
                            address: address ?? placeName,
                        },
                    });
                }
                else {
                    await prisma_1.prisma.savedLocation.create({
                        data: {
                            userId: resolvedUserId,
                            placeName,
                            address: address ?? placeName,
                            latitude: lat,
                            longitude: lng,
                        },
                    });
                }
                return res.status(201).json({ success: true });
            }
        }
        catch {
            // fall through to memory
        }
        const key = String(userId);
        const list = recentByUser.get(key) ?? [];
        const existing = list.find((l) => Math.abs(l.latitude - lat) < 0.0001 && Math.abs(l.longitude - lng) < 0.0001);
        if (existing) {
            existing.selectionCount += 1;
            existing.lastSelectedAt = new Date().toISOString();
        }
        else {
            list.push({
                userId: key,
                placeName,
                address: address ?? placeName,
                latitude: lat,
                longitude: lng,
                selectionCount: 1,
                lastSelectedAt: new Date().toISOString(),
            });
        }
        recentByUser.set(key, list);
        res.status(201).json({ success: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Save failed';
        res.status(500).json({ error: message });
    }
};
exports.saveRecentLocation = saveRecentLocation;
const getNearbyRecommendations = async (req, res) => {
    try {
        const lat = parseFloat(String(req.query.lat));
        const lng = parseFloat(String(req.query.lng));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ error: 'lat and lng required' });
        }
        const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lng),
            format: 'json',
            addressdetails: '1',
            limit: '4',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { headers: { 'User-Agent': 'DelixBackend/1.0' } });
        const reverse = response.ok ? await response.json() : null;
        const area = reverse?.address?.suburb ?? reverse?.address?.city ?? 'Nearby';
        const searchParams = new URLSearchParams({
            q: `${area}, Addis Ababa, Ethiopia`,
            format: 'json',
            limit: '4',
        });
        const searchRes = await fetch(`${NOMINATIM}?${searchParams.toString()}`, {
            headers: { 'User-Agent': 'DelixBackend/1.0' },
        });
        const raw = searchRes.ok
            ? (await searchRes.json())
            : [];
        const results = raw.slice(0, 4).map((item, index) => ({
            id: `nearby-${index}`,
            title: item.display_name.split(',')[0],
            subtitle: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        }));
        res.status(200).json({ success: true, results });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Recommendations failed';
        res.status(500).json({ error: message });
    }
};
exports.getNearbyRecommendations = getNearbyRecommendations;
const OSRM_ROUTE_URL = process.env.ROUTING_PROVIDER_URL || 'https://router.project-osrm.org/route/v1/driving';
const routeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const calculateRoute = async (req, res) => {
    try {
        const { from, to } = req.body;
        if (!from?.latitude || !from?.longitude || !to?.latitude || !to?.longitude) {
            return res.status(400).json({ error: 'Valid from and to coordinates required' });
        }
        const fromLat = Number(from.latitude);
        const fromLng = Number(from.longitude);
        const toLat = Number(to.latitude);
        const toLng = Number(to.longitude);
        const cacheKey = `${fromLng.toFixed(4)},${fromLat.toFixed(4)};${toLng.toFixed(4)},${toLat.toFixed(4)}`;
        const cached = routeCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return res.status(200).json({ success: true, ...cached.data });
        }
        const url = `${OSRM_ROUTE_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&alternatives=true&steps=false`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'DelixBackend/1.0' },
        });
        if (response.ok) {
            const data = (await response.json());
            if (data.code === 'Ok' && data.routes?.length) {
                const sorted = [...data.routes].sort((a, b) => a.duration - b.duration)[0];
                const rawCoords = sorted.geometry?.coordinates || [];
                const coordinates = rawCoords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
                const distanceKm = Math.round((sorted.distance / 1000) * 10) / 10;
                const durationSeconds = Math.round(sorted.duration);
                const minutes = Math.max(1, Math.round(durationSeconds / 60));
                const durationLabel = `${minutes} min`;
                const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
                const arrivalTime = arrivalDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                const arrivalLabel = `Arrive ${arrivalTime}`;
                const payload = {
                    coordinates,
                    distanceKm,
                    durationSeconds,
                    durationLabel,
                    arrivalTime,
                    arrivalLabel,
                    followsRoads: true,
                };
                routeCache.set(cacheKey, { timestamp: Date.now(), data: payload });
                return res.status(200).json({ success: true, ...payload });
            }
        }
        // Fallback straight-line estimation if OSRM is unreachable
        const latDiff = toLat - fromLat;
        const lngDiff = toLng - fromLng;
        const distanceKm = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111 * 10) / 10;
        const durationSeconds = Math.max(60, Math.round((distanceKm / 25) * 3600));
        const minutes = Math.max(1, Math.round(durationSeconds / 60));
        const durationLabel = `${minutes} min`;
        const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
        const arrivalTime = arrivalDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return res.status(200).json({
            success: true,
            coordinates: [{ latitude: fromLat, longitude: fromLng }, { latitude: toLat, longitude: toLng }],
            distanceKm,
            durationSeconds,
            durationLabel,
            arrivalTime,
            arrivalLabel: `Arrive ${arrivalTime}`,
            followsRoads: false,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Route calculation failed';
        res.status(500).json({ error: message });
    }
};
exports.calculateRoute = calculateRoute;
