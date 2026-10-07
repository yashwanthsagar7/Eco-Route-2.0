import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trophy,
  Award,
  Medal,
  CheckCircle2,
  Lock,
  Sparkles,
  ScanLine,
  AlertTriangle,
  Route,
} from 'lucide-react';

export const GamificationView: React.FC = () => {
  const { currentUser, leaderboard, setActiveTab } = useApp();

  const points = currentUser.points;
  const targetPoints = points >= 1000 ? 1500 : points >= 600 ? 1000 : points >= 300 ? 600 : 300;
  const progressPercent = Math.min(100, Math.round((points / targetPoints) * 100));

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span>Civic Green Points & Leaderboard</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            Citizen Rewards
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Gamifying civic hygiene. Earn Green Points every time you scan recyclables, report illegal dumping, or help empty municipal bins.
        </p>
      </div>

      {/* User Civic Profile Card in Clean White Glass */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">{currentUser.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {currentUser.level}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                Banjara Hills Municipal Ward 88 &bull; Active Citizen Contributor
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-700">
                <span>Scans: <strong className="text-emerald-700 font-bold">{currentUser.scansCompleted}</strong></span>
                <span>Reports: <strong className="text-sky-700 font-bold">{currentUser.reportsSubmitted}</strong></span>
                <span>Badges: <strong className="text-slate-900 font-bold">{currentUser.badges.filter((b) => b.unlocked).length}</strong></span>
              </div>
            </div>
          </div>

          {/* Points Showcase */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left md:text-right shrink-0">
            <div className="text-xs text-emerald-800 font-medium">Current Balance</div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 mt-0.5 flex items-center md:justify-end gap-1.5">
              <span>{currentUser.points}</span>
              <span className="text-sm font-bold text-sky-700">Points</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold mt-1">
              Top 5% in Hyderabad Greater Municipal Area
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Progress to Next Tier (Tier 4: Sanitation Vanguard)
            </span>
            <span className="font-bold text-emerald-700">{points} / {targetPoints} pts ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Eco Rookie (0)</span>
            <span>Clean City Scout (300)</span>
            <span className="text-emerald-700 font-bold">Green Champion (600)</span>
            <span>Sanitation Vanguard (1000)</span>
          </div>
        </div>
      </div>

      {/* Ways to Earn Points Fast */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('scanner')}
          className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Scan Waste Item</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Use Gemini AI Vision to sort recyclable materials properly.</div>
            <span className="inline-block mt-2 text-xs font-bold text-emerald-700">+25 Points per scan &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('reports')}
          className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md hover:border-sky-300 transition-all cursor-pointer group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Report Overflow</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Snap illegal dumping or full containers on the municipal map.</div>
            <span className="inline-block mt-2 text-xs font-bold text-sky-700">+50 Points per report &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('routes')}
          className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md hover:border-blue-300 transition-all cursor-pointer group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Optimize Route Run</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Dispatch compactor trucks and service high-fill smart bins.</div>
            <span className="inline-block mt-2 text-xs font-bold text-blue-700">+100 Points per run &rarr;</span>
          </div>
        </div>
      </div>

      {/* Badges Collection Showcase */}
      <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Civic Badges & Achievements</h3>
            <p className="text-xs text-slate-500">Recognizing dedication to urban cleanliness and zero-waste goals</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {currentUser.badges.filter((b) => b.unlocked).length} of {currentUser.badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {currentUser.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between space-y-2 ${
                badge.unlocked
                  ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                  badge.unlocked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {badge.unlocked ? <Award className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900">{badge.name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">{badge.description}</p>
              </div>

              {badge.unlocked ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Unlocked
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hyderabad Civic Leaderboard Table */}
      <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Greater Hyderabad Civic Leaderboard</h3>
            <p className="text-xs text-slate-500">Top sanitation champions across municipal wards this month</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Updated Hourly</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Citizen Champion</th>
                <th className="pb-3">Ward</th>
                <th className="pb-3">Level</th>
                <th className="pb-3">Actions Completed</th>
                <th className="pb-3 text-right pr-2">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((entry) => {
                const isCurrent = entry.isCurrentUser;
                return (
                  <tr
                    key={entry.rank}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 pl-2 font-black text-xs">
                      {entry.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] shadow-xs">
                          1
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center text-[11px] shadow-xs">
                          2
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-orange-400 text-white flex items-center justify-center text-[11px] shadow-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 pl-2">#{entry.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-[11px] shrink-0 ${
                            isCurrent ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}
                        >
                          {entry.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{entry.name}</span>
                          {isCurrent && (
                            <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-600 text-white">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 text-slate-600">{entry.area}</td>

                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        {entry.badge}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-600 font-medium">
                      {entry.reports + entry.scans} civic contributions
                    </td>

                    <td className="py-3.5 text-right pr-2 font-black text-sm text-emerald-700">
                      {entry.points} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
