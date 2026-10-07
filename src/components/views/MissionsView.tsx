import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyMission, AppreciationCertificate, CitizenReport } from '../../types';
import { CertificateModal } from '../CertificateModal';
import { CleanupModal } from '../CleanupModal';
import {
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Download,
  Trash2,
  ScanLine,
  AlertTriangle,
  MapPin,
  Check,
  Flame,
} from 'lucide-react';

export const MissionsView: React.FC = () => {
  const {
    missions,
    certificates,
    citizenReports,
    currentUser,
    awardCertificate,
    setActiveTab,
  } = useApp();

  const [selectedCertificate, setSelectedCertificate] = useState<AppreciationCertificate | null>(null);
  const [selectedReportForCleanup, setSelectedReportForCleanup] = useState<CitizenReport | null>(null);

  // Uncleaned garbage sites available for citizen missions
  const pendingGarbageSites = citizenReports.filter((r) => r.status !== 'Resolved');

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Weekly Civic Missions & Certificates</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Rewards Program
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Complete weekly sanitation sweeps, photograph before-and-after cleanups, and earn official Municipal Certificates of Appreciation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Cycle Ends in 4 Days</span>
          </div>
        </div>
      </div>

      {/* User Civic Standing & Certificate Summary Banner */}
      <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">{currentUser.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {currentUser.level}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified Cleanups: <strong className="text-emerald-700 font-bold">{currentUser.cleanupsVerified || 1} sites</strong> &bull; Total Green Points: <strong className="text-sky-700 font-bold">{currentUser.points} pts</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-center px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Earned Certificates</div>
            <div className="text-xl font-black text-amber-900">{certificates.length}</div>
          </div>
          <div className="text-center px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Missions Active</div>
            <div className="text-xl font-black text-emerald-800">
              {missions.filter((m) => !m.isCompleted).length}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Missions Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Active Weekly Quests</span>
          </h3>
          <span className="text-xs text-slate-500">Auto-tracked via photo uploads</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((mission) => {
            const percent = Math.min(100, Math.round((mission.currentCount / mission.targetCount) * 100));
            const isDone = mission.isCompleted;

            return (
              <div
                key={mission.id}
                className={`p-5 rounded-3xl bg-white/95 backdrop-blur-xl border shadow-md flex flex-col justify-between space-y-4 transition-all ${
                  isDone ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                      {mission.type === 'clean_garbage'
                        ? 'Cleanup Drive'
                        : mission.type === 'scan_waste'
                        ? 'AI Scanning'
                        : mission.type === 'report_overflow'
                        ? 'Civic Scouting'
                        : 'Ward Sweep'}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                      <span>+{mission.rewardPoints} pts</span>
                      {mission.certificateEligible && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Certificate
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                    {mission.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{mission.description}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Mission Progress</span>
                    <span className="font-bold text-slate-900">
                      {mission.currentCount} / {mission.targetCount} ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-emerald-600' : 'bg-sky-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2">
                  {isDone ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Mission Completed & Claimed</span>
                      </div>
                      {certificates.length > 0 && (
                        <button
                          onClick={() => setSelectedCertificate(certificates[0])}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          View Certificate &rarr;
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {mission.targetCount - mission.currentCount} actions remaining
                      </span>

                      {mission.type === 'clean_garbage' ? (
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <span>Find Junk to Clean</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : mission.type === 'scan_waste' ? (
                        <button
                          onClick={() => setActiveTab('scanner')}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>Scan Waste</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Report Overflow</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nearby Garbage Sites Needing Cleanup */}
      <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Garbage Sites Needing Citizen Cleaning</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select any site below to clear it, snap an After Cleaning photo, and claim +150 points plus appreciation certificates.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs font-bold text-emerald-700 hover:underline self-start sm:self-auto"
          >
            View on Interactive Map &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingGarbageSites.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                {report.imageUrl && (
                  <div className="h-32 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 relative">
                    <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white">
                      BEFORE PHOTO
                    </span>
                    {report.distanceMeters !== undefined && (
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-sky-600 text-white shadow-xs">
                        📍 {report.distanceMeters < 1000 ? `${report.distanceMeters}m` : `${(report.distanceMeters / 1000).toFixed(1)}km`} away
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-800">{report.area}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      {report.severity} Priority
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{report.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{report.description}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReportForCleanup(report)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clean & Upload After Photo</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Earned Appreciation Certificates Showcase */}
      <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>Your Official Municipal Certificates of Appreciation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Authenticated civic awards authorized by the Greater Hyderabad Municipal Corporation
            </p>
          </div>

          <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''} Issued
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-5 rounded-3xl bg-amber-50/50 border-2 border-amber-200/80 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-400 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-amber-800">{cert.certificateNumber}</span>
                  <span className="text-slate-500">{cert.dateAwarded}</span>
                </div>

                <h4 className="font-serif font-black text-sm sm:text-base text-amber-950 uppercase tracking-tight">
                  {cert.title}
                </h4>

                <p className="text-xs text-slate-700 italic font-serif">
                  Awarded to <strong className="text-emerald-800">{cert.recipientName}</strong> for &ldquo;{cert.missionTitle}&rdquo;
                </p>

                <div className="flex items-center gap-4 text-xs pt-2 text-slate-600 font-medium">
                  <span>Cleared: <strong className="text-slate-900">{cert.wasteClearedKg} kg</strong></span>
                  <span>Carbon: <strong className="text-emerald-700">~{cert.co2SavedKg} kg CO2</strong></span>
                  <span>Points: <strong className="text-emerald-700">+{cert.pointsEarned}</strong></span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setSelectedCertificate(cert)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View & Download Certificate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* Cleanup Modal */}
      {selectedReportForCleanup && (
        <CleanupModal
          report={selectedReportForCleanup}
          onClose={() => setSelectedReportForCleanup(null)}
          onViewCertificate={() => {
            if (certificates.length > 0) setSelectedCertificate(certificates[0]);
          }}
        />
      )}
    </div>
  );
};
