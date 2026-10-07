import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Trophy,
  Zap,
  MapPin,
  Radio,
  RotateCcw,
  Info,
  Crosshair,
} from 'lucide-react';

interface NavbarProps {
  onOpenHero?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHero }) => {
  const {
    cityConfig,
    iotRunning,
    setIotRunning,
    simulateRushHour,
    resetSimulation,
    currentUser,
    setActiveTab,
    userLocation,
    isTrackingLocation,
    startTrackingLocation,
  } = useApp();

  return (
    <header className="w-full bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-sm rounded-2xl px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-slate-800">
      {/* Left: Mobile Brand & City Indicator */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand Button */}
        <button
          onClick={onOpenHero}
          className="md:hidden flex items-center gap-2 text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 leading-tight">
              EcoRoute <span className="text-sky-600">AI</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Smart Waste</div>
          </div>
        </button>

        {/* City & Live Status */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{cityConfig.name}, {cityConfig.state}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-semibold">
            <span className={`w-2 h-2 rounded-full ${iotRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[11px]">
              {iotRunning ? 'Live IoT (3s)' : 'Sensors Paused'}
            </span>
          </div>

          {/* GPS Live Tracking Toggle Button */}
          <button
            onClick={startTrackingLocation}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
              userLocation
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Track GPS location and nearby junk"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isTrackingLocation ? 'text-sky-600 animate-spin' : 'text-sky-600'}`} />
            <span className="hidden md:inline">
              {userLocation ? 'GPS Locked' : isTrackingLocation ? 'Locating…' : 'Locate Me'}
            </span>
          </button>
        </div>
      </div>

      {/* Right Controls: Rush Hour, Reset, Points */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* IoT Streaming Toggle (Desktop) */}
        <button
          onClick={() => setIotRunning((r) => !r)}
          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            iotRunning
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Toggle real-time IoT sensor telemetry updates"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{iotRunning ? 'Streaming On' : 'Streaming Paused'}</span>
        </button>

        {/* Simulate Rush Hour button in plain solid sky blue */}
        <button
          onClick={simulateRushHour}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95"
          title="Spike fill levels across commercial market containers"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Simulate Rush Hour</span>
          <span className="sm:hidden">Rush Hour</span>
        </button>

        {/* Reset button in plain solid slate */}
        <button
          onClick={resetSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium transition-colors active:scale-95"
          title="Reset bins to initial baseline state"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Citizen Points Badge */}
        <button
          onClick={() => setActiveTab('gamification')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-slate-800 text-xs font-semibold transition-colors"
          title="View Green Points and Badges"
        >
          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-700 font-bold">{currentUser.points}</span>
          <span className="text-[10px] text-slate-500 font-normal">pts</span>
        </button>

        {/* Hero banner toggle button */}
        {onOpenHero && (
          <button
            onClick={onOpenHero}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
            title="Toggle Hero Overview"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
