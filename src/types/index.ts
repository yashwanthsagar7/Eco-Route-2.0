export type WasteType = 'Wet' | 'Dry' | 'Recyclable' | 'Hazardous';

export type BinStatus = 'Normal' | 'Warning' | 'Critical' | 'Overflowing';

export interface SmartBin {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  type: WasteType;
  fillLevel: number; // 0 - 100
  temperature: number; // in Celsius
  lastCollected: string;
  status: BinStatus;
  battery: number; // IoT battery percentage
  capacityLiters: number;
  distanceMeters?: number; // Distance from user's current GPS location
}

export interface CityConfig {
  name: string;
  state: string;
  country: string;
  center: [number, number];
  defaultZoom: number;
  depot: {
    name: string;
    lat: number;
    lng: number;
  };
}

export interface TruckRoute {
  truckId: number;
  truckName: string;
  color: string;
  stops: SmartBin[];
  pathCoords: [number, number][];
  totalDistanceKm: number;
  estimatedMinutes: number;
  totalCollectedKg: number;
}

export interface RouteOptimizationResult {
  trucks: TruckRoute[];
  criticalBinsCount: number;
  baselineDistanceKm: number; // Visiting all 40 bins
  optimizedDistanceKm: number;
  distanceSavedKm: number;
  percentageSaved: number;
  fuelSavedLitres: number;
  co2SavedKg: number;
}

export interface WasteScanResult {
  wasteType: string;
  items: string[];
  recyclable: boolean;
  correctBin: WasteType;
  disposalTips: string[];
  environmentalImpact: string;
  confidence: number;
  ecoScore: number;
}

export interface CitizenReport {
  id: string;
  title: string;
  description: string;
  imageUrl?: string; // "Before" photo of garbage
  afterImageUrl?: string; // "After" photo of cleaned site
  cleanedAt?: string;
  cleanedBy?: string;
  cleaningNotes?: string;
  lat: number;
  lng: number;
  area: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Reported' | 'Assigned' | 'Resolved';
  assignedTruckId?: number;
  timestamp: string;
  reporterName: string;
  pointsAwarded: number;
  estimatedVolumeKg?: number;
  priorityAction?: string;
  distanceMeters?: number; // Distance from user's current GPS location
  aiVerification?: {
    verified: boolean;
    confidence: number;
    cleanlinessRating: string;
    comments: string;
    pointsBonus: number;
  };
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  type: 'clean_garbage' | 'scan_waste' | 'report_overflow' | 'neighborhood_sweep';
  targetCount: number;
  currentCount: number;
  rewardPoints: number;
  rewardBadge?: string;
  isCompleted: boolean;
  certificateEligible: boolean;
  expiresInDays: number;
  icon: string;
}

export interface AppreciationCertificate {
  id: string;
  certificateNumber: string;
  recipientName: string;
  title: string;
  missionTitle: string;
  dateAwarded: string;
  pointsEarned: number;
  wasteClearedKg: number;
  co2SavedKg: number;
  authorityName: string;
  authorityTitle: string;
  sealText: string;
  verificationCode: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface CitizenUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: string;
  reportsSubmitted: number;
  scansCompleted: number;
  cleanupsVerified: number;
  badges: Badge[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  area: string;
  points: number;
  scans: number;
  reports: number;
  badge: string;
  isCurrentUser?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}
