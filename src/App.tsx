/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HeroBanner } from './components/HeroBanner';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { canopyBg } from './assets/images';

// Views
import { DashboardView } from './components/views/DashboardView';
import { RoutesView } from './components/views/RoutesView';
import { ScannerView } from './components/views/ScannerView';
import { ReportsView } from './components/views/ReportsView';
import { MissionsView } from './components/views/MissionsView';
import { PlannerView } from './components/views/PlannerView';
import { GamificationView } from './components/views/GamificationView';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [showHero, setShowHero] = useState<boolean>(true);

  return (
    <div className="relative min-h-screen text-slate-800 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Image: Lush Green Canopy & Sky Blue - CLEARLY VISIBLE */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-fixed bg-no-repeat pointer-events-none transition-all duration-700"
        style={{
          backgroundImage: `url(${canopyBg})`,
        }}
      />

      {/* Soft Nature Light Wash for High Readability without obscuring the photo */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/10 via-sky-950/15 to-slate-900/20 backdrop-blur-[1px] pointer-events-none" />

      {/* Left Sidebar: Clean White Glass Panel with Brand & Navigation */}
      <Sidebar />

      {/* Main Viewport Container */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen min-w-0 pb-20 md:pb-6">
        {/* Top Navbar */}
        <div className="p-3 sm:p-5 pb-0">
          <Navbar onOpenHero={() => setShowHero((prev) => !prev)} />
        </div>

        {/* Content Panel */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0">
          {/* Animated Hero Splash Banner */}
          {showHero && <HeroBanner onDismiss={() => setShowHero(false)} />}

          {/* Active Tab View */}
          <div className="animate-in fade-in duration-300">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'routes' && <RoutesView />}
            {activeTab === 'scanner' && <ScannerView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'missions' && <MissionsView />}
            {activeTab === 'planner' && <PlannerView />}
            {activeTab === 'gamification' && <GamificationView />}
          </div>
        </main>

        {/* Footer */}
        <div className="px-3 sm:px-5 lg:px-6">
          <Footer />
        </div>

        {/* Toast Notification Stack */}
        <ToastContainer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
