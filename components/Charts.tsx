import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  Cell
} from 'recharts';
import { CountryData } from '../types';

interface ChartProps {
  data: CountryData[];
}

export const TopReadinessChart: React.FC<ChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.EIRI - a.EIRI).slice(0, 10);

  return (
    <div className="w-full h-[550px] bg-white p-6 rounded-xl shadow border border-slate-200 flex flex-col">
      <h3 className="text-base font-bold text-slate-700 mb-6">Top 10 Countries by Readiness (EIRI)</h3>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="country_code" type="category" width={40} tick={{ fontSize: 13, fontWeight: 500 }} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="EIRI" radius={[0, 4, 4, 0]} barSize={24}>
               {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.EIRI > 60 ? '#22c55e' : entry.EIRI > 40 ? '#eab308' : '#ef4444'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const GapAnalysisChart: React.FC<ChartProps> = ({ data }) => {
    const [filter, setFilter] = useState<'all' | 'demand' | 'balanced' | 'infra'>('all');

    const filteredData = useMemo(() => {
        // Lower threshold to 50 to allow more countries but filter noise
        const baseData = data.filter(d => d.stations > 50);

        switch (filter) {
            case 'demand':
                return baseData.filter(d => d.gap_value > 5);
            case 'balanced':
                return baseData.filter(d => d.gap_value >= -5 && d.gap_value <= 5);
            case 'infra':
                return baseData.filter(d => d.gap_value < -5);
            default:
                return baseData;
        }
    }, [data, filter]);

    return (
      <div className="w-full h-[550px] bg-white p-6 rounded-xl shadow border border-slate-200 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h3 className="text-base font-bold text-slate-700">Gap Analysis</h3>
            
            <div className="flex flex-wrap gap-2 text-xs">
                <button 
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-full border transition-all ${filter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setFilter('demand')}
                    className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-all ${filter === 'demand' ? 'bg-blue-100 text-blue-700 border-blue-200 font-semibold' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    <span className={`w-2 h-2 rounded-full bg-blue-500 ${filter !== 'demand' ? 'opacity-70' : ''}`}></span>
                    Demand Ahead
                </button>
                <button 
                    onClick={() => setFilter('balanced')}
                    className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-all ${filter === 'balanced' ? 'bg-slate-100 text-slate-700 border-slate-300 font-semibold' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    <span className={`w-2 h-2 rounded-full bg-slate-400 ${filter !== 'balanced' ? 'opacity-70' : ''}`}></span>
                    Balanced
                </button>
                <button 
                    onClick={() => setFilter('infra')}
                    className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-all ${filter === 'infra' ? 'bg-orange-100 text-orange-700 border-orange-200 font-semibold' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    <span className={`w-2 h-2 rounded-full bg-orange-500 ${filter !== 'infra' ? 'opacity-70' : ''}`}></span>
                    Infra Ahead
                </button>
            </div>
        </div>

        <div className="flex-grow min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="EIRI" 
                name="Readiness Index" 
                unit="" 
                label={{ value: 'Infrastructure Readiness (EIRI)', position: 'bottom', offset: 0, dy: 10, fontSize: 12, fill: '#64748b' }} 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickMargin={10}
              />
              <YAxis 
                type="number" 
                dataKey="availability_norm" 
                name="Model Availability" 
                unit="" 
                label={{ value: 'Model Availability', angle: -90, position: 'insideLeft', dx: -10, fontSize: 12, fill: '#64748b' }} 
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <ZAxis dataKey="stations" range={[20, 500]} name="Stations" />
              <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs z-50">
                            <p className="font-bold text-slate-800 text-sm mb-1">{data.country_name || data.country_code}</p>
                            <div className="space-y-1">
                                <p className="text-slate-500">Readiness: <span className="font-mono text-slate-800">{data.EIRI.toFixed(1)}</span></p>
                                <p className="text-slate-500">Models: <span className="font-mono text-slate-800">{data.availability_norm.toFixed(1)}</span></p>
                                <p className="text-slate-500">Gap: <span className={`font-mono ${data.gap_value > 0 ? 'text-blue-600' : 'text-orange-600'}`}>{data.gap_value.toFixed(1)}</span></p>
                                <p className="text-slate-500">Stations: <span className="font-mono text-slate-800">{data.stations.toLocaleString()}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
              />
              <Scatter name="Market Position" data={filteredData} fill="#8884d8" shape="circle">
                  {filteredData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.gap_value > 5 ? '#3b82f6' : entry.gap_value < -5 ? '#f97316' : '#94a3b8'} 
                        fillOpacity={0.7} 
                        stroke="#fff" 
                        strokeWidth={1} 
                      />
                  ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center">
             <p className="text-[10px] text-slate-400">
                * Bubble size represents total station count. Filter categories based on Gap Value (+/- 5).
             </p>
        </div>
      </div>
    );
};