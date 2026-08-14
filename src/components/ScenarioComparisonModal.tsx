import React from 'react';
import { X, BarChart3, ArrowLeft, BookmarkCheck } from 'lucide-react';
import { SavedScenario, CurrencyCode } from '../types';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: SavedScenario[];
  currency: CurrencyCode;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  scenarios,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Scenario Comparison Matrix</h3>
              <p className="text-xs text-slate-500">Side-by-side analysis of saved financial configurations</p>
            </div>
          </div>
          <button
            id="scenario-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {scenarios.length < 2 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-medium text-slate-600">Need at least 2 saved scenarios to compare.</p>
              <p className="text-xs text-slate-400">Save multiple loan, mortgage, or investment options to evaluate them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((s, idx) => (
                <div
                  key={s.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                        Option #{idx + 1} • {s.type}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">{s.summary.label1}</span>
                      <span className="font-bold text-slate-900">{s.summary.value1}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">{s.summary.label2}</span>
                      <span className="font-bold text-indigo-600">{s.summary.value2}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">{s.summary.label3}</span>
                      <span className="font-bold text-slate-900">{s.summary.value3}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            id="scenario-modal-done-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
