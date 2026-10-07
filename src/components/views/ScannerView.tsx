import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SAMPLE_WASTE_ITEMS } from '../../data/mockBins';
import { WasteScanResult, WasteType } from '../../types';
import {
  ScanLine,
  Upload,
  Sparkles,
  CheckCircle,
  XCircle,
  Leaf,
  Trash2,
  Recycle,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ScannerView: React.FC = () => {
  const { addScanToHistory, scanHistory, addToast } = useApp();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<WasteScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Invalid File', 'Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setSelectedSample(null);
      setScanResult(null);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_WASTE_ITEMS)[0]) => {
    setSelectedSample(sample.id);
    setSelectedImage(sample.image);
    setScanResult(null);
    setErrorMsg(null);
  };

  const handleScan = async () => {
    if (!selectedImage && !selectedSample) {
      addToast('Select Image', 'Please upload a photo or choose a sample item to scan.', 'warning');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload: Record<string, unknown> = {};
      if (selectedSample) {
        payload.sampleItem = selectedSample;
      } else if (selectedImage) {
        payload.imageBase64 = selectedImage;
      }

      const res = await fetch('/api/gemini/scan-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const data: WasteScanResult = await res.json();
      setScanResult(data);

      // Save to global history and trigger celebratory confetti
      addScanToHistory(data);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#059669', '#0284c7', '#10b981'],
      });
      addToast('Scan Complete', `Classified as ${data.wasteType} -> ${data.correctBin} Bin`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to scan image';
      setErrorMsg(message);
      addToast('Scan Error', message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>AI Waste Classifier & Scanner</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Gemini Vision AI
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Snap or upload waste items. Gemini AI analyzes material composition, assigns the proper municipal bin, and awards citizen Green Points.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload & Preset Samples */}
        <div className="lg:col-span-6 space-y-5">
          {/* Upload / Capture Card */}
          <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-emerald-600" />
              <span>Step 1: Upload or Choose Waste Item</span>
            </h3>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview or Drag/Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center min-h-[220px] ${
                selectedImage
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50'
              }`}
            >
              {selectedImage ? (
                <div className="relative w-full max-h-56 flex items-center justify-center overflow-hidden rounded-xl">
                  <img
                    src={selectedImage}
                    alt="Waste preview"
                    className="max-h-52 object-contain rounded-lg shadow-sm"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg text-white font-semibold text-xs">
                    Click to change photo
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Click to upload photo</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP supported</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Or test with sample waste presets:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_WASTE_ITEMS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`p-2 rounded-xl border text-left transition-all flex flex-col items-center text-center gap-1.5 ${
                      selectedSample === sample.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={sample.image}
                      alt={sample.name}
                      className="w-10 h-10 object-cover rounded-lg shadow-xs"
                    />
                    <span className="text-[11px] font-bold truncate w-full">{sample.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-100 text-slate-600">
                      {sample.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Action Button in Plain Solid Emerald Green */}
            <button
              onClick={handleScan}
              disabled={isLoading || (!selectedImage && !selectedSample)}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
                isLoading || (!selectedImage && !selectedSample)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing with Gemini Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Item (+25 Green Points)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Analysis Result */}
        <div className="lg:col-span-6 space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Analysis Failed
              </div>
              <p className="mt-1 text-[11px] text-rose-700">{errorMsg}</p>
            </div>
          )}

          {scanResult ? (
            <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-5 animate-in fade-in zoom-in-95 duration-300">
              {/* Result Header & Bin Target */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                    Confidence: {scanResult.confidence}%
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1.5">{scanResult.wasteType}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {scanResult.items.map((it, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target Bin Card in Plain Solid Color */}
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Deposit In</div>
                  <div
                    className={`mt-1 px-3.5 py-1.5 rounded-xl font-black text-xs text-white shadow-xs inline-flex items-center gap-1.5 ${
                      scanResult.correctBin === 'Wet'
                        ? 'bg-emerald-600'
                        : scanResult.correctBin === 'Dry'
                        ? 'bg-sky-600'
                        : scanResult.correctBin === 'Recyclable'
                        ? 'bg-blue-600'
                        : 'bg-amber-600'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{scanResult.correctBin} Bin</span>
                  </div>
                </div>
              </div>

              {/* Recyclability & Eco-Score */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Recyclability</div>
                  <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-slate-800">
                    {scanResult.recyclable ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">100% Recyclable</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-slate-700">Non-Recyclable / Compost</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-medium">Points Awarded</div>
                  <div className="flex items-center gap-1 mt-1 font-black text-sm text-emerald-700">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>+25 Green Points</span>
                  </div>
                </div>
              </div>

              {/* Disposal Tips */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sanitation Guidance & Disposal Tips</span>
                </div>
                <div className="space-y-1.5">
                  {scanResult.disposalTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environmental Impact Note */}
              <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 text-xs text-sky-900 leading-relaxed flex items-start gap-2.5">
                <Leaf className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Environmental Impact:</strong> {scanResult.environmentalImpact}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md text-center flex flex-col items-center justify-center min-h-[360px] text-slate-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-xs">
                <Recycle className="w-7 h-7" />
              </div>
              <div className="max-w-xs">
                <h4 className="font-bold text-slate-800 text-sm">Awaiting Scanner Input</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Upload an image on the left or select a sample waste item to see instant Gemini vision classification.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
