import { CityConfig, RouteOptimizationResult, SmartBin, TruckRoute } from '../types';

// Haversine formula to compute great-circle distance between two points in km
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Nearest Neighbor Heuristic
function nearestNeighborTSP(
  depot: { lat: number; lng: number },
  bins: SmartBin[]
): SmartBin[] {
  if (bins.length <= 1) return [...bins];

  const unvisited = [...bins];
  const ordered: SmartBin[] = [];

  let currentLat = depot.lat;
  let currentLng = depot.lng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = getDistanceKm(currentLat, currentLng, unvisited[i].lat, unvisited[i].lng);
      if (d < minDistance) {
        minDistance = d;
        nearestIndex = i;
      }
    }

    const nextBin = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(nextBin);
    currentLat = nextBin.lat;
    currentLng = nextBin.lng;
  }

  return ordered;
}

// Compute total route length including depot start and return
function calculateTourDistance(
  depot: { lat: number; lng: number },
  tour: SmartBin[]
): number {
  if (tour.length === 0) return 0;
  let total = 0;

  // Depot to first
  total += getDistanceKm(depot.lat, depot.lng, tour[0].lat, tour[0].lng);

  // Intermediate stops
  for (let i = 0; i < tour.length - 1; i++) {
    total += getDistanceKm(tour[i].lat, tour[i].lng, tour[i + 1].lat, tour[i + 1].lng);
  }

  // Last stop back to depot
  total += getDistanceKm(tour[tour.length - 1].lat, tour[tour.length - 1].lng, depot.lat, depot.lng);

  return total;
}

