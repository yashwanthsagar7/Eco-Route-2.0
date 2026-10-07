import React from 'react';
import { useApp } from '../../context/AppContext';
import { CityMap } from '../CityMap';
import {
  Truck,
  CheckCircle2,
  TrendingDown,
  Gauge,
  Play,
  Leaf,
  Fuel,
  Clock,
  MapPin,
} from 'lucide-react';

export const RoutesView: React.FC = () => {
  const {
    cityConfig,
    smartBins,
    routesResult,
    numTrucks,
    setNumTrucks,
    fillThreshold,
    setFillThreshold,
    isCollecting,
    collectionProgress,
    activeTruckStop,
    startLiveCollection,
    markBinAsCollected,
  } = useApp();

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Dynamic Route Optimizer</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              2-Opt Green & Blue Fleet
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Solves multi-vehicle Traveling Salesperson Problem (TSP) in-browser. Targets only critical containers, minimizing diesel emissions.
          </p>
        </div>

        {/* Live Start Collection Dispatch Button */}
        <button
          onClick={startLiveCollection}
          disabled={isCollecting}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
            isCollecting
              ? 'bg-sky-700 text-white cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isCollecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Servicing Routes ({collectionProgress}%)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Start Collection Run</span>
            </>
          )}
        </button>
      </div>

      {/* Control Panel & Algorithm Parameters */}
      <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fleet Size Selector (1 - 3 Trucks) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Compactor Trucks</span>
              </label>
              <span className="text-sky-700 font-bold">{numTrucks} Trucks Deployed</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setNumTrucks(n)}
                  disabled={isCollecting}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    numTrucks === n
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {n === 1 ? '1 Truck' : n === 2 ? '2 Trucks' : '3 Trucks'}
                </button>
              ))}
            </div>
          </div>

          {/* Fill Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-sky-600" />
                <span>Collection Fill Threshold</span>
              </label>
              <span className="text-emerald-700 font-black">{fillThreshold}% Fill & Above</span>
            </div>
            <div className="space-y-1">
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={fillThreshold}
                disabled={isCollecting}
                onChange={(e) => setFillThreshold(Number(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>40% (Preventative)</span>
                <span>70% (Standard)</span>
                <span>90% (Urgent Only)</span>
              </div>
            </div>
          </div>

          {/* Quick Efficiency Summary Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                Algorithm Efficiency
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                {routesResult.percentageSaved}% Fuel Cut
              </span>
            </div>
            <div className="text-xs text-emerald-800 mt-2 leading-relaxed">
              Visiting <strong className="text-slate-900">{routesResult.criticalBinsCount} critical bins</strong> vs all {smartBins.length} bins cuts{' '}
              <strong className="text-emerald-900">{routesResult.distanceSavedKm} km</strong> of deadhead transit.
            </div>
          </div>
        </div>
      </div>

      {/* Main Map with Multi-Truck Routes */}
      <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Real-time Multi-Truck Route Polylines</h3>
            <p className="text-slate-500">Each truck operates on a distinct heuristic partition starting and ending at {cityConfig.depot.name}</p>
          </div>

          <div className="flex items-center gap-2">
            {routesResult.trucks.map((truck) => (
              <div
                key={truck.truckId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: truck.color }} />
                <span>{truck.truckName}</span>
                <span className="text-slate-500">({truck.stops.length} stops)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <CityMap
            bins={smartBins}
            routes={routesResult.trucks}
            activeTruckStop={activeTruckStop}
            heightClass="h-[480px] sm:h-[540px]"
          />

          {/* Collection Status Banner when Active */}
          {isCollecting && (
            <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 z-[500] p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-sky-300 shadow-xl max-w-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-800">
                <Truck className="w-4 h-4 text-sky-600 animate-bounce" />
                <span>Live Collection In Progress</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${collectionProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span>Servicing scheduled bins...</span>
                <span className="font-bold text-emerald-700">{collectionProgress}% complete</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Comparison Cards: Optimized Route vs Visiting All Bins */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Optimized Fleet Distance</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {routesResult.optimizedDistanceKm} km
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            vs {routesResult.baselineDistanceKm} km (All Bins)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Estimated Shift Time</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {routesResult.trucks.reduce((acc, t) => acc + t.estimatedMinutes, 0)} mins
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Across {numTrucks} active compactor{numTrucks > 1 ? 's' : ''}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Diesel Conserved</span>
            <Fuel className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {routesResult.fuelSavedLitres} L
          </div>
          <div className="text-[11px] text-sky-700 font-medium mt-1">
            {routesResult.percentageSaved}% consumption reduction
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>CO2 Abated Shift</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {Math.round(routesResult.distanceSavedKm * 0.95)} kg
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Clean air under urban canopy
          </div>
        </div>
      </div>

      {/* Truck Stop Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routesResult.trucks.map((truck) => (
          <div
            key={truck.truckId}
            className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: truck.color }} />
                <h4 className="font-bold text-slate-900 text-sm">{truck.truckName}</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {truck.stops.length} stops • {truck.totalDistanceKm} km
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                    0
                  </span>
                  <span>{cityConfig.depot.name}</span>
                </div>
                <span className="text-[10px] text-slate-400">Depart Hub</span>
              </div>

              {truck.stops.map((stop, idx) => {
                const isCollected = stop.fillLevel === 0;
                return (
                  <div
                    key={stop.id}
                    className={`p-2 rounded-xl border transition-colors flex items-center justify-between text-[11px] ${
                      isCollected
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: truck.color }}
                      >
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-bold">{stop.name}</span>{' '}
                        <span className="text-slate-400">({stop.area})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-black ${
                          stop.fillLevel >= 80
                            ? 'text-rose-600'
                            : stop.fillLevel >= 50
                            ? 'text-sky-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {stop.fillLevel}%
                      </span>

                      {isCollected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <button
                          onClick={() => markBinAsCollected(stop.id)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition-colors"
                          title="Mark collected"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                    &bull;
                  </span>
                  <span>{cityConfig.depot.name}</span>
                </div>
                <span className="text-[10px] text-slate-400">Return Hub</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
