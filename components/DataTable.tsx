import React, { useState, useMemo } from 'react';
import { CountryData } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableProps {
  data: CountryData[];
}

type SortKey = keyof CountryData | 'country_name';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'EIRI', direction: 'desc' });

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      // Handle potential missing names with fallback
      const aValue = a[sortConfig.key as keyof CountryData] ?? '';
      const bValue = b[sortConfig.key as keyof CountryData] ?? '';

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
     if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-400 opacity-50" />;
     return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-blue-600" /> : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  const HeaderCell = ({ label, sortKey, align = 'right' }: { label: string, sortKey: SortKey, align?: string }) => (
      <th 
        className={`px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group text-${align}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            <SortIcon columnKey={sortKey} />
        </div>
      </th>
  );

  return (
    <div className="w-full bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Detailed Country Metrics</h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
            <tr>
              <HeaderCell label="Code" sortKey="country_name" align="left" />
              <HeaderCell label="Stations" sortKey="stations" />
              <HeaderCell label="Readiness (EIRI)" sortKey="EIRI" />
              <HeaderCell label="Model Availability" sortKey="availability_norm" />
              <HeaderCell label="Gap" sortKey="gap_value" />
              <HeaderCell label="Median Power (kW)" sortKey="median_power_kw" />
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={row.country_code} className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                <td className="px-6 py-4 font-medium text-slate-900">{row.country_name || row.country_code}</td>
                <td className="px-6 py-4 text-right">{row.stations.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.EIRI > 60 ? 'bg-green-100 text-green-700' : row.EIRI > 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {row.EIRI.toFixed(1)}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">{row.availability_norm.toFixed(1)}</td>
                <td className="px-6 py-4 text-right font-mono">
                    <span className={row.gap_value > 0 ? 'text-blue-600' : 'text-orange-600'}>
                        {row.gap_value > 0 ? '+' : ''}{row.gap_value.toFixed(1)}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">{row.median_power_kw}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;