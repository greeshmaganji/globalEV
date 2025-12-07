import React, { useMemo, useState } from 'react';
import { getEVData } from './services/dataService';
import { CountryData, MetricType } from './types';
import WorldMap from './components/WorldMap';
import { TopReadinessChart, GapAnalysisChart } from './components/Charts';
import DataTable from './components/DataTable';
import { LayoutDashboard, Zap, Map as MapIcon, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  const [data] = useState<CountryData[]>(getEVData());
  const [metric, setMetric] = useState<MetricType>('EIRI');

  // Derived Stats
  const stats = useMemo(() => {
    const totalStations = data.reduce((acc, curr) => acc + curr.stations, 0);
    const avgEIRI = data.reduce((acc, curr) => acc + curr.EIRI, 0) / data.length;
    const topReady = [...data].sort((a, b) => b.EIRI - a.EIRI)[0];
    const topGap = [...data].sort((a, b) => b.gap_value - a.gap_value)[0]; // Highest demand vs infra gap
    
    return {
        totalStations,
        avgEIRI,
        topReady,
        topGap
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Zap size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
              EV Readiness Index 2025
            </h1>
          </div>
          <nav className="hidden md:flex gap-4">
             <button onClick={() => setMetric('EIRI')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${metric === 'EIRI' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>Readiness</button>
             <button onClick={() => setMetric('stations')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${metric === 'stations' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>Volume</button>
             <button onClick={() => setMetric('gap_value')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${metric === 'gap_value' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>Gap Analysis</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><MapIcon size={18} /></div>
                    <span className="text-sm font-medium text-slate-500">Total Stations</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalStations.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-1">Global tracked public chargers</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600"><BarChart3 size={18} /></div>
                    <span className="text-sm font-medium text-slate-500">Avg. Readiness (EIRI)</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.avgEIRI.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 100</span></div>
                <div className="text-xs text-slate-400 mt-1">Global average score</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Zap size={18} /></div>
                    <span className="text-sm font-medium text-slate-500">Leader</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.topReady?.country_code}</div>
                <div className="text-xs text-slate-400 mt-1">EIRI Score: {stats.topReady?.EIRI.toFixed(1)}</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><LayoutDashboard size={18} /></div>
                    <span className="text-sm font-medium text-slate-500">Highest Gap</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.topGap?.country_code}</div>
                <div className="text-xs text-slate-400 mt-1">Demand outpaces infra by {stats.topGap?.gap_value.toFixed(1)}</div>
            </div>
        </div>

        {/* Map Section */}
        <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Global Infrastructure Map</h2>
            <WorldMap data={data} selectedMetric={metric} />
        </section>

        {/* Analytics Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopReadinessChart data={data} />
            <GapAnalysisChart data={data} />
        </section>

        {/* Data Table */}
        <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Country Data Breakdown</h2>
            <DataTable data={data} />
        </section>

      </main>
    </div>
  );
};

export default App;