// 2-Opt local search refinement for TSP
function twoOpt(depot: { lat: number; lng: number }, initialTour: SmartBin[]): SmartBin[] {
  if (initialTour.length < 4) return initialTour;

  let tour = [...initialTour];
  let improved = true;
  let iterations = 0;
  const maxIterations = 80;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < tour.length - 1; i++) {
      for (let k = i + 1; k < tour.length; k++) {
        // Test reversing segment between i and k
        const newTour = [
          ...tour.slice(0, i),
          ...tour.slice(i, k + 1).reverse(),
          ...tour.slice(k + 1),
        ];

        const oldDist = calculateTourDistance(depot, tour);
        const newDist = calculateTourDistance(depot, newTour);

        if (newDist < oldDist - 0.001) {
          tour = newTour;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return tour;
}

// Partition bins geographically across trucks (Angular sweep around depot)
function partitionBins(
  depot: { lat: number; lng: number },
  bins: SmartBin[],
  numTrucks: number
): SmartBin[][] {
  if (!bins.length || !Number.isFinite(numTrucks) || numTrucks <= 0) {
    return [];
  }

  if (numTrucks === 1 || bins.length <= 1) {
    return [bins];
  }

  // Calculate polar angle from depot
  const withAngle = bins.map((b) => {
    const angle = Math.atan2(b.lat - depot.lat, b.lng - depot.lng);
    return { bin: b, angle };
  });

  // Sort by polar angle
  withAngle.sort((a, b) => a.angle - b.angle);

  const partitions: SmartBin[][] = Array.from({ length: numTrucks }, () => []);
  const chunkSize = Math.ceil(withAngle.length / numTrucks);

  withAngle.forEach((item, index) => {
    const truckIndex = Math.min(Math.floor(index / chunkSize), numTrucks - 1);
    partitions[truckIndex].push(item.bin);
  });

  return partitions;
}

const TRUCK_COLORS = [
  '#10b981', // Emerald Green (Alpha)
  '#0ea5e9', // Sky Blue (Beta)
  '#2563eb', // Royal Azure Blue (Gamma)
];

const TRUCK_NAMES = [
  'Truck Alpha (Old City & Central)',
  'Truck Beta (IT Corridor West)',
  'Truck Gamma (Northern Metro Line)',
];

export function optimizeRoutes(
  allBins: SmartBin[],
  cityConfig: CityConfig,
  numTrucks: number = 2,
  fillThreshold: number = 70
): RouteOptimizationResult {
  const depot = cityConfig.depot;
  const safeTruckCount = Number.isFinite(numTrucks) ? Math.max(1, Math.floor(numTrucks)) : 2;
  const safeThreshold = Number.isFinite(fillThreshold) ? Math.min(100, Math.max(0, fillThreshold)) : 70;

  if (!allBins.length) {
    return {
      trucks: [],
      criticalBinsCount: 0,
      baselineDistanceKm: 0,
      optimizedDistanceKm: 0,
      distanceSavedKm: 0,
      percentageSaved: 0,
      fuelSavedLitres: 0,
      co2SavedKg: 0,
    };
  }

  // Filter bins above fill threshold. If fewer than 4 bins meet threshold, pick the top 5 highest filled
  let targetBins = allBins.filter((b) => b.fillLevel >= safeThreshold);
  if (targetBins.length < 4) {
    targetBins = [...allBins].sort((a, b) => b.fillLevel - a.fillLevel).slice(0, 8);
  }

  // Compute baseline distance: visiting all 40 bins in order
  const baselineTour = nearestNeighborTSP(depot, allBins);
  const baselineDistanceKm = Number(calculateTourDistance(depot, baselineTour).toFixed(1));

  // Partition target bins across trucks
  const actualTrucks = Math.min(safeTruckCount, targetBins.length);
  if (actualTrucks === 0) {
    return {
      trucks: [],
      criticalBinsCount: 0,
      baselineDistanceKm,
      optimizedDistanceKm: 0,
      distanceSavedKm: baselineDistanceKm,
      percentageSaved: baselineDistanceKm > 0 ? 100 : 0,
      fuelSavedLitres: Number((baselineDistanceKm * 0.38).toFixed(1)),
      co2SavedKg: Number(((baselineDistanceKm * 0.38) * 2.68).toFixed(1)),
    };
  }

  const partitions = partitionBins(depot, targetBins, actualTrucks);

  let totalOptimizedDistance = 0;
  const trucks: TruckRoute[] = [];

  partitions.forEach((binSubset, i) => {
    if (binSubset.length === 0) return;

    // 1. Initial Nearest Neighbor
    const nnTour = nearestNeighborTSP(depot, binSubset);
    // 2. 2-Opt local refinement
    const optimizedTour = twoOpt(depot, nnTour);

    const distKm = Number(calculateTourDistance(depot, optimizedTour).toFixed(1));
    totalOptimizedDistance += distKm;

    // Build path coordinates: [depot, ...stops, depot]
    const pathCoords: [number, number][] = [
      [depot.lat, depot.lng],
      ...optimizedTour.map((b): [number, number] => [b.lat, b.lng]),
      [depot.lat, depot.lng],
    ];

    // Estimated transit time: avg 24 km/h + 6 mins per stop collection
    const travelTimeMinutes = (distKm / 24) * 60;
    const collectionTimeMinutes = optimizedTour.length * 6;
    const estimatedMinutes = Math.round(travelTimeMinutes + collectionTimeMinutes);

    // Total collected weight (kg): fillLevel% * capacity * density (~0.25 kg/L)
    const totalCollectedKg = Math.round(
      optimizedTour.reduce((acc, b) => acc + (b.fillLevel / 100) * b.capacityLiters * 0.25, 0)
    );

    trucks.push({
      truckId: i + 1,
      truckName: TRUCK_NAMES[i] || `Truck ${i + 1}`,
      color: TRUCK_COLORS[i % TRUCK_COLORS.length],
      stops: optimizedTour,
      pathCoords,
      totalDistanceKm: distKm,
      estimatedMinutes,
      totalCollectedKg,
    });
  });

  const optimizedDistanceKm = Number(totalOptimizedDistance.toFixed(1));
  const distanceSavedKm = Math.max(0, Number((baselineDistanceKm - optimizedDistanceKm).toFixed(1)));
  const percentageSaved = baselineDistanceKm > 0 ? Math.max(0, Math.min(100, Math.round((distanceSavedKm / baselineDistanceKm) * 100))) : 0;

  // Environmental and fuel savings:
  // Urban diesel compactor truck uses approx 0.38 liters per km
  const fuelSavedLitres = Number((distanceSavedKm * 0.38).toFixed(1));
  // Diesel emission factor: ~2.68 kg CO2 per liter
  const co2SavedKg = Number((fuelSavedLitres * 2.68).toFixed(1));

  return {
    trucks,
    criticalBinsCount: targetBins.length,
    baselineDistanceKm,
    optimizedDistanceKm,
    distanceSavedKm,
    percentageSaved,
    fuelSavedLitres,
    co2SavedKg,
  };
}
