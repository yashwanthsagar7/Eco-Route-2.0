import React, { useState, useRef } from 'react';
import { CitizenReport } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CleanupModalProps {
  report: CitizenReport;
  onClose: () => void;
  onViewCertificate?: () => void;
}

export const CleanupModal: React.FC<CleanupModalProps> = ({
  report,
  onClose,
  onViewCertificate,
}) => {
  const { submitCleanupVerification, addToast } = useApp();

  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [cleaningNotes, setCleaningNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidence: number;
    cleanlinessRating: string;
    comments: string;
    pointsBonus: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAfterImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!afterImage) {
      addToast('After Photo Required', 'Please upload or snap a photo of the cleaned site.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitCleanupVerification(report.id, afterImage, cleaningNotes);
      setVerificationResult(result);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#0284c7', '#10b981'],
      });

      addToast('Cleanup Verified! 🎉', `Awarded +${result.pointsBonus} Green Points for cleaning ${report.title}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify cleanup';
      addToast('Error', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Verify Garbage Cleanup & Upload Photos
              </h3>
              <p className="text-[11px] text-slate-500">
                Side-by-side Gemini AI validation for civic hygiene points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {verificationResult ? (
            /* Verification Success Screen */
            <div className="text-center space-y-4 py-3 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {verificationResult.cleanlinessRating} ({verificationResult.confidence}% Confidence)
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-2">
                  Cleanup Successfully Verified!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  {verificationResult.comments}
                </p>
              </div>

              {/* Side-by-side Before and After Showcase */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-left">
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">BEFORE Cleanup</div>
                  <div className="h-36 rounded-xl overflow-hidden bg-slate-100">
                    <img src={report.imageUrl} alt="Before cleanup" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-300">
                  <div className="text-[11px] font-bold text-emerald-800 mb-1.5 flex items-center justify-between">
                    <span>AFTER Cleanup</span>
                    <span className="text-[10px] font-black text-emerald-700">Verified</span>
                  </div>
                  <div className="h-36 rounded-xl overflow-hidden bg-white">
                    <img src={afterImage || ''} alt="After cleanup" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Points & Certificate Reward Prompt */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      +{verificationResult.pointsBonus} Green Points Awarded
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Weekly mission progress updated. Certificate unlocked!
                    </div>
                  </div>
                </div>

                {onViewCertificate && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewCertificate();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                  >
                    <span>View Appreciation Certificate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Review Form */
            <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
              {/* Site Details Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-500 font-bold">{report.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    {report.severity} Priority
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{report.title}</h4>
                <p className="text-slate-600 text-[11px]">{report.description}</p>
                <div className="text-[11px] text-sky-700 font-medium pt-1">
                  Location: {report.area} ({report.lat}, {report.lng})
                </div>
              </div>

              {/* Photos Comparison Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BEFORE Photo (Pre-existing) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>1. Before Photo (Reported Site)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Evidence</span>
                  </div>
                  <div className="h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                    {report.imageUrl ? (
                      <img src={report.imageUrl} alt="Before cleanup" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-slate-400">
                        No photo attached with initial report
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white">
                      INITIAL STATE
                    </span>
                  </div>
                </div>

                {/* AFTER Photo (To upload) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>2. After Photo (Cleaned Site)</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Required</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-3 text-center relative overflow-hidden ${
                      afterImage
                        ? 'border-emerald-400 bg-emerald-50/50'
                        : 'border-slate-300 hover:border-emerald-500 bg-slate-50'
                    }`}
                  >
                    {afterImage ? (
                      <>
                        <img src={afterImage} alt="After cleanup" className="w-full h-full object-cover rounded-xl" />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          CLEANED STATE (Click to replace)
                        </span>
                      </>
                    ) : (
                      <div className="space-y-2 p-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            Snap or Upload Cleaned Photo
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Show empty pavement, cleared bags & clean ground
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cleaning Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Cleanup Notes & Method Used
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bagged plastic containers, swept sidewalk, and disinfected with bleaching powder..."
                  value={cleaningNotes}
                  onChange={(e) => setCleaningNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !afterImage}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gemini AI Verifying Cleanliness...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit for AI Verification (+150 pts)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
