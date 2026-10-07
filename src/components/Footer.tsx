import React from 'react';
import { Sparkles, Leaf, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { cityConfig, setActiveTab } = useApp();

  return (
    <footer className="mt-8 rounded-2xl bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-sm p-4 sm:p-5 text-xs text-slate-600">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Hackathon Attribution */}
        <div className="flex flex-wrap items-center gap-2.5 text-center md:text-left justify-center md:justify-start">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>EcoRoute AI</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <span className="text-slate-600">
            Built for Google AI Studio Smart City Hackathon
          </span>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{cityConfig.name} Municipal Ward Initiative</span>
          </div>
        </div>

        {/* Center / Right: Quick Navigation Links in Plain Colors */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="hover:text-emerald-700 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className="hover:text-emerald-700 transition-colors"
          >
            Routes
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className="hover:text-emerald-700 transition-colors"
          >
            AI Scanner
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="hover:text-emerald-700 transition-colors"
          >
            Citizen Reports
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className="hover:text-amber-700 transition-colors"
          >
            Missions & Awards
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className="hover:text-emerald-700 transition-colors"
          >
            Sanitation AI
          </button>
          <button
            onClick={() => setActiveTab('gamification')}
            className="hover:text-emerald-700 transition-colors"
          >
            Leaderboard
          </button>
        </div>

        {/* Right Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero-Waste Urban Initiative</span>
        </div>
      </div>
    </footer>
  );
};
