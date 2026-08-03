export interface RecentLocation {
  id: string;
  title: string;
  subtitle: string;
  eta: string;
  latitude: number;
  longitude: number;
}

/** Verified coordinates in Addis Ababa for map placement. */
export const RECENT_LOCATIONS: RecentLocation[] = [
  {
    id: 'gerji',
    title: 'Gerji Mebrat Hail',
    subtitle: 'Energy equipment · Addis Ababa, Bole',
    eta: '14 min',
    latitude: 8.993322,
    longitude: 38.78921,
  },
  {
    id: 'golagul',
    title: 'Golagul Building',
    subtitle: 'Commercial · Addis Ababa, Bole',
    eta: '7 min',
    latitude: 9.012599,
    longitude: 38.75852,
  },
  {
    id: 'aleph',
    title: 'Aleph Hotel Bole',
    subtitle: 'Hotel · Addis Ababa, Bole, Kebele 94',
    eta: '7 min',
    latitude: 9.018656,
    longitude: 38.746645,
  },
];

export const findRecentLocation = (query: string): RecentLocation | undefined => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return undefined;

  return RECENT_LOCATIONS.find(
    (loc) =>
      loc.id === normalized ||
      loc.title.toLowerCase() === normalized ||
      normalized.includes(loc.title.toLowerCase()) ||
      loc.title.toLowerCase().includes(normalized)
  );
};
