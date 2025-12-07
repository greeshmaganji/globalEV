import React from 'react';
import { CountryData } from '../types';

interface DataTableProps {
  data: CountryData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  return (
    <div className="w-full bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Detailed Country Metrics</h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3 text-right">Stations</th>
              <th className="px-6 py-3 text-right">Readiness (EIRI)</th>
              <th className="px-6 py-3 text-right">Model Availability</th>
              <th className="px-6 py-3 text-right">Gap</th>
              <th className="px-6 py-3 text-right">Median Power (kW)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
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