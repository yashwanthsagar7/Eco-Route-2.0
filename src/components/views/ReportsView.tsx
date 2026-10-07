import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CityMap } from '../CityMap';
import { CitizenReport, AppreciationCertificate } from '../../types';
import { CleanupModal } from '../CleanupModal';
import { CertificateModal } from '../CertificateModal';
import {
  AlertTriangle,
  Camera,
  MapPin,
  Sparkles,
  Send,
  Truck,
  Filter,
  Check,
  ShieldCheck,
  Crosshair,
  Award,
  Navigation,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    cityConfig,
    smartBins,
    citizenReports,
    addCitizenReport,
    updateReportStatus,
    currentUser,
    addToast,
    userLocation,
    isTrackingLocation,
    startTrackingLocation,
    surroundingRadiusKm,
    setSurroundingRadiusKm,
    certificates,
    setActiveTab,
  } = useApp();

  const [viewMode, setViewMode] = useState<'report' | 'admin'>('report');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('Banjara Hills');
  const [lat, setLat] = useState<number>(userLocation ? userLocation.lat : 17.4195);
  const [lng, setLng] = useState<number>(userLocation ? userLocation.lng : 78.4328);
  const [image, setImage] = useState<string | null>(null);

  const [category, setCategory] = useState('Commercial Dumpster Overflow');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    priorityAction?: string;
    urgencyReason?: string;
    estimatedVolumeKg?: number;
  } | null>(null);

  const [adminFilter, setAdminFilter] = useState<'All' | 'Reported' | 'Assigned' | 'Resolved'>('All');
  const [radiusFilter, setRadiusFilter] = useState<number>(3); // 3 km default surrounding filter

  // Modals
  const [selectedReportForCleanup, setSelectedReportForCleanup] = useState<CitizenReport | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<AppreciationCertificate | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      triggerGeminiAnalysis(base64, description);
    };
    reader.readAsDataURL(file);
  };

  const triggerGeminiAnalysis = async (base64Img: string, userDesc: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          description: userDesc,
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      if (data.category) setCategory(data.category);
      if (data.severity) setSeverity(data.severity as any);
      setAiSuggestions({
        priorityAction: data.priorityAction,
        urgencyReason: data.urgencyReason,
        estimatedVolumeKg: data.estimatedVolumeKg,
      });

      addToast('Gemini Analyzed Site 🤖', `Auto-detected ${data.severity} severity: ${data.category}`, 'info');
    } catch (err) {
      console.warn('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDetectGPS = () => {
    startTrackingLocation();
    if (userLocation) {
      setLat(Number(userLocation.lat.toFixed(4)));
      setLng(Number(userLocation.lng.toFixed(4)));
      addToast('GPS Location Tagged 📍', `Tagged coordinates: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`, 'success');
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
          addToast('Location Detected', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, 'success');
        },
        () => {
          setLat(17.4235);
          setLng(78.4385);
          addToast('Location Set', 'Using municipal precinct coordinates.', 'info');
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast('Missing Info', 'Please enter a title and description.', 'warning');
      return;
    }

    addCitizenReport({
      title,
      description,
      imageUrl: image || undefined,
      lat,
      lng,
      area,
      category,
      severity,
      status: 'Reported',
      reporterName: currentUser.name,
      estimatedVolumeKg: aiSuggestions?.estimatedVolumeKg || 120,
      priorityAction: aiSuggestions?.priorityAction || 'Pending inspection by citizen squad',
    });

    addToast('Incident Reported! 🛡️', 'Logged on municipal map and awarded +50 Green Points.', 'success');

    setTitle('');
    setDescription('');
    setImage(null);
    setAiSuggestions(null);
    setViewMode('admin');
  };

  // Filter reports by status and surrounding GPS radius
  const filteredReports = useMemo(() => {
    return citizenReports.filter((r) => {
      if (adminFilter !== 'All' && r.status !== adminFilter) return false;
      if (radiusFilter > 0 && r.distanceMeters !== undefined) {
        if (r.distanceMeters > radiusFilter * 1000) return false;
      }
      return true;
    });
  }, [citizenReports, adminFilter, radiusFilter]);

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Citizen Junk Mapping & Cleanup Verification</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              Civic Action
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Track garbage in your surrounding area with live GPS, submit photo entries, and upload before-and-after photos for verified cleanup rewards.
          </p>
        </div>

        {/* View Mode Switcher in Plain Solid Colors */}
        <div className="flex items-center gap-1.5 p-1 bg-white/95 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('report')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              viewMode === 'report'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pin & Report Junk
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'admin'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Surrounding Junk & Triage</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                viewMode === 'admin' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {citizenReports.length}
            </span>
          </button>
        </div>
      </div>

      {/* Surrounding GPS Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>GPS Proximity Radar</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-500">
              {userLocation
                ? `Tracking location at ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)} (±${userLocation.accuracy}m)`
                : 'GPS tracking standby'}
            </div>
          </div>
        </div>

        {/* Radius filter selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 text-xs">Surrounding Area:</span>
          {[
            { label: 'Within 1 km', val: 1 },
            { label: 'Within 3 km', val: 3 },
            { label: 'Within 5 km', val: 5 },
            { label: 'All Greater Hyderabad', val: 0 },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => {
                setRadiusFilter(item.val);
                setSurroundingRadiusKm(item.val || 5);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                radiusFilter === item.val
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={handleDetectGPS}
            className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Update GPS</span>
          </button>
        </div>
      </div>

      {viewMode === 'report' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-sky-600" />
                <span>Log New Garbage Location on Map</span>
              </h3>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Garbage / Dumping Title</label>
                <input
                  type="text"
                  placeholder="e.g. Curb litter & broken boxes outside vegetable store"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Detailed Description of Waste</label>
                <textarea
                  rows={3}
                  placeholder="Describe material type, visible bags, stench, road blockage, or safety hazard..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>

              {/* Location & GPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Ward / Locality</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="Banjara Hills">Banjara Hills (Ward 88)</option>
                    <option value="Jubilee Hills">Jubilee Hills (Ward 94)</option>
                    <option value="HITEC City">HITEC City (Ward 102)</option>
                    <option value="Gachibowli">Gachibowli (Ward 105)</option>
                    <option value="Ameerpet">Ameerpet (Ward 82)</option>
                    <option value="Begumpet">Begumpet (Ward 78)</option>
                    <option value="Secunderabad">Secunderabad (Ward 62)</option>
                    <option value="Charminar">Charminar (Ward 45)</option>
                    <option value="Mehdipatnam">Mehdipatnam (Ward 72)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-700">GPS Coordinates</label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      className="text-sky-600 hover:text-sky-700 flex items-center gap-1 font-semibold"
                    >
                      <Crosshair className="w-3 h-3" />
                      Auto-Detect GPS
                    </button>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono">
                    {lat}, {lng}
                  </div>
                </div>
              </div>

              {/* Photo Upload with Gemini Analysis */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Photo of Garbage (AI Vision Evaluated)</span>
                  {isAnalyzing && (
                    <span className="text-sky-600 flex items-center gap-1 text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3 animate-spin text-emerald-600" />
                      Auto-evaluating severity...
                    </span>
                  )}
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
                >
                  {image ? (
                    <div className="flex items-center gap-3">
                      <img src={image} alt="Uploaded site preview" className="w-16 h-16 rounded-xl object-cover" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Garbage photo attached</div>
                        <div className="text-[11px] text-sky-600">Click to change picture</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Camera className="w-5 h-5 text-sky-600" />
                      <span>Take or upload photo of the junk</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* AI Auto-Classified Category & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Severity Assessment</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Low', 'Medium', 'High'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                          severity === sev
                            ? sev === 'High'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : sev === 'Medium'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Suggestions Box */}
              {aiSuggestions && (
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs space-y-1.5">
                  <div className="font-bold text-sky-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gemini Dispatch Directive</span>
                  </div>
                  <div className="text-slate-800">
                    <strong>Recommended Action:</strong> {aiSuggestions.priorityAction}
                  </div>
                  {aiSuggestions.estimatedVolumeKg && (
                    <div className="text-slate-500 text-[11px]">
                      Estimated Rubble / Waste Volume: <strong>~{aiSuggestions.estimatedVolumeKg} kg</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Submit button in plain solid Emerald Green */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Submit Garbage Entry (+50 Green Points)</span>
              </button>
            </form>
          </div>

          {/* Right Column: Mini Map with click-to-pin */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Pin Location on Map</span>
                <span className="text-[11px] text-sky-600 font-semibold">Click map to set pin</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <CityMap
                  bins={smartBins}
                  reports={citizenReports}
                  onMapClick={(clickedLat, clickedLng) => {
                    setLat(Number(clickedLat.toFixed(4)));
                    setLng(Number(clickedLng.toFixed(4)));
                    addToast('Coordinates Updated 📍', `${clickedLat.toFixed(4)}, ${clickedLng.toFixed(4)}`, 'info');
                  }}
                  onStartCleanup={(rep) => setSelectedReportForCleanup(rep)}
                  heightClass="h-72 sm:h-80"
                />
              </div>
              <div className="text-[11px] text-slate-500">
                You can click anywhere on the map to set the exact coordinates of the garbage.
              </div>
            </div>

            {/* Quick mission prompt */}
            <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-700" />
                <span>Active Weekly Mission: Clean 2 Garbage Sites</span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                After reporting, clean the site with fellow citizens and snap an After photo to earn an official Municipal Certificate of Appreciation.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('missions')}
                className="text-xs font-bold text-amber-900 hover:underline"
              >
                View Weekly Missions &rarr;
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SURROUNDING JUNK & ADMIN TRIAGE VIEW */
        <div className="space-y-4">
          {/* Main Map with Surrounding Junk & Radar */}
          <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="font-extrabold text-sm text-slate-900">
                  Surrounding Garbage & Cleaned Locations
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                  {filteredReports.length} Sites in Range
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">
                Click on any garbage marker to inspect before/after photos or clean the site
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <CityMap
                bins={smartBins}
                reports={filteredReports}
                onStartCleanup={(rep) => setSelectedReportForCleanup(rep)}
                heightClass="h-[420px] sm:h-[480px]"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              {(['All', 'Reported', 'Assigned', 'Resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setAdminFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    adminFilter === st
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              Showing <strong className="text-slate-900">{filteredReports.length}</strong> garbage records
            </div>
          </div>

          {/* Garbage Sites Cards Grid with Before and After Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const isResolved = report.status === 'Resolved';
              const isAssigned = report.status === 'Assigned';
              const isHigh = report.severity === 'High';

              return (
                <div
                  key={report.id}
                  className={`p-5 rounded-3xl bg-white/95 backdrop-blur-xl border shadow-md flex flex-col justify-between space-y-4 transition-all ${
                    isResolved
                      ? 'border-emerald-300'
                      : isHigh
                      ? 'border-rose-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500 font-bold">{report.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            report.severity === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : report.severity === 'Medium'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {report.severity}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isAssigned
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{report.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{report.description}</p>

                    {/* Proximity Distance */}
                    {report.distanceMeters !== undefined && (
                      <div className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {report.distanceMeters < 1000
                            ? `${report.distanceMeters}m from your location`
                            : `${(report.distanceMeters / 1000).toFixed(1)}km from your location`}
                        </span>
                      </div>
                    )}

                    {/* Photos Showcase: Before & After */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Before Photo */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">1. Before Photo</span>
                        <div className="rounded-xl overflow-hidden h-24 border border-slate-200 bg-slate-100">
                          {report.imageUrl ? (
                            <img src={report.imageUrl} alt="Before" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-slate-400">
                              No photo
                            </div>
                          )}
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">2. After Cleaning</span>
                        <div className="rounded-xl overflow-hidden h-24 border border-slate-200 bg-slate-50">
                          {report.afterImageUrl ? (
                            <img src={report.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[10px] text-slate-400 text-center p-1">
                              <span>Pending cleanup</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cleaned Info if resolved */}
                    {isResolved && report.cleanedBy && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] space-y-0.5">
                        <div className="font-bold text-emerald-900 flex items-center justify-between">
                          <span>Cleaned by {report.cleanedBy}</span>
                          <span className="text-emerald-700">{report.cleanedAt}</span>
                        </div>
                        {report.cleaningNotes && (
                          <div className="text-slate-600 text-[10px]">{report.cleaningNotes}</div>
                        )}
                        {report.aiVerification && (
                          <div className="text-emerald-800 font-semibold text-[10px] pt-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>AI Verified: {report.aiVerification.cleanlinessRating}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {!isResolved ? (
                      <button
                        onClick={() => setSelectedReportForCleanup(report)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Clean & Upload After Photo</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold text-center flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Remediated & Verified</span>
                        </div>
                        {certificates.length > 0 && (
                          <button
                            onClick={() => setSelectedCertificate(certificates[0])}
                            className="p-1.5 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                            title="View Certificate"
                          >
                            <Award className="w-4 h-4" />
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

      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};
