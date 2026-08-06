export const VEHICLE_ICONS: Record<string, string> = {
  LADA_BED: '🚕',
  PICKUP_TRUCK: '🛻',
  MINI_TRUCK: '🚚',
  LARGE_TRUCK: '🚛',
};

export const vehicleIcon = (type?: string) =>
  VEHICLE_ICONS[type?.toUpperCase() ?? ''] ?? '🛻';

export type LatLng = { latitude: number; longitude: number };

export const fetchRoute = async (
  from: LatLng,
  to: LatLng
): Promise<LatLng[]> => {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) return [from, to];

    const data = (await response.json()) as {
      routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
    };

    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) return [from, to];

    return [
      from,
      ...coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      to,
    ];
  } catch {
    return [from, to];
  }
};

export const orderPickup = (order: Record<string, unknown> | null): LatLng => ({
  latitude: Number(order?.pickupLat) || 9.0205,
  longitude: Number(order?.pickupLng) || 38.7469,
});

export const orderDestination = (order: Record<string, unknown> | null): LatLng => ({
  latitude: Number(order?.destinationLat) || 9.0305,
  longitude: Number(order?.destinationLng) || 38.7669,
});
