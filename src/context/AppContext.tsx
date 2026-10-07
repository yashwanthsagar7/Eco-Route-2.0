import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CitizenReport,
  CitizenUser,
  CityConfig,
  LeaderboardEntry,
  RouteOptimizationResult,
  SmartBin,
  WasteScanResult,
  ChatMessage,
  WeeklyMission,
  AppreciationCertificate,
  UserLocation,
} from '../types';
import { CITY_CONFIG, INITIAL_CITIZEN_REPORTS, INITIAL_SMART_BINS } from '../data/mockBins';
import { INITIAL_LEADERBOARD, INITIAL_USER, getLevelForPoints } from '../data/gamification';
import { INITIAL_WEEKLY_MISSIONS, INITIAL_CERTIFICATES } from '../data/missions';
import { optimizeRoutes } from '../utils/routeOptimizer';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export type TabType = 'dashboard' | 'routes' | 'scanner' | 'reports' | 'missions' | 'planner' | 'gamification';

interface AppContextType {
  smartBins: SmartBin[];
  cityConfig: CityConfig;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  iotRunning: boolean;
  setIotRunning: React.Dispatch<React.SetStateAction<boolean>>;
  simulateRushHour: () => void;
  resetSimulation: () => void;
  markBinAsCollected: (binId: string) => void;
  selectedBin: SmartBin | null;
  setSelectedBin: (bin: SmartBin | null) => void;

  // GPS Location Tracking & Nearby Junk Filter
  userLocation: UserLocation | null;
  isTrackingLocation: boolean;
  startTrackingLocation: () => void;
  stopTrackingLocation: () => void;
  setUserLocationManually: (lat: number, lng: number) => void;
  surroundingRadiusKm: number;
  setSurroundingRadiusKm: (radius: number) => void;

  // Routes
  numTrucks: number;
  setNumTrucks: (n: number) => void;
  fillThreshold: number;
  setFillThreshold: (th: number) => void;
  routesResult: RouteOptimizationResult;
  isCollecting: boolean;
  collectionProgress: number; // 0 to 100%
  activeTruckStop: { truckId: number; stopIndex: number; binId: string } | null;
  startLiveCollection: () => void;

  // Citizen Reports & Garbage Entries
  citizenReports: CitizenReport[];
  addCitizenReport: (report: Omit<CitizenReport, 'id' | 'timestamp' | 'pointsAwarded'>) => void;
  updateReportStatus: (reportId: string, newStatus: 'Reported' | 'Assigned' | 'Resolved', truckId?: number) => void;
  submitCleanupVerification: (
    reportId: string,
    afterImageBase64: string,
    notes: string
  ) => Promise<{ verified: boolean; confidence: number; cleanlinessRating: string; comments: string; pointsBonus: number }>;

  // Weekly Missions & Appreciation Certificates
  missions: WeeklyMission[];
  certificates: AppreciationCertificate[];
  awardCertificate: (data: {
    missionTitle: string;
    pointsEarned: number;
    wasteClearedKg?: number;
    co2SavedKg?: number;
  }) => AppreciationCertificate;

  // Gamification
  currentUser: CitizenUser;
  leaderboard: LeaderboardEntry[];
  awardPoints: (amount: number, reason: string) => void;

  // Waste Scanner
  scanHistory: WasteScanResult[];
  addScanToHistory: (result: WasteScanResult) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // UI Toast
  toasts: ToastItem[];
  addToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // KPI stats
  kpiStats: {
    totalBins: number;
    criticalBins: number;
    avgFill: number;
    fuelSaved: number;
    co2Saved: number;
    activeReports: number;
    cleanedSites: number;
  };
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [smartBins, setSmartBins] = useState<SmartBin[]>(INITIAL_SMART_BINS);
  const [cityConfig] = useState<CityConfig>(CITY_CONFIG);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [iotRunning, setIotRunning] = useState<boolean>(true);
  const [selectedBin, setSelectedBin] = useState<SmartBin | null>(null);

  // GPS Tracking State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState<boolean>(false);
  const locationWatchIdRef = useRef<number | null>(null);
  const hasShownLocationToastRef = useRef(false);
  const [surroundingRadiusKm, setSurroundingRadiusKm] = useState<number>(3); // 3 km default surrounding filter

  // Optimizer settings
  const [numTrucks, setNumTrucks] = useState<number>(2);
  const [fillThreshold, setFillThreshold] = useState<number>(70);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [collectionProgress, setCollectionProgress] = useState<number>(0);
  const [activeTruckStop, setActiveTruckStop] = useState<{ truckId: number; stopIndex: number; binId: string } | null>(null);

