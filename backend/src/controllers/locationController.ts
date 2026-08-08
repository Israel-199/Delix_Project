import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { resolveCustomerUserId } from '../utils/userResolver';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

interface SavedLocationMemory {
  userId: string;
  placeName: string;
  address: string;
  latitude: number;
  longitude: number;
  selectionCount: number;
  lastSelectedAt: string;
}

const recentByUser = new Map<string, SavedLocationMemory[]>();

const resolveUserKey = async (userRef: string): Promise<string> => {
  if (userRef === 'guest') return 'guest';

  try {
    return await resolveCustomerUserId(userRef);
  } catch {
    return userRef;
  }
};

const formatLocation = (loc: {
  id?: string;
  placeName?: string;
  title?: string;
  address?: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
}) => ({
  id: loc.id ?? `${loc.latitude}-${loc.longitude}`,
  title: loc.placeName ?? loc.title ?? 'Location',
  subtitle: loc.address ?? loc.subtitle ?? '',
  latitude: loc.latitude,
  longitude: loc.longitude,
});

export const searchLocations = async (req: Request, res: Response) => {
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

    const raw = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    const results = raw.map((item, index) => ({
      id: `search-${index}`,
      title: item.display_name.split(',')[0],
      subtitle: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    res.status(200).json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    res.status(500).json({ error: message });
  }
};

export const getRecentLocations = async (req: Request, res: Response) => {
  const userRef = String(req.query.userId ?? 'guest');

  try {
    if (userRef !== 'guest') {
      const userId = await resolveUserKey(userRef);
      const saved = await prisma.savedLocation.findMany({
        where: { userId },
        orderBy: [{ selectionCount: 'desc' }, { lastSelectedAt: 'desc' }],
        take: 10,
      });

      if (saved.length > 0) {
        return res.status(200).json({
          success: true,
          locations: saved.map((loc) =>
            formatLocation({
              id: loc.id,
              placeName: loc.placeName,
              address: loc.address,
              latitude: loc.latitude,
              longitude: loc.longitude,
            })
          ),
        });
      }
    }
  } catch {
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

export const saveRecentLocation = async (req: Request, res: Response) => {
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

        const existing = await prisma.savedLocation.findFirst({
          where: {
            userId: resolvedUserId,
            latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
            longitude: { gte: lng - 0.0001, lte: lng + 0.0001 },
          },
        });

        if (existing) {
          await prisma.savedLocation.update({
            where: { id: existing.id },
            data: {
              selectionCount: existing.selectionCount + 1,
              lastSelectedAt: new Date(),
              placeName,
              address: address ?? placeName,
            },
          });
        } else {
          await prisma.savedLocation.create({
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
    } catch {
      // fall through to memory
    }

    const key = String(userId);
    const list = recentByUser.get(key) ?? [];
    const existing = list.find(
      (l) => Math.abs(l.latitude - lat) < 0.0001 && Math.abs(l.longitude - lng) < 0.0001
    );

    if (existing) {
      existing.selectionCount += 1;
      existing.lastSelectedAt = new Date().toISOString();
    } else {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Save failed';
    res.status(500).json({ error: message });
  }
};

export const getNearbyRecommendations = async (req: Request, res: Response) => {
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

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      { headers: { 'User-Agent': 'DelixBackend/1.0' } }
    );

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
      ? ((await searchRes.json()) as Array<{ lat: string; lon: string; display_name: string }>)
      : [];

    const results = raw.slice(0, 4).map((item, index) => ({
      id: `nearby-${index}`,
      title: item.display_name.split(',')[0],
      subtitle: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    res.status(200).json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Recommendations failed';
    res.status(500).json({ error: message });
  }
};
