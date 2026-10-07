import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ScanLine, Leaf, X, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeroBannerProps {
  onDismiss: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onDismiss }) => {
  const { kpiStats, setActiveTab } = useApp();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-xl p-6 sm:p-8 mb-6 text-slate-900">
      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        title="Dismiss overview"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 max-w-3xl">
        {/* Initiative Badge in Plain Colors */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-3"
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Smart City Waste Management & Sanitation Platform</span>
        </motion.div>

        {/* Heading & Tagline in plain solid colors */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight"
        >
          EcoRoute <span className="text-emerald-600">AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-base sm:text-lg font-bold text-sky-700 mt-1"
        >
          Cleaner cities, smarter routes
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-slate-600 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed"
        >
          Autonomous waste-management ecosystem integrating 40 IoT telemetry smart containers in Hyderabad, multi-vehicle 2-Opt fleet route optimization, and Gemini Vision AI for citizen waste sorting.
        </motion.p>

        {/* Action Buttons in plain solid colors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center gap-3 mt-5"
        >
          <button
            onClick={onDismiss}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors active:scale-95"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onDismiss();
              setActiveTab('scanner');
            }}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors active:scale-95"
          >
            <ScanLine className="w-4 h-4" />
            <span>Try AI Waste Scanner</span>
          </button>

          <button
            onClick={() => {
              onDismiss();
              setActiveTab('missions');
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors active:scale-95"
          >
            <Award className="w-4 h-4" />
            <span>Weekly Missions & Certificates</span>
          </button>
        </motion.div>

        {/* Live Quick Counters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200/80"
        >
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Monitored Bins</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{kpiStats.totalBins}</div>
            <div className="text-[10px] text-emerald-700 font-semibold">100% Online</div>
          </div>
          <div className="bg-rose-50/70 rounded-xl p-3 border border-rose-200/80">
            <div className="text-[11px] font-medium text-slate-500">Critical Overflow</div>
            <div className="text-xl font-black text-rose-600 mt-0.5">{kpiStats.criticalBins}</div>
            <div className="text-[10px] text-rose-700 font-medium">&ge; 80% Capacity</div>
          </div>
          <div className="bg-sky-50/70 rounded-xl p-3 border border-sky-200/80">
            <div className="text-[11px] font-medium text-slate-500">Diesel Saved</div>
            <div className="text-xl font-black text-sky-700 mt-0.5">{kpiStats.fuelSaved} L</div>
            <div className="text-[10px] text-sky-700 font-medium">via 2-Opt TSP</div>
          </div>
          <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/80">
            <div className="text-[11px] font-medium text-slate-500">Carbon Abated</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{kpiStats.co2Saved} kg</div>
            <div className="text-[10px] text-emerald-700 font-medium">GHG reduction</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
