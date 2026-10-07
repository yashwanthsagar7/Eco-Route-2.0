import React, { useRef } from 'react';
import { AppreciationCertificate } from '../types';
import {
  X,
  Printer,
  Download,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface CertificateModalProps {
  certificate: AppreciationCertificate;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
}) => {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Printable / savable via browser print dialog or canvas export
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-auto flex flex-col overflow-hidden text-slate-800">
        {/* Modal Top Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Official Municipal Appreciation Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Content - Print Optimized Canvas */}
        <div className="p-4 sm:p-8 bg-slate-100 flex items-center justify-center overflow-x-auto">
          <div
            ref={certRef}
            className="w-full max-w-3xl bg-white p-6 sm:p-12 rounded-2xl shadow-xl border-8 border-double border-amber-600/60 relative overflow-hidden text-center font-sans print:shadow-none print:border-amber-700"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #ffffff 60%, #fffbeb 100%)',
            }}
          >
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-600/80" />
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-600/80" />
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-600/80" />
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-600/80" />

            {/* Municipal Crest / Seal Header */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <ShieldCheck className="w-9 h-9 text-emerald-700" />
                </div>
              </div>
              <div className="text-[11px] font-black uppercase tracking-widest text-amber-900/80">
                Greater Hyderabad Municipal Corporation &bull; Sanitation Mission
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider">
                CERTIFICATE ID: {certificate.certificateNumber}
              </div>
            </div>

            {/* Certificate Title */}
            <div className="mt-6 space-y-1">
              <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-amber-950 uppercase">
                Certificate of Appreciation
              </h2>
              <p className="text-xs sm:text-sm font-serif italic text-slate-600">
                For Exceptional Civic Hygiene Leadership & Urban Environmental Stewardship
              </p>
            </div>

            {/* Recipient */}
            <div className="my-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                This honor is proudly awarded to
              </p>
              <div className="text-2xl sm:text-4xl font-serif font-black text-emerald-800 tracking-wide mt-1.5 border-b-2 border-amber-400/60 pb-2 inline-block px-8">
                {certificate.recipientName}
              </div>
            </div>

            {/* Citation Body */}
            <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed font-serif">
              In formal recognition of voluntary environmental civic duty in tracking illegal waste dumping,
              verifying cleanups with authenticated before-and-after photographic evidence, and successfully
              completing the municipal mission:
            </p>

            <div className="mt-3 px-4 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 inline-block font-bold text-amber-950 text-xs sm:text-sm">
              &ldquo;{certificate.missionTitle}&rdquo;
            </div>

            {/* Impact Metric Chips */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mt-6 pt-4 border-t border-slate-200/80 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Green Points</div>
                <div className="text-lg font-black text-emerald-700">+{certificate.pointsEarned}</div>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Waste Cleared</div>
                <div className="text-lg font-black text-sky-700">~{certificate.wasteClearedKg} kg</div>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">CO2 Avoided</div>
                <div className="text-lg font-black text-emerald-700">~{certificate.co2SavedKg} kg</div>
              </div>
            </div>

            {/* Footer with Signatures & Official Gold Stamp */}
            <div className="mt-8 pt-6 border-t border-amber-300/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
              {/* Left Signature */}
              <div className="text-center sm:text-left">
                <div className="font-serif italic font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 w-44">
                  Dr. Rameshwar Rao
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1">{certificate.authorityName}</div>
                <div className="text-[9px] text-slate-500">{certificate.authorityTitle}</div>
              </div>

              {/* Center Official Gold Seal */}
              <div className="w-20 h-20 rounded-full border-4 border-amber-500 bg-amber-400/20 flex flex-col items-center justify-center text-center p-1 shadow-inner shrink-0 rotate-[-4deg]">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="text-[8px] font-black uppercase text-amber-900 tracking-tighter leading-none mt-0.5">
                  OFFICIAL SEAL
                </span>
                <span className="text-[7px] text-amber-800 font-bold leading-none mt-0.5">
                  HYDERABAD 2026
                </span>
              </div>

              {/* Right Date & Verification */}
              <div className="text-center sm:text-right">
                <div className="font-serif font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 w-44">
                  {certificate.dateAwarded}
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1">Date Awarded</div>
                <div className="text-[9px] text-emerald-700 font-mono font-semibold">
                  {certificate.verificationCode}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Authenticated and recorded in the Hyderabad Municipal Civic Registry.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download / Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
