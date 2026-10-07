import { Badge, CitizenUser, LeaderboardEntry } from '../types';

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_scan',
    name: 'Vision Pioneer',
    description: 'Scanned your first waste item using Gemini AI Vision',
    icon: 'Scan',
    unlocked: true,
    unlockedAt: 'Yesterday',
  },
  {
    id: 'litter_buster',
    name: 'Litter Buster',
    description: 'Reported an overflowing bin or illegal dumping site',
    icon: 'AlertTriangle',
    unlocked: true,
    unlockedAt: '3 days ago',
  },
  {
    id: 'route_maestro',
    name: 'Route Maestro',
    description: 'Ran dynamic route optimization to reduce fleet transit emissions',
    icon: 'Route',
    unlocked: false,
  },
  {
    id: 'hazard_guardian',
    name: 'Hazard Guardian',
    description: 'Safely identified hazardous materials (e-waste/batteries)',
    icon: 'ShieldAlert',
    unlocked: false,
  },
  {
    id: 'zero_waste_hero',
    name: 'Zero-Waste Hero',
    description: 'Achieved over 500 lifetime civic green points',
    icon: 'Award',
    unlocked: false,
  },
];

export const INITIAL_USER: CitizenUser = {
  id: 'usr_007',
  name: 'Aarav Sharma',
  avatar: 'AS',
  points: 380,
  level: 'Clean City Scout',
  reportsSubmitted: 3,
  scansCompleted: 8,
  cleanupsVerified: 1,
  badges: INITIAL_BADGES,
};

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Kavya Nair',
    area: 'Jubilee Hills Ward 94',
    points: 840,
    scans: 28,
    reports: 11,
    badge: 'Eco Vanguard',
  },
  {
    rank: 2,
    name: 'Sneha Rao',
    area: 'Begumpet Ward 78',
    points: 690,
    scans: 22,
    reports: 9,
    badge: 'Zero-Waste Hero',
  },
  {
    rank: 3,
    name: 'Rajesh Patel',
    area: 'HITEC City Ward 102',
    points: 520,
    scans: 17,
    reports: 6,
    badge: 'Clean City Scout',
  },
  {
    rank: 4,
    name: 'Aarav Sharma',
    area: 'Banjara Hills Ward 88',
    points: 380,
    scans: 8,
    reports: 3,
    badge: 'Clean City Scout',
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: 'Fatima Begum',
    area: 'Charminar Ward 45',
    points: 340,
    scans: 12,
    reports: 4,
    badge: 'Litter Buster',
  },
  {
    rank: 6,
    name: 'Pradeep Kumar',
    area: 'Gachibowli Ward 105',
    points: 290,
    scans: 9,
    reports: 2,
    badge: 'Vision Pioneer',
  },
];

export function getLevelForPoints(points: number): string {
  if (points >= 1000) return 'Sanitation Vanguard';
  if (points >= 600) return 'Green Champion';
  if (points >= 300) return 'Clean City Scout';
  return 'Eco Rookie';
}
