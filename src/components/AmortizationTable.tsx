import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Calendar, Table as TableIcon } from 'lucide-react';
import { AmortizationScheduleItem, AnnualAmortizationItem, CurrencyCode } from '../types';
import { formatCurrency, exportToCSV } from '../utils/formatters';

interface AmortizationTableProps {
  schedule: AmortizationScheduleItem[];
  annualSchedule: AnnualAmortizationItem[];
  currency: CurrencyCode;
  title?: string;
  hasExtraPayments?: boolean;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  schedule,
  annualSchedule,
  currency,
  title = 'Amortization Schedule',
  hasExtraPayments = false,
}) => {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const currentData = viewMode === 'annual' ? annualSchedule : schedule;

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return currentData;
    const term = searchTerm.toLowerCase();

    if (viewMode === 'annual') {
      return (annualSchedule as AnnualAmortizationItem[]).filter(item => 
        `year ${item.year}`.toLowerCase().includes(term) || item.year.toString().includes(term)
      );
    } else {
      return (schedule as AmortizationScheduleItem[]).filter(item => 
        item.date.toLowerCase().includes(term) || 
        `month ${item.period}`.toLowerCase().includes(term) ||
        item.period.toString().includes(term)
      );
    }
  }, [currentData, searchTerm, viewMode, annualSchedule, schedule]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (viewMode === 'annual') {
      const exportData = annualSchedule.map(item => ({
        Year: item.year,
        'Principal Paid': item.principalPaid.toFixed(2),
        'Interest Paid': item.interestPaid.toFixed(2),
        'Extra Paid': item.extraPaid.toFixed(2),
        'Total Paid': item.totalPaid.toFixed(2),
        'Ending Balance': item.endBalance.toFixed(2),
      }));
      exportToCSV(exportData, `${title.replace(/\s+/g, '_')}_Annual_Schedule`);
    } else {
      const exportData = schedule.map(item => ({
        Period: item.period,
        Date: item.date,
        'Total Payment': item.payment.toFixed(2),
        'Principal': item.principal.toFixed(2),
        'Interest': item.interest.toFixed(2),
        'Extra Payment': item.extraPayment.toFixed(2),
        'Cumulative Interest': item.totalInterest.toFixed(2),
        'Remaining Balance': item.remainingBalance.toFixed(2),
      }));
      exportToCSV(exportData, `${title.replace(/\s+/g, '_')}_Monthly_Schedule`);
    }
  };

  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
        Enter loan parameters to view the amortization schedule.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <p className="text-xs text-slate-500">
              {viewMode === 'annual' ? `${annualSchedule.length} years total` : `${schedule.length} payments total`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              id="amortization-annual-view-btn"
              type="button"
              onClick={() => {
                setViewMode('annual');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'annual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Summary
            </button>
            <button
              id="amortization-monthly-view-btn"
              type="button"
              onClick={() => {
                setViewMode('monthly');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payment by Payment
            </button>
          </div>

          {/* Export CSV */}
          <button
            id="amortization-export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="amortization-schedule-search-input"
            type="text"
            placeholder={viewMode === 'annual' ? 'Filter by year (e.g. 5)...' : 'Filter by date or month (e.g. 24)...'}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing {paginatedData.length} of {filteredData.length} records
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4 font-bold uppercase tracking-wider">{viewMode === 'annual' ? 'Year' : 'Date / No.'}</th>
              {viewMode === 'monthly' && <th className="py-3 px-4 font-bold uppercase tracking-wider">Payment</th>}
              <th className="py-3 px-4 font-bold uppercase tracking-wider">Principal</th>
              <th className="py-3 px-4 font-bold uppercase tracking-wider">Interest</th>
              {hasExtraPayments && <th className="py-3 px-4 font-bold uppercase tracking-wider">Extra Principal</th>}
              {viewMode === 'annual' && <th className="py-3 px-4 font-bold uppercase tracking-wider">Total Paid</th>}
              {viewMode === 'monthly' && <th className="py-3 px-4 font-bold uppercase tracking-wider">Total Interest</th>}
              <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Ending Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No matching periods found for "{searchTerm}"
                </td>
              </tr>
            ) : viewMode === 'annual' ? (
              (paginatedData as AnnualAmortizationItem[]).map((row) => (
                <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Year {row.year}
                  </td>
                  <td className="py-3 px-4 text-indigo-600 font-bold">{formatCurrency(row.principalPaid, currency)}</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">{formatCurrency(row.interestPaid, currency)}</td>
                  {hasExtraPayments && (
                    <td className="py-3 px-4 text-indigo-600 font-semibold">
                      {row.extraPaid > 0 ? formatCurrency(row.extraPaid, currency) : '—'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-slate-800 font-semibold">{formatCurrency(row.totalPaid, currency)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(row.endBalance, currency)}
                  </td>
                </tr>
              ))
            ) : (
              (paginatedData as AmortizationScheduleItem[]).map((row) => (
                <tr key={row.period} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span>{row.date}</span>
                    <span className="text-slate-400 ml-1.5 text-[11px] font-normal">#{row.period}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{formatCurrency(row.payment, currency)}</td>
                  <td className="py-3 px-4 text-indigo-600 font-bold">{formatCurrency(row.principal, currency)}</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">{formatCurrency(row.interest, currency)}</td>
                  {hasExtraPayments && (
                    <td className="py-3 px-4 text-indigo-600 font-semibold">
                      {row.extraPayment > 0 ? formatCurrency(row.extraPayment, currency) : '—'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-slate-500">{formatCurrency(row.totalInterest, currency)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(row.remainingBalance, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="amortization-prev-page-btn"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="amortization-next-page-btn"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
