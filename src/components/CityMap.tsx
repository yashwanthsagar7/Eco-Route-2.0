import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SmartBin, TruckRoute, CitizenReport } from '../types';
import { useApp } from '../context/AppContext';
import {
  Navigation,
  Layers,
  MapPin,
  Crosshair,
  Sparkles,
  Trash2,
  CheckCircle,
} from 'lucide-react';

type MapStyle = 'voyager' | 'streets' | 'satellite' | 'dark';

const MAP_TILE_SOURCES: Record<MapStyle, { url: string; attribution: string; className?: string }> = {
  voyager: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, Garmin, USGS, NOAA',
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Maxar, Earthstar Geographics',
  },
  dark: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    className: 'leaflet-dark-tiles',
  },
};

interface CityMapProps {
  bins: SmartBin[];
  routes?: TruckRoute[];
  reports?: CitizenReport[];
  selectedBin?: SmartBin | null;
  onSelectBin?: (bin: SmartBin) => void;
  showHotspots?: boolean;
  showSurroundingRing?: boolean;
  activeTruckStop?: { truckId: number; stopIndex: number; binId: string } | null;
  heightClass?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onStartCleanup?: (report: CitizenReport) => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  bins,
  routes = [],
  reports = [],
  selectedBin,
  onSelectBin,
  showHotspots = false,
  showSurroundingRing = true,
  activeTruckStop,
  heightClass = 'h-[500px]',
  onMapClick,
  onStartCleanup,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tileFallbackAttemptedRef = useRef(false);
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);

  const {
    cityConfig,
    markBinAsCollected,
    userLocation,
    isTrackingLocation,
    startTrackingLocation,
    surroundingRadiusKm,
  } = useApp();

  const [mapStyle, setMapStyle] = useState<MapStyle>('voyager');
  const [tileConnection, setTileConnection] = useState<'loading' | 'connected' | 'unavailable'>('loading');

  const isLeafletContainerInitialized = () => !!(mapContainerRef.current as any)?._leaflet_id;

  const destroyMap = () => {
    const map = mapInstanceRef.current;
    if (!map) {
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      return;
    }

    map.off();
    if (typeof map.remove === 'function') {
      map.remove();
    }

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current.off();
      tileLayerRef.current = null;
    }

    map.eachLayer((layer) => {
      if (layer !== tileLayerRef.current) {
        map.removeLayer(layer);
      }
    });

    if (mapContainerRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    mapInstanceRef.current = null;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (mapInstanceRef.current && mapInstanceRef.current.getContainer()) return;
    if (isLeafletContainerInitialized()) return;

    const initialCenter = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : cityConfig.center;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: userLocation ? 14 : cityConfig.defaultZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Initialize layer groups
    const hotspotsGroup = L.layerGroup().addTo(map);
    const routesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const reportsGroup = L.layerGroup().addTo(map);
    const userLocationGroup = L.layerGroup().addTo(map);

    hotspotsLayerRef.current = hotspotsGroup;
    routesLayerRef.current = routesGroup;
    markersLayerRef.current = markersGroup;
    reportsLayerRef.current = reportsGroup;
    userLocationLayerRef.current = userLocationGroup;
    mapInstanceRef.current = map;
    setMapReadyVersion((version) => version + 1);

    // Central Depot Marker
    const depotIcon = L.divIcon({
      className: 'custom-depot-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 rounded-full bg-white border-2 border-sky-600 shadow-md">
          <svg class="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <span class="absolute -bottom-5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-800 border border-slate-200 whitespace-nowrap shadow-xs">
            Central Depot
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const depotMarker = L.marker([cityConfig.depot.lat, cityConfig.depot.lng], { icon: depotIcon });
    depotMarker.bindPopup(`
      <div class="p-3 text-slate-800 text-xs font-sans">
        <div class="font-bold text-sky-700 text-sm mb-1">${cityConfig.depot.name}</div>
        <div class="text-slate-600">Fleet Operations Center & Municipal EV Compactor Hub</div>
      </div>
    `);
    markersGroup.addLayer(depotMarker);

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      if (!map || !isMapAttached()) return;
      map.invalidateSize({ pan: false });
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      destroyMap();
      markersLayerRef.current = null;
      routesLayerRef.current = null;
      hotspotsLayerRef.current = null;
      reportsLayerRef.current = null;
      userLocationLayerRef.current = null;
    };
  }, [cityConfig, onMapClick]);

  // Recenter map on user GPS location
  const isMapAttached = () => {
    const map = mapInstanceRef.current;
    if (!map) return false;
    const container = map.getContainer?.();
    if (!container || !(container as HTMLElement).isConnected) return false;
    return document.body.contains(container);
  };

  const handleRecenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !isMapAttached()) return;
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
    } else {
      startTrackingLocation();
    }
  };

  useEffect(() => {
    if (!userLocation || !mapInstanceRef.current || !isMapAttached()) return;
    if (!hasCenteredOnUserRef.current) {
      hasCenteredOnUserRef.current = true;
    }
  }, [userLocation, mapReadyVersion]);

  // Update map tile layer style with multiple crystal clear options
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.getContainer()) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.off();
      map.removeLayer(tileLayerRef.current);
    }

    setTileConnection('loading');
    let loadedTiles = 0;
    let failedTiles = 0;
    const source = MAP_TILE_SOURCES[mapStyle];
    const tileLayer = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: 19,
      subdomains: 'abcd',
      className: source.className,
    });

    tileLayer.on('tileload', () => {
      if (!mapInstanceRef.current || !mapInstanceRef.current.getContainer()) return;
      loadedTiles += 1;
      setTileConnection('connected');
    });
    tileLayer.on('tileerror', () => {
      if (!mapInstanceRef.current || !mapInstanceRef.current.getContainer()) return;
      failedTiles += 1;
      if (loadedTiles === 0 && failedTiles >= 3) {
        if (!tileFallbackAttemptedRef.current) {
          tileFallbackAttemptedRef.current = true;
          setMapStyle(mapStyle === 'streets' ? 'voyager' : 'streets');
        } else {
          setTileConnection('unavailable');
        }
      }
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [mapReadyVersion, mapStyle]);

  // Render User Location & Radar Range
  useEffect(() => {
    const userGroup = userLocationLayerRef.current;
    if (!userGroup || !mapInstanceRef.current) return;

    userGroup.clearLayers();

    if (userLocation) {
      // 1. Radar Surrounding Radius Circle
      if (showSurroundingRing && surroundingRadiusKm > 0) {
        const radiusMeters = surroundingRadiusKm * 1000;
        const surroundingCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusMeters,
          color: '#0284c7',
          weight: 1.5,
          dashArray: '6, 6',
          opacity: 0.6,
          fillColor: '#38bdf8',
          fillOpacity: 0.06,
        });
        surroundingCircle.bindTooltip(`Surrounding Area: ${surroundingRadiusKm} km range`, {
          permanent: false,
          direction: 'top',
          className: 'bg-white text-sky-800 border border-sky-300 text-xs px-2 py-1 rounded shadow-sm font-semibold',
        });
        userGroup.addLayer(surroundingCircle);
      }

      // 2. Accuracy Circle
      if (userLocation.accuracy && userLocation.accuracy < 1000) {
        const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          color: '#0284c7',
          weight: 1,
          opacity: 0.4,
          fillColor: '#38bdf8',
          fillOpacity: 0.12,
        });
        userGroup.addLayer(accuracyCircle);
      }

      // 3. User GPS Marker Icon with glowing pulse
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4">
            <div class="absolute inset-0 rounded-full bg-sky-500/40 animate-ping"></div>
            <div class="relative w-5 h-5 rounded-full bg-sky-600 border-2 border-white shadow-lg flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <span class="absolute -bottom-5 px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-600 text-white shadow-sm whitespace-nowrap">
              You Are Here
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      });

      userMarker.bindPopup(`
        <div class="p-3 bg-white text-slate-800 text-xs font-sans rounded-xl min-w-[210px]">
          <div class="font-extrabold text-sm text-sky-700 flex items-center gap-1.5 mb-1">
            <svg class="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
            <span>Live GPS Location</span>
          </div>
          <div class="text-[11px] text-slate-600">
            Coordinates: <span class="font-mono text-slate-800 font-semibold">${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}</span>
          </div>
          <div class="text-[11px] text-emerald-700 font-medium mt-1">
            Accuracy: ±${userLocation.accuracy || 10} meters
          </div>
          <div class="text-[10px] text-slate-400 mt-1">
            Scanning surrounding waste within ${surroundingRadiusKm} km
          </div>
        </div>
      `);

      userGroup.addLayer(userMarker);
    }
  }, [userLocation, showSurroundingRing, surroundingRadiusKm]);

  // Update Smart Bins Markers
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    if (!markersGroup || !mapInstanceRef.current) return;

    markersGroup.clearLayers();

    // Re-add depot
    const depotIcon = L.divIcon({
      className: 'custom-depot-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 rounded-full bg-white border-2 border-sky-600 shadow-md">
          <svg class="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <span class="absolute -bottom-5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-800 border border-slate-200 whitespace-nowrap shadow-xs">
            Central Depot
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    const depotMarker = L.marker([cityConfig.depot.lat, cityConfig.depot.lng], { icon: depotIcon });
    markersGroup.addLayer(depotMarker);

    // Add bin markers
    bins.forEach((bin) => {
      const isRed = bin.fillLevel >= 80;
      const isYellow = bin.fillLevel >= 50 && bin.fillLevel < 80;
      const color = isRed ? '#e11d48' : isYellow ? '#0284c7' : '#059669';
      const isSelected = selectedBin?.id === bin.id;
      const isActiveCollectionStop = activeTruckStop?.binId === bin.id;

      const size = isSelected || isActiveCollectionStop ? 36 : isRed ? 28 : 22;
      const halfSize = size / 2;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125" style="width: ${size}px; height: ${size}px; margin-left: -${halfSize}px; margin-top: -${halfSize}px;">
          ${isRed ? `<div class="absolute inset-0 rounded-full bg-rose-500/30 pulse-beacon-red"></div>` : ''}
          ${isActiveCollectionStop ? `<div class="absolute -inset-3 rounded-full bg-sky-500/40 animate-ping"></div>` : ''}
          <div class="relative w-full h-full rounded-full flex items-center justify-center border-2 bg-white shadow-md font-bold"
               style="border-color: ${color};">
            <span class="text-[10px] font-black" style="color: ${color};">
              ${bin.fillLevel}%
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: `bin-marker-${bin.id}`,
        html: markerHtml,
        iconSize: [size, size],
        iconAnchor: [halfSize, halfSize],
      });

      const marker = L.marker([bin.lat, bin.lng], { icon: customIcon });

      const distanceText =
        bin.distanceMeters !== undefined
          ? bin.distanceMeters < 1000
            ? `${bin.distanceMeters}m away from you`
            : `${(bin.distanceMeters / 1000).toFixed(1)}km away from you`
          : null;

      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-3.5 bg-white text-slate-800 rounded-xl min-w-[240px] text-xs font-sans border border-slate-200 shadow-xl';
      popupHtml.innerHTML = `
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div>
            <div class="font-bold text-sm text-slate-900">${bin.name}</div>
            <div class="text-[11px] text-sky-700">${bin.area} · ID: ${bin.id}</div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                style="background-color: ${color}18; color: ${color}; border: 1px solid ${color}35;">
            ${bin.type}
          </span>
        </div>

        ${
          distanceText
            ? `<div class="mb-2 px-2 py-1 rounded-lg bg-sky-50 text-sky-800 text-[11px] font-bold flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${distanceText}</span>
              </div>`
            : ''
        }

        <div class="space-y-2 mb-3">
          <div>
            <div class="flex justify-between text-[11px] mb-1 font-medium">
              <span class="text-slate-600">Fill Capacity</span>
              <span class="font-bold" style="color: ${color};">${bin.fillLevel}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div class="h-full rounded-full transition-all duration-500" style="width: ${bin.fillLevel}%; background-color: ${color};"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-700">
            <div class="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <svg class="w-3.5 h-3.5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path></svg>
              <span>${bin.temperature}°C</span>
            </div>
            <div class="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="10" x="2" y="7" rx="2"></rect><line x1="22" x2="22" y1="11" y2="13"></line></svg>
              <span>${bin.battery}% IoT</span>
            </div>
          </div>
        </div>

        <button id="btn-collect-${bin.id}" class="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95">
          <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Mark as Collected (0%)
        </button>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-collect-${bin.id}`);
        if (btn) {
          btn.onclick = () => {
            markBinAsCollected(bin.id);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        if (onSelectBin) onSelectBin(bin);
      });

      markersGroup.addLayer(marker);
    });
  }, [bins, selectedBin, activeTruckStop, cityConfig, markBinAsCollected, onSelectBin]);

  // Update Hotspot Layer
  useEffect(() => {
    const hotspotsGroup = hotspotsLayerRef.current;
    if (!hotspotsGroup) return;

    hotspotsGroup.clearLayers();

    if (showHotspots) {
      bins.forEach((bin) => {
        if (bin.fillLevel >= 75) {
          const radius = (bin.fillLevel / 100) * 850;
          const circle = L.circle([bin.lat, bin.lng], {
            radius,
            color: '#e11d48',
            weight: 1.5,
            opacity: 0.7,
            fillColor: '#e11d48',
            fillOpacity: bin.fillLevel >= 90 ? 0.3 : 0.15,
          });
          circle.bindTooltip(`Hotspot: ${bin.name} (${bin.fillLevel}%)`, {
            permanent: false,
            direction: 'top',
            className: 'bg-white text-rose-700 border border-rose-300 text-xs px-2 py-1 rounded-lg shadow-sm font-semibold',
          });
          hotspotsGroup.addLayer(circle);
        }
      });
    }
  }, [bins, showHotspots]);

  // Update Citizen Garbage Reports Layer with Before/After Photos & Cleanup Action
  useEffect(() => {
    const reportsGroup = reportsLayerRef.current;
    if (!reportsGroup) return;

    reportsGroup.clearLayers();

    reports.forEach((rep) => {
      const isResolved = rep.status === 'Resolved';
      const color = isResolved ? '#059669' : rep.severity === 'High' ? '#e11d48' : '#0284c7';

      const distanceText =
        rep.distanceMeters !== undefined
          ? rep.distanceMeters < 1000
            ? `${rep.distanceMeters}m away from you`
            : `${(rep.distanceMeters / 1000).toFixed(1)}km away from you`
          : null;

      const reportIcon = L.divIcon({
        className: `report-marker-${rep.id}`,
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4 rounded-full shadow-md bg-white cursor-pointer transition-transform hover:scale-125 ${
            !isResolved && rep.severity === 'High' ? 'animate-bounce' : ''
          }"
               style="border: 2.5px solid ${color};">
            ${
              isResolved
                ? `<svg class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                : `<svg class="w-4 h-4" style="color: ${color};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([rep.lat, rep.lng], { icon: reportIcon });

      const popupNode = document.createElement('div');
      popupNode.className = 'p-3.5 bg-white text-slate-800 rounded-2xl text-xs max-w-xs border border-slate-200 shadow-xl font-sans';

      popupNode.innerHTML = `
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div>
            <div class="font-extrabold text-sm text-slate-900 leading-tight">${rep.title}</div>
            <div class="text-[11px] text-sky-700 mt-0.5">${rep.area} · ID: ${rep.id}</div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0" style="background: ${color}15; color: ${color}; border: 1px solid ${color}35;">
            ${rep.status}
          </span>
        </div>

        ${
          distanceText
            ? `<div class="mb-2 px-2 py-1 rounded-lg bg-sky-50 text-sky-800 text-[11px] font-bold flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${distanceText}</span>
              </div>`
            : ''
        }

        ${
          rep.imageUrl
            ? `<div class="relative rounded-xl overflow-hidden mb-2 border border-slate-200 h-28 bg-slate-100">
                <img src="${rep.imageUrl}" alt="Garbage site photo" class="w-full h-full object-cover" />
                <span class="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-900/80 text-white">
                  ${isResolved ? 'BEFORE Photo' : 'Reported Photo'}
                </span>
              </div>`
            : ''
        }

        ${
          isResolved && rep.afterImageUrl
            ? `<div class="relative rounded-xl overflow-hidden mb-2 border border-emerald-300 h-28 bg-emerald-50">
                <img src="${rep.afterImageUrl}" alt="Cleaned site photo" class="w-full h-full object-cover" />
                <span class="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                  AFTER Cleaning
                </span>
              </div>`
            : ''
        }

        <p class="text-slate-600 text-xs mb-2 leading-relaxed">${rep.description}</p>

        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 mb-2 border-t border-slate-100">
          <span>Severity: <strong style="color: ${color};">${rep.severity}</strong></span>
          <span>Est. Volume: <strong class="text-slate-800">~${rep.estimatedVolumeKg || 80} kg</strong></span>
        </div>

        ${
          !isResolved
            ? `<button id="btn-cleanup-${rep.id}" class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95">
                <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span>Clean This Site & Upload After Photo (+150 pts)</span>
              </button>`
            : `<div class="py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Cleaned by ${rep.cleanedBy || 'Volunteer'} · Verified</span>
              </div>`
        }
      `;

      marker.bindPopup(popupNode);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-cleanup-${rep.id}`);
        if (btn && onStartCleanup) {
          btn.onclick = () => {
            onStartCleanup(rep);
            marker.closePopup();
          };
        }
      });

      reportsGroup.addLayer(marker);
    });
  }, [reports, onStartCleanup]);

  // Update Route Polylines
  useEffect(() => {
    const routesGroup = routesLayerRef.current;
    if (!routesGroup) return;

    routesGroup.clearLayers();

    routes.forEach((route) => {
      if (route.pathCoords.length < 2) return;

      const polyline = L.polyline(route.pathCoords, {
        color: route.color,
        weight: 4,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'animated-route-line',
      });

      routesGroup.addLayer(polyline);

      route.stops.forEach((stop, index) => {
        const stopNumber = index + 1;
        const isCurrentStop = activeTruckStop?.binId === stop.id;

        const stopIcon = L.divIcon({
          className: `route-stop-${route.truckId}-${index}`,
          html: `
            <div class="flex items-center justify-center w-5 h-5 -ml-2.5 -mt-2.5 rounded-full text-[10px] font-black text-white shadow-md transition-transform ${
              isCurrentStop ? 'ring-4 ring-sky-400 scale-125' : ''
            }"
                 style="background-color: ${route.color};">
              ${stopNumber}
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon });
        stopMarker.bindTooltip(`${route.truckName} · Stop #${stopNumber}: ${stop.name}`, {
          direction: 'top',
          className: 'bg-white text-slate-800 border border-slate-200 text-xs px-2 py-1 rounded shadow font-semibold',
        });
        routesGroup.addLayer(stopMarker);
      });
    });
  }, [routes, activeTruckStop]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 ${heightClass}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Map Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="p-1 rounded-xl bg-white/95 border border-slate-200 backdrop-blur-md shadow-md flex items-center gap-1 text-[11px] font-bold">
          {(['voyager', 'streets', 'satellite', 'dark'] as const).map((style) => (
            <button
              key={style}
              onClick={() => {
                tileFallbackAttemptedRef.current = false;
                setTileConnection('loading');
                setMapStyle(style);
              }}
              aria-pressed={mapStyle === style}
              className={`px-2.5 py-1 rounded-lg transition-colors capitalize ${
                mapStyle === style
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {style === 'voyager' ? 'Terrain' : style === 'streets' ? 'OSM' : style}
            </button>
          ))}
        </div>

        <div
          className={`self-end px-2.5 py-1 rounded-lg text-[10px] font-semibold shadow-md ${
            tileConnection === 'connected'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : tileConnection === 'unavailable'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-white/95 text-slate-600 border border-slate-200'
          }`}
          role="status"
          aria-live="polite"
        >
          {tileConnection === 'connected'
            ? `Map connected · ${mapStyle === 'voyager' ? 'Esri Topographic' : mapStyle === 'streets' || mapStyle === 'dark' ? 'OpenStreetMap' : 'Esri Imagery'}`
            : tileConnection === 'unavailable'
            ? 'Map tiles unavailable · check connection'
            : 'Connecting to map tiles…'}
        </div>

        {/* GPS Recenter on Me Button */}
        <button
          onClick={handleRecenterOnUser}
          className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-sky-700 text-xs font-bold border border-sky-300 backdrop-blur-md shadow-md transition-colors flex items-center justify-center gap-1.5"
          title="Track my GPS location and center map"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isTrackingLocation ? 'text-sky-600 animate-spin' : 'text-sky-600'}`} />
          <span>{userLocation ? 'Center on My GPS' : 'Track My GPS'}</span>
        </button>

        {/* Legend */}
        <div className="px-3 py-2 rounded-xl bg-white/95 border border-slate-200 backdrop-blur-md shadow-md text-[11px] space-y-1">
          <div className="font-bold text-slate-800 pb-0.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <span>Map Grid</span>
            <span className="text-[10px] text-sky-700 font-mono">Real-time</span>
          </div>
          <div className="flex items-center gap-2 text-rose-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-xs animate-pulse" />
            <span>Reported Garbage Site</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-xs" />
            <span>Cleaned & Verified Site</span>
          </div>
          <div className="flex items-center gap-2 text-sky-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" />
            <span>Smart Container Bin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
