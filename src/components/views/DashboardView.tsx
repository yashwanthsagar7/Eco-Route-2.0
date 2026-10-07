import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CityMap } from '../CityMap';
import { SmartBin, WasteType } from '../../types';
import {
  AlertTriangle,
  Fuel,
  Leaf,
  Layers,
  Percent,
  Search,
  Truck,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    smartBins,
    kpiStats,
    selectedBin,
    setSelectedBin,
    markBinAsCollected,
    setActiveTab,
    citizenReports,
  } = useApp();

  const [typeFilter, setTypeFilter] = useState<'All' | WasteType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Critical' | 'Warning' | 'Normal'>('All');
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered Bins
  const filteredBins = useMemo(() => {
    return smartBins.filter((b) => {
      if (typeFilter !== 'All' && b.type !== typeFilter) return false;
      if (statusFilter === 'Critical' && b.fillLevel < 80) return false;
      if (statusFilter === 'Warning' && (b.fillLevel < 50 || b.fillLevel >= 80)) return false;
      if (statusFilter === 'Normal' && b.fillLevel >= 50) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.area.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [smartBins, typeFilter, statusFilter, searchQuery]);

  // Chart Data 1: Average Fill by Waste Type in Green & Blue palette
  const fillByTypeData = useMemo(() => {
    const types: WasteType[] = ['Wet', 'Dry', 'Recyclable', 'Hazardous'];
    return types.map((t) => {
      const matching = smartBins.filter((b) => b.type === t);
      const avg = matching.length
        ? Math.round(matching.reduce((acc, b) => acc + b.fillLevel, 0) / matching.length)
        : 0;
      return {
        type: t,
        avgFill: avg,
        count: matching.length,
        color:
          t === 'Wet'
            ? '#059669' // Emerald Green
            : t === 'Dry'
            ? '#0284c7' // Sky Blue
            : t === 'Recyclable'
            ? '#2563eb' // Royal Blue
            : '#d97706', // Amber (Hazardous)
      };
    });
  }, [smartBins]);

  // Chart Data 2: Temporal Fill Trend (24hr progression)
  const temporalTrendData = useMemo(() => {
    return [
      { time: '04:00', avgFill: 32, criticalCount: 2 },
      { time: '07:00', avgFill: 41, criticalCount: 3 },
      { time: '10:00', avgFill: 56, criticalCount: 5 },
      { time: '13:00', avgFill: 64, criticalCount: 7 },
      { time: '16:00', avgFill: 68, criticalCount: 8 },
      { time: '19:00', avgFill: Math.min(100, kpiStats.avgFill + 6), criticalCount: kpiStats.criticalBins },
      { time: 'Now', avgFill: kpiStats.avgFill, criticalCount: kpiStats.criticalBins },
    ];
  }, [kpiStats]);

  // Top Critical Bins for quick action
  const topCriticalBins = useMemo(() => {
    return [...smartBins]
      .sort((a, b) => b.fillLevel - a.fillLevel)
      .slice(0, 5);
  }, [smartBins]);

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Municipal Telemetry Dashboard</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              Live IoT Grid
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time ultrasonic fill monitoring and temperature telemetry across 40 smart containers in Hyderabad.
          </p>
        </div>

        {/* Quick Route Dispatch Link in plain solid emerald green */}
        <button
          onClick={() => setActiveTab('routes')}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors active:scale-95"
        >
          <Truck className="w-4 h-4" />
          <span>Launch Route Optimizer</span>
        </button>
      </div>

      {/* KPI Cards Grid in Plain Green & Blue Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Bins */}
        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Smart Bins</span>
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {kpiStats.totalBins}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100% active sensors
          </div>
        </div>

        {/* Critical Bins */}
        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-rose-200/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Critical Overflow</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600">
            {kpiStats.criticalBins}
          </div>
          <div className="mt-1 text-[11px] text-rose-700 font-medium">
            &ge; 80% capacity threshold
          </div>
        </div>

        {/* Average Fill */}
        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average City Fill</span>
            <Percent className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {kpiStats.avgFill}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                kpiStats.avgFill >= 80
                  ? 'bg-rose-500'
                  : kpiStats.avgFill >= 50
                  ? 'bg-sky-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${kpiStats.avgFill}%` }}
            />
          </div>
        </div>

        {/* Fuel Saved */}
        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Diesel Fuel Saved</span>
            <Fuel className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-sky-700">
            {kpiStats.fuelSaved} L
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            via dynamic 2-Opt routing
          </div>
        </div>

        {/* CO2 Abated */}
        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-emerald-200/90 shadow-md col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Carbon Abated</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700">
            {kpiStats.co2Saved} kg
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
            GHG emission avoidance
          </div>
        </div>
      </div>

      {/* Map Control Bar & Interactive Map */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-lg space-y-4">
        {/* Filter & Controls header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search area or bin ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Waste Type Filters in Plain Solid Colors */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['All', 'Wet', 'Dry', 'Recyclable', 'Hazardous'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    typeFilter === type
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['All', 'Critical', 'Warning', 'Normal'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    statusFilter === status
                      ? status === 'Critical'
                        ? 'bg-rose-600 text-white'
                        : status === 'Warning'
                        ? 'bg-amber-600 text-white'
                        : status === 'Normal'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Hotspot Toggle */}
            <button
              onClick={() => setShowHotspots((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                showHotspots
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              {showHotspots ? 'Hotspots Active' : 'Hotspots Hidden'}
            </button>
          </div>
        </div>

        {/* Map Viewport with Leaflet */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <CityMap
            bins={filteredBins}
            reports={citizenReports}
            selectedBin={selectedBin}
            onSelectBin={setSelectedBin}
            showHotspots={showHotspots}
            heightClass="h-[460px] sm:h-[500px]"
          />

          {/* Map Floating Legend */}
          <div className="absolute bottom-4 left-4 z-[500] p-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-lg text-[11px] space-y-1.5 max-w-[220px]">
            <div className="font-bold text-slate-800 text-xs">Sensor Legend</div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs" />
              <span>Normal (&lt; 50%)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-sky-500 border border-white shadow-xs" />
              <span>Moderate (50-79%)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-xs animate-pulse" />
              <span className="font-semibold text-rose-700">Critical (&ge; 80%)</span>
            </div>
          </div>
        </div>

        {/* Filter Summary Strip */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
          <div>
            Showing <strong className="text-slate-900">{filteredBins.length}</strong> of{' '}
            <strong className="text-slate-900">{smartBins.length}</strong> smart containers
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {smartBins.filter((b) => b.fillLevel < 50).length} Optimal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {smartBins.filter((b) => b.fillLevel >= 80).length} Critical
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fill by Waste Type Bar Chart */}
        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Average Capacity by Waste Stream</h3>
              <p className="text-xs text-slate-500">Wet, Dry, Recyclable, and Hazardous fill levels</p>
            </div>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              Real-time
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fillByTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xl text-xs">
                          <div className="font-bold">{data.type} Stream</div>
                          <div className="text-emerald-700 font-semibold mt-1">Average Fill: {data.avgFill}%</div>
                          <div className="text-slate-500 text-[11px]">{data.count} Containers</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgFill" radius={[6, 6, 0, 0]}>
                  {fillByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fill Trend Over Time Line/Area Chart */}
        <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">24-Hour Municipal Waste Accumulation</h3>
              <p className="text-xs text-slate-500">Predicted and historical fill curve</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Sensor Trend
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temporalTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xl text-xs">
                          <div className="font-bold">Time: {data.time}</div>
                          <div className="text-emerald-700 font-semibold mt-1">Average Fill: {data.avgFill}%</div>
                          <div className="text-rose-600 font-medium text-[11px]">Critical Bins: {data.criticalCount}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgFill"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#fillAreaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Critical Bins Dispatch Table */}
      <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Priority Dispatch Containers</h3>
            <p className="text-xs text-slate-500">Highest priority collection targets based on current ultrasonic sensor levels</p>
          </div>
          <button
            onClick={() => setActiveTab('routes')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            Optimize All Routes &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Bin ID & Name</th>
                <th className="pb-3">Ward / Area</th>
                <th className="pb-3">Waste Type</th>
                <th className="pb-3">Fill Capacity</th>
                <th className="pb-3">Temperature</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topCriticalBins.map((bin) => (
                <tr key={bin.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-2 font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        bin.fillLevel >= 80 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span>{bin.id}</span>
                    <span className="font-normal text-slate-500 text-[11px]">({bin.name})</span>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{bin.area}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bin.type === 'Wet'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bin.type === 'Dry'
                          ? 'bg-sky-100 text-sky-800'
                          : bin.type === 'Recyclable'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {bin.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-rose-600 w-9">{bin.fillLevel}%</span>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${bin.fillLevel}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{bin.temperature}&deg;C</td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => markBinAsCollected(bin.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors flex items-center gap-1 ml-auto active:scale-95"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Collect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
