export type LatLng = { latitude: number; longitude: number };

const isSamePoint = (a: LatLng, b: LatLng, epsilon = 0.000008): boolean =>
  Math.abs(a.latitude - b.latitude) < epsilon &&
  Math.abs(a.longitude - b.longitude) < epsilon;

/**
 * Ensures the polyline starts at the user's exact GPS and ends at the destination pin.
 * Connects with a short segment from the real position to the nearest road point.
 */
export const anchorRouteToEndpoints = (
  route: LatLng[],
  origin: LatLng,
  destination: LatLng
): LatLng[] => {
  if (!route.length) {
    return [origin, destination];
  }

  let coords = [...route];

  if (!isSamePoint(coords[0], origin)) {
    coords = [origin, ...coords];
  } else {
    coords[0] = { ...origin };
  }

  const lastIndex = coords.length - 1;
  if (!isSamePoint(coords[lastIndex], destination)) {
    coords = [...coords, destination];
  } else {
    coords[lastIndex] = { ...destination };
  }

  return coords;
};

/** Move the green line start to the user's current exact GPS as they move. */
export const anchorRouteStartToUser = (
  route: LatLng[],
  user: LatLng
): LatLng[] => {
  if (!route.length) return [{ ...user }];
  const roadPart = route.slice(1);
  return [{ ...user }, ...roadPart];
};
