import React from 'react';
import { X, Trash2, ArrowRight, BookmarkCheck, BarChart3, Clock, Calendar } from 'lucide-react';
import { SavedScenario, CurrencyCode } from '../types';

interface SavedCalculationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedScenarios: SavedScenario[];
  onDeleteScenario: (id: string) => void;
  onLoadScenario: (scenario: SavedScenario) => void;
  onOpenCompare: () => void;
}

export const SavedCalculationsDrawer: React.FC<SavedCalculationsDrawerProps> = ({
  isOpen,
  onClose,
  savedScenarios,
  onDeleteScenario,
  onLoadScenario,
  onOpenCompare,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Saved Scenarios</h3>
                <p className="text-xs text-slate-500">{savedScenarios.length} calculations stored locally</p>
              </div>
            </div>
            <button
              id="saved-drawer-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {savedScenarios.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <BookmarkCheck className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-600">No saved calculations yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click "Save Scenario" inside any calculator to preserve parameters and compare options side by side.
                </p>
              </div>
            ) : (
              <>
                {savedScenarios.length >= 2 && (
                  <button
                    id="saved-drawer-compare-btn"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCompare();
                    }}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span>Compare All Scenarios Side-by-Side</span>
                  </button>
                )}

                <div className="space-y-3">
                  {savedScenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                            {scenario.type}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1.5">{scenario.name}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(scenario.dateCreated).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <button
                          id={`saved-delete-${scenario.id}`}
                          type="button"
                          onClick={() => onDeleteScenario(scenario.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">{scenario.summary.label1}</span>
                          <span className="font-semibold text-slate-800">{scenario.summary.value1}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{scenario.summary.label2}</span>
                          <span className="font-semibold text-slate-800">{scenario.summary.value2}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{scenario.summary.label3}</span>
                          <span className="font-semibold text-indigo-600">{scenario.summary.value3}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
