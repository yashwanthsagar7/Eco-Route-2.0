import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BrainCircuit,
  Send,
  Sparkles,
  FileText,
  Download,
  Printer,
  X,
  Bot,
  User,
} from 'lucide-react';

export const PlannerView: React.FC = () => {
  const {
    smartBins,
    kpiStats,
    routesResult,
    chatMessages,
    addChatMessage,
    addToast,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportModalContent, setReportModalContent] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    addChatMessage({
      role: 'user',
      content: text,
    });
    setInputMessage('');
    setIsSending(true);

    try {
      const criticalBinsList = smartBins.filter((b) => b.fillLevel >= 80);
      const hotspotsList = Array.from(new Set(criticalBinsList.map((b) => b.area))).slice(0, 5);

      const res = await fetch('/api/gemini/sanitation-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          binContext: {
            totalBins: smartBins.length,
            criticalBins: criticalBinsList.length,
            avgFill: kpiStats.avgFill,
            hotspots: hotspotsList,
            suggestedTruckCount: routesResult.trucks.length,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to get AI recommendation');

      const data = await res.json();
      addChatMessage({
        role: 'assistant',
        content: data.reply || 'No response generated.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error talking to Sanitation Planner';
      addChatMessage({
        role: 'assistant',
        content: `Error: ${msg}. Please ensure your network is connected and try again.`,
      });
      addToast('AI Planner Error', msg, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateDailyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const criticalBins = smartBins.filter((b) => b.fillLevel >= 80);
      const res = await fetch('/api/gemini/daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: 'Hyderabad',
          totalBins: smartBins.length,
          criticalCount: criticalBins.length,
          avgFill: kpiStats.avgFill,
          hotspots: Array.from(new Set(criticalBins.map((b) => b.area))),
          trucksActive: routesResult.trucks.length,
          fuelSaved: kpiStats.fuelSaved,
          co2Saved: kpiStats.co2Saved,
        }),
      });

      if (!res.ok) throw new Error('Report generation failed');

      const data = await res.json();
      setReportModalContent(data.markdownReport || 'No report generated.');
      addToast('Daily Report Ready', 'Generated municipal operations executive summary.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not generate report';
      addToast('Report Error', msg, 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportModalContent) return;
    const blob = new Blob([reportModalContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hyderabad_Sanitation_Plan_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Downloaded', 'Saved sanitation report to device.', 'info');
  };

  const suggestedQuestions = [
    'Which municipal wards urgently need additional containers?',
    'Propose an optimized compactor schedule for tomorrow morning.',
    'Predict which commercial zones will overflow by evening rush hour.',
  ];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>AI Sanitation Intelligence & Planning</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Gemini Flash AI
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time advisory agent grounded with Hyderabad IoT telemetry. Ask for capacity predictions, ward rebalancing, and shift schedules.
          </p>
        </div>

        {/* Generate Report Button in Plain Solid Emerald Green */}
        <button
          onClick={handleGenerateDailyReport}
          disabled={isGeneratingReport}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors active:scale-95 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isGeneratingReport ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>Generate Daily Operations Report</span>
            </>
          )}
        </button>
      </div>

      {/* Main Intelligence Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Conversation Column */}
        <div className="lg:col-span-8 flex flex-col h-[600px] rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">
                  Hyderabad Sanitation Assistant
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced with 40 live ultrasonic IoT sensors
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {smartBins.filter((b) => b.fillLevel >= 80).length} Critical Overflow Bins
              </span>
            </div>
          </div>

          {/* Message History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
            {chatMessages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs shadow-xs ${
                      isUser
                        ? 'bg-sky-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-sky-600 text-white font-medium'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Synthesizing city telemetry recommendation...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Question Chips in Plain Solid Tints */}
          <div className="p-2.5 px-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick:</span>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 text-sky-800 text-[11px] font-semibold transition-colors truncate max-w-xs shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about ward hotspots, collection schedules, or container reallocation..."
              value={inputMessage}
              disabled={isSending}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:bg-white"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>

        {/* Right Info Column: City Telemetry Briefing */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Real-time Context Fed to Gemini</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The AI assistant receives live snapshots of the 40 smart containers, current sensor fill levels, and active fleet positions to generate accurate, localized insights.
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Critical Bins (&ge;80%):</span>
                <span className="font-bold text-rose-600">{kpiStats.criticalBins} containers</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Average City Fill:</span>
                <span className="font-bold text-slate-900">{kpiStats.avgFill}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Active Fleet Compactor:</span>
                <span className="font-bold text-sky-700">{routesResult.trucks.length} Trucks</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-800 font-medium">Carbon Avoidance:</span>
                <span className="font-bold text-emerald-700">{kpiStats.co2Saved} kg</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-md space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-900">Recommended Executive Queries</h4>
            <div className="space-y-1.5 text-slate-600">
              <p>&bull; <em>"What is the optimal routing sequence to clear Charminar and Begumpet before 8 AM?"</em></p>
              <p>&bull; <em>"Estimate fuel savings if we rebalance 5 bins to HITEC City IT Corridor."</em></p>
              <p>&bull; <em>"Provide an emergency overflow contingency plan for heavy rains."</em></p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Operations Report Modal */}
      {reportModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Municipal Daily Sanitation Plan
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Hyderabad Municipal Corporation • {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs transition-colors"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setReportModalContent(null)}
                  className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs transition-colors"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto font-mono text-xs sm:text-sm text-slate-800 space-y-4 whitespace-pre-wrap leading-relaxed select-text bg-white">
              {reportModalContent}
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Generated autonomously by EcoRoute AI Sanitation Planner</span>
              <button
                onClick={() => setReportModalContent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