  // Citizen & Gamification
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);
  const [currentUser, setCurrentUser] = useState<CitizenUser>({
    ...INITIAL_USER,
    cleanupsVerified: 1,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [scanHistory, setScanHistory] = useState<WasteScanResult[]>([]);

  // Missions & Certificates
  const [missions, setMissions] = useState<WeeklyMission[]>(INITIAL_WEEKLY_MISSIONS);
  const [certificates, setCertificates] = useState<AppreciationCertificate[]>(INITIAL_CERTIFICATES);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Hello! I am **EcoRoute AI**, your smart sanitation & logistics advisor for Hyderabad. I continuously analyze sensor data from all 40 smart bins and nearby citizen dumping reports. How can I assist municipal operations today?`,
      timestamp: 'Just now',
      suggestions: [
        'Which zones have high garbage accumulation nearby?',
        'Suggest an optimal cleanup route for our squad.',
        'How can we earn Appreciation Certificates this week?',
      ],
    },
  ]);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // GPS Tracking handlers
  const startTrackingLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setIsTrackingLocation(false);
      addToast('GPS Not Supported', 'Geolocation is not available on this browser.', 'warning');
      return;
    }

    if (locationWatchIdRef.current !== null) return;

    setIsTrackingLocation(true);
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };
        setUserLocation(loc);
        if (!hasShownLocationToastRef.current) {
          hasShownLocationToastRef.current = true;
          addToast('GPS Position Locked', `Tracking your real location (±${loc.accuracy}m).`, 'success');
        }
      },
      (err) => {
        console.warn('Geolocation query warning:', err);
        if (err.code === err.PERMISSION_DENIED) {
          if (locationWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(locationWatchIdRef.current);
            locationWatchIdRef.current = null;
          }
          setIsTrackingLocation(false);
          addToast('Location Permission Needed', 'Allow location access in your browser to show your current position on the map.', 'warning');
          return;
        }
        addToast('Unable to Get Location', err.message || 'Check your device location settings and try again.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [addToast]);

  const stopTrackingLocation = useCallback(() => {
    if (locationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
    setIsTrackingLocation(false);
    addToast('GPS Standby', 'Switched back to city overview mode.', 'info');
  }, [addToast]);

  useEffect(() => {
    startTrackingLocation();

    return () => {
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [startTrackingLocation]);

  const setUserLocationManually = useCallback((lat: number, lng: number) => {
    setUserLocation({
      lat,
      lng,
      accuracy: 10,
      timestamp: Date.now(),
    });
    addToast('GPS Pin Updated 📍', `Set location to ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'info');
  }, [addToast]);

  // Compute distances for bins and citizen reports based on userLocation
  const smartBinsWithDistance = useMemo(() => {
    if (!userLocation) return smartBins;
    return smartBins.map((bin) => ({
      ...bin,
      distanceMeters: getDistanceMeters(userLocation.lat, userLocation.lng, bin.lat, bin.lng),
    }));
  }, [smartBins, userLocation]);

  const citizenReportsWithDistance = useMemo(() => {
    if (!userLocation) return citizenReports;
    return citizenReports.map((rep) => ({
      ...rep,
      distanceMeters: getDistanceMeters(userLocation.lat, userLocation.lng, rep.lat, rep.lng),
    }));
  }, [citizenReports, userLocation]);

  // Compute optimized routes dynamically
  const routesResult = useMemo(() => {
    return optimizeRoutes(smartBinsWithDistance, cityConfig, numTrucks, fillThreshold);
  }, [smartBinsWithDistance, cityConfig, numTrucks, fillThreshold]);

  // Points & Badges
  const awardPoints = useCallback((amount: number, reason: string) => {
    setCurrentUser((prev) => {
      const nextPoints = prev.points + amount;
      const nextLevel = getLevelForPoints(nextPoints);

      // Check badge unlocks
      const nextBadges = prev.badges.map((b) => {
        if (b.id === 'zero_waste_hero' && nextPoints >= 500 && !b.unlocked) {
          addToast('New Badge Unlocked! 🏆', 'Zero-Waste Hero badge achieved for 500+ civic points!', 'success');
          return { ...b, unlocked: true, unlockedAt: 'Just now' };
        }
        return b;
      });

      return {
        ...prev,
        points: nextPoints,
        level: nextLevel,
        badges: nextBadges,
      };
    });

    setLeaderboard((prev) =>
      prev
        .map((item) =>
          item.isCurrentUser
            ? { ...item, points: item.points + amount }
            : item
        )
        .sort((a, b) => b.points - a.points)
        .map((item, idx) => ({ ...item, rank: idx + 1 }))
    );

    addToast(`+${amount} Green Points!`, reason, 'success');
  }, [addToast]);

  // Award Appreciation Certificate
  const awardCertificate = useCallback((data: {
    missionTitle: string;
    pointsEarned: number;
    wasteClearedKg?: number;
    co2SavedKg?: number;
  }) => {
    const certNumber = `HYD-GHMC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCert: AppreciationCertificate = {
      id: 'cert-' + Math.random().toString(36).substring(2, 9),
      certificateNumber: certNumber,
      recipientName: currentUser.name,
      title: 'Certificate of Appreciation for Civic Hygiene & Environmental Leadership',
      missionTitle: data.missionTitle,
      dateAwarded: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }),
      pointsEarned: data.pointsEarned,
      wasteClearedKg: data.wasteClearedKg || 120,
      co2SavedKg: data.co2SavedKg || 38.5,
      authorityName: 'Dr. Rameshwar Rao, IAS',
      authorityTitle: 'Commissioner of Municipal Administration & Sanitation Services',
      sealText: 'GREATER HYDERABAD MUNICIPAL CORPORATION • OFFICIAL CLEAN CITY INITIATIVE',
      verificationCode: `VERIFIED-GHMC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    setCertificates((prev) => [newCert, ...prev]);

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#059669', '#0284c7', '#d97706', '#10b981'],
    });

    addToast(
      'Appreciation Certificate Awarded! 📜',
      `Official certificate #${certNumber} generated for completing ${data.missionTitle}.`,
      'success'
    );

    return newCert;
  }, [currentUser.name, addToast]);

  // Submit Cleanup Verification (Before & After Photo comparison)
  const submitCleanupVerification = useCallback(
    async (reportId: string, afterImageBase64: string, notes: string) => {
      const targetReport = citizenReports.find((r) => r.id === reportId);
      if (!targetReport) throw new Error('Report not found');

      let verificationData = {
        verified: true,
        confidence: 95,
        cleanlinessRating: 'Spotless',
        comments: 'Site cleared of debris and surface sanitized.',
        pointsBonus: 150,
      };

      try {
        const res = await fetch('/api/gemini/verify-cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beforeImageBase64: targetReport.imageUrl,
            afterImageBase64,
            title: targetReport.title,
            notes,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          verificationData = {
            verified: data.verified ?? true,
            confidence: data.confidence ?? 92,
            cleanlinessRating: data.cleanlinessRating ?? 'Substantially Cleaned',
            comments: data.comments ?? 'Clean site verified.',
            pointsBonus: data.pointsBonus ?? 150,
          };
        }
      } catch (err) {
        console.warn('AI verification fetch error, using local confirmation:', err);
      }

      // Update report status
      setCitizenReports((prev) =>
        prev.map((r) => {
          if (r.id === reportId) {
            return {
              ...r,
              status: 'Resolved',
              afterImageUrl: afterImageBase64,
              cleanedAt: 'Just now',
              cleanedBy: currentUser.name,
              cleaningNotes: notes,
              aiVerification: verificationData,
            };
          }
          return r;
        })
      );

      // Increment user verified cleanups
      setCurrentUser((prev) => ({
        ...prev,
        cleanupsVerified: (prev.cleanupsVerified || 0) + 1,
      }));

      // Award points
      awardPoints(verificationData.pointsBonus, `Cleaned & verified site: ${targetReport.title}`);

      // Advance clean_garbage missions
      setMissions((prevMissions) =>
        prevMissions.map((m) => {
          if (m.type === 'clean_garbage' && !m.isCompleted) {
            const nextCount = m.currentCount + 1;
            const completed = nextCount >= m.targetCount;
            if (completed) {
              awardCertificate({
                missionTitle: m.title,
                pointsEarned: m.rewardPoints,
                wasteClearedKg: targetReport.estimatedVolumeKg || 120,
                co2SavedKg: Math.round((targetReport.estimatedVolumeKg || 120) * 0.35),
              });
            }
            return {
              ...m,
              currentCount: nextCount,
              isCompleted: completed,
            };
          }
          return m;
        })
      );

      return verificationData;
    },
    [citizenReports, currentUser.name, awardPoints, awardCertificate]
  );

  // Mark single bin as collected
  const markBinAsCollected = useCallback((binId: string) => {
    setSmartBins((prev) =>
      prev.map((b) => {
        if (b.id === binId) {
          return {
            ...b,
            fillLevel: 0,
            status: 'Normal',
            lastCollected: 'Just now',
            temperature: Math.max(24, Number((b.temperature - 3.5).toFixed(1))),
          };
        }
        return b;
      })
    );

    awardPoints(15, `Emptied & sanitized bin ${binId}`);
  }, [awardPoints]);

  // IoT Sensor Background simulation: every 3 seconds
  useEffect(() => {
    if (!iotRunning || isCollecting) return;

    const interval = setInterval(() => {
      setSmartBins((prevBins) => {
        const randIndex1 = Math.floor(Math.random() * prevBins.length);
        const randIndex2 = Math.floor(Math.random() * prevBins.length);
        const randIndex3 = Math.floor(Math.random() * prevBins.length);
        const targetIndices = new Set([randIndex1, randIndex2, randIndex3]);

        return prevBins.map((bin, index) => {
          if (targetIndices.has(index)) {
            const fillDelta = Math.floor(Math.random() * 4) + 1;
            const nextFill = Math.min(100, bin.fillLevel + fillDelta);
            const nextStatus =
              nextFill >= 95 ? 'Overflowing' : nextFill >= 80 ? 'Critical' : nextFill >= 50 ? 'Warning' : 'Normal';

            return {
              ...bin,
              fillLevel: nextFill,
              status: nextStatus,
              temperature: Number((bin.temperature + (Math.random() * 0.4 - 0.15)).toFixed(1)),
            };
          }
          return bin;
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [iotRunning, isCollecting]);

  // Rush Hour simulation
  const simulateRushHour = useCallback(() => {
    setSmartBins((prev) =>
      prev.map((b) => {
        const isCommercial =
          b.area.includes('HITEC') ||
          b.area.includes('Banjara') ||
          b.area.includes('Gachibowli') ||
          b.area.includes('Charminar') ||
          b.area.includes('Ameerpet');

        if (isCommercial) {
          const spike = Math.floor(Math.random() * 25) + 20;
          const nextFill = Math.min(100, b.fillLevel + spike);
          return {
            ...b,
            fillLevel: nextFill,
            status: nextFill >= 95 ? 'Overflowing' : nextFill >= 80 ? 'Critical' : 'Warning',
            temperature: Number((b.temperature + 1.2).toFixed(1)),
          };
        }
        return b;
      })
    );

    addToast('Rush Hour Spike Activated! ⚡', 'Commercial and IT corridor bins spiked by +20% to +45% fill.', 'warning');
  }, [addToast]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setSmartBins(INITIAL_SMART_BINS);
    setCitizenReports(INITIAL_CITIZEN_REPORTS);
    setIsCollecting(false);
    setCollectionProgress(0);
    setActiveTruckStop(null);
    addToast('Simulation Reset', 'All bins, sensor readings, and routes reset to clean baseline.', 'info');
  }, [addToast]);

  // Start collection animation
  const startLiveCollection = useCallback(() => {
    if (isCollecting || routesResult.trucks.length === 0) return;

    setIsCollecting(true);
    setCollectionProgress(0);
    addToast('Collection Run Started 🚛', `Dispatching ${routesResult.trucks.length} trucks across critical bins.`, 'info');

    const totalStops = routesResult.trucks.reduce((acc, t) => acc + t.stops.length, 0);
    let visitedCount = 0;

    routesResult.trucks.forEach((truck) => {
      truck.stops.forEach((stop, stopIdx) => {
        const delay = (stopIdx + 1) * 1400;

        setTimeout(() => {
          setActiveTruckStop({ truckId: truck.truckId, stopIndex: stopIdx, binId: stop.id });
          markBinAsCollected(stop.id);

          visitedCount++;
          const progress = Math.round((visitedCount / totalStops) * 100);
          setCollectionProgress(progress);

          if (visitedCount >= totalStops) {
            setTimeout(() => {
              setIsCollecting(false);
              setActiveTruckStop(null);
              confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
              });
              addToast('Collection Complete! 🎉', 'All scheduled containers serviced and emissions abated.', 'success');
              awardPoints(100, 'Completed multi-truck optimization route run');
            }, 1000);
          }
        }, delay);
      });
    });
  }, [isCollecting, routesResult, markBinAsCollected, addToast, awardPoints]);

  // Add Citizen Report
  const addCitizenReport = useCallback(
    (reportData: Omit<CitizenReport, 'id' | 'timestamp' | 'pointsAwarded'>) => {
      const newReport: CitizenReport = {
        ...reportData,
        id: `REP-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: 'Just now',
        pointsAwarded: 50,
      };

      setCitizenReports((prev) => [newReport, ...prev]);

      awardPoints(50, `Reported dumping incident: ${reportData.title}`);

      // Advance report missions
      setMissions((prevMissions) =>
        prevMissions.map((m) => {
          if (m.type === 'report_overflow' && !m.isCompleted) {
            const nextCount = m.currentCount + 1;
            const completed = nextCount >= m.targetCount;
            if (completed) {
              awardCertificate({
                missionTitle: m.title,
                pointsEarned: m.rewardPoints,
                wasteClearedKg: 150,
                co2SavedKg: 45,
              });
            }
            return {
              ...m,
              currentCount: nextCount,
              isCompleted: completed,
            };
          }
          return m;
        })
      );
    },
    [awardPoints, awardCertificate]
  );

  // Update Citizen Report Status
  const updateReportStatus = useCallback(
    (reportId: string, newStatus: 'Reported' | 'Assigned' | 'Resolved', truckId?: number) => {
      setCitizenReports((prev) =>
        prev.map((r) => {
          if (r.id === reportId) {
            return {
              ...r,
              status: newStatus,
              assignedTruckId: truckId !== undefined ? truckId : r.assignedTruckId,
            };
          }
          return r;
        })
      );
    },
    []
  );

  // Add scan to history and advance mission
  const addScanToHistory = useCallback(
    (result: WasteScanResult) => {
      setScanHistory((prev) => [result, ...prev]);
      awardPoints(25, `Scanned and classified ${result.wasteType}`);

      // Advance scan_waste missions
      setMissions((prevMissions) =>
        prevMissions.map((m) => {
          if (m.type === 'scan_waste' && !m.isCompleted) {
            const nextCount = m.currentCount + 1;
            const completed = nextCount >= m.targetCount;
            return {
              ...m,
              currentCount: nextCount,
              isCompleted: completed,
            };
          }
          return m;
        })
      );
    },
    [awardPoints]
  );

  // Chat message
  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  }, []);

  // Compute KPI summary
  const kpiStats = useMemo(() => {
    const totalBins = smartBins.length;
    const criticalBins = smartBins.filter((b) => b.fillLevel >= 80).length;
    const avgFill = Math.round(smartBins.reduce((acc, b) => acc + b.fillLevel, 0) / (totalBins || 1));
    const activeReports = citizenReports.filter((r) => r.status !== 'Resolved').length;
    const cleanedSites = citizenReports.filter((r) => r.status === 'Resolved').length;

    return {
      totalBins,
      criticalBins,
      avgFill,
      fuelSaved: routesResult.fuelSavedLitres,
      co2Saved: routesResult.co2SavedKg,
      activeReports,
      cleanedSites,
    };
  }, [smartBins, citizenReports, routesResult]);

  return (
    <AppContext.Provider
      value={{
        smartBins: smartBinsWithDistance,
        cityConfig,
        activeTab,
        setActiveTab,
        iotRunning,
        setIotRunning,
        simulateRushHour,
        resetSimulation,
        markBinAsCollected,
        selectedBin,
        setSelectedBin,

        // GPS Location
        userLocation,
        isTrackingLocation,
        startTrackingLocation,
        stopTrackingLocation,
        setUserLocationManually,
        surroundingRadiusKm,
        setSurroundingRadiusKm,

        // Routes
        numTrucks,
        setNumTrucks,
        fillThreshold,
        setFillThreshold,
        routesResult,
        isCollecting,
        collectionProgress,
        activeTruckStop,
        startLiveCollection,

        // Citizen Reports & Cleanups
        citizenReports: citizenReportsWithDistance,
        addCitizenReport,
        updateReportStatus,
        submitCleanupVerification,

        // Weekly Missions & Certificates
        missions,
        certificates,
        awardCertificate,

        // Gamification
        currentUser,
        leaderboard,
        awardPoints,

        // Scanner
        scanHistory,
        addScanToHistory,

        // Chat
        chatMessages,
        addChatMessage,

        // Toast
        toasts,
        addToast,
        removeToast,

        // KPI
        kpiStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
