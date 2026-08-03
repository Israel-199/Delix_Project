export interface RecentLocation {
  id: string;
  title: string;
  subtitle: string;
  eta: string;
}

export const RECENT_LOCATIONS: RecentLocation[] = [
  {
    id: 'gerji',
    title: 'Gerji Mebrat Hail',
    subtitle: 'Energy equipment · Addis Ababa, Bole',
    eta: '14 min',
  },
  {
    id: 'golagul',
    title: 'Golagul Building',
    subtitle: 'Commercial · Addis Ababa, Bole',
    eta: '7 min',
  },
  {
    id: 'aleph',
    title: 'Aleph Hotel Bole',
    subtitle: 'Hotel · Addis Ababa, Bole, Kebele 94',
    eta: '7 min',
  },
];
