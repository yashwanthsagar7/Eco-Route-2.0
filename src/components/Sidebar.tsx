import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Route,
  ScanLine,
  FileText,
  BrainCircuit,
  Trophy,
  Sparkles,
  ChevronRight,
  Radio,
  Award,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, kpiStats, currentUser, iotRunning, missions } = useApp();

  const activeMissionsCount = missions.filter((m) => !m.isCompleted).length;

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Telemetry Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      badge: kpiStats.criticalBins > 0 ? kpiStats.criticalBins : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'routes' as const,
      label: 'Route Optimizer',
      shortLabel: 'Routes',
      icon: Route,
    },
    {
      id: 'scanner' as const,
      label: 'AI Waste Scanner',
      shortLabel: 'Scanner',
      icon: ScanLine,
    },
    {
      id: 'reports' as const,
      label: 'Junk Map & Cleanups',
      shortLabel: 'Junk Map',
      icon: FileText,
      badge: kpiStats.activeReports > 0 ? kpiStats.activeReports : undefined,
      badgeColor: 'bg-sky-600',
    },
    {
      id: 'missions' as const,
      label: 'Missions & Certificates',
      shortLabel: 'Missions',
      icon: Award,
      badge: activeMissionsCount > 0 ? activeMissionsCount : undefined,
      badgeColor: 'bg-amber-600',
    },
    {
      id: 'planner' as const,
      label: 'AI Sanitation Planner',
      shortLabel: 'Planner',
      icon: BrainCircuit,
    },
    {
      id: 'gamification' as const,
      label: 'Points & Leaderboard',
      shortLabel: 'Profile',
      icon: Trophy,
    },
  ];

  return (
    <>
      {/* Desktop Full-Height White Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/95 backdrop-blur-2xl border-r border-slate-200/90 shadow-2xl p-5 shrink-0 justify-between h-screen sticky top-0 z-30">
        <div className="flex flex-col space-y-5">
          {/* Top Logo / Brand Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  EcoRoute <span className="text-sky-600">AI</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Smart Sanitation & Fleet Grid
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            <nav className="flex flex-col space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Citizen Profile & IoT Telemetry */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80">
          {/* Live IoT Status Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${iotRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[11px] font-medium text-slate-700">
                {iotRunning ? 'IoT Sensors Live (3s)' : 'Sensors Paused'}
              </span>
            </div>
            <Radio className={`w-3.5 h-3.5 ${iotRunning ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>

          {/* User Profile Card */}
          <button
            onClick={() => setActiveTab('gamification')}
            className="w-full p-2.5 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/80 transition-all text-left flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
              {currentUser.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {currentUser.points} pts
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{currentUser.level}</span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar in Clean White */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-colors ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
                {item.badge && (
                  <span className={`absolute -top-1 -right-2 px-1 rounded-full text-white text-[8px] font-black ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[50px]">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
