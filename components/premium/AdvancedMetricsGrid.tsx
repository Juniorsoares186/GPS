import React from 'react';
import { AnalysisData } from '../../types';

interface Props {
  analysis: AnalysisData;
}

const MetricCard: React.FC<{ title: string; value: string; label?: string; color: string }> = ({ title, value, label, color }) => (
  <div className={`glass-effect rounded-xl p-4 border ${color}`}>
    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{title}</p>
    <p className="text-2xl font-bold text-white font-mono">{value}</p>
    {label && <p className="text-xs text-slate-500 mt-1">{label}</p>}
  </div>
);

const AdvancedMetricsGrid: React.FC<Props> = ({ analysis }) => {
  const fmt = (v: number | null | undefined) => {
    if (v === null || v === undefined || isNaN(v)) return 'N/A';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pivô" value={fmt(analysis.pivotPoints.p)} color="border-yellow-500/20" />
        <MetricCard title="R1" value={fmt(analysis.pivotPoints.resistances[0]?.value)} color="border-red-500/20" />
        <MetricCard title="S1" value={fmt(analysis.pivotPoints.supports[0]?.value)} color="border-green-500/20" />
        <MetricCard title="ATR" value={fmt(analysis.atr?.value)} color="border-orange-500/20" />
      </div>

      <div className="glass-effect rounded-2xl p-6 card-hover">
        <h3 className="text-lg font-bold text-white mb-4">Estrutura de Preços</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-3 font-semibold uppercase">Resistências</p>
            {analysis.pivotPoints.resistances.map((r) => (
              <div key={r.level} className="flex justify-between py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-300">{r.level}</span>
                <span className="font-mono text-red-400 font-semibold">{fmt(r.value)}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-3 font-semibold uppercase">Suportes</p>
            {analysis.pivotPoints.supports.map((s) => (
              <div key={s.level} className="flex justify-between py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-300">{s.level}</span>
                <span className="font-mono text-green-400 font-semibold">{fmt(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analysis.fibonacci && (
        <div className="glass-effect rounded-2xl p-6 card-hover">
          <h3 className="text-lg font-bold text-white mb-4">Fibonacci</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-3 font-semibold uppercase">Retrações</p>
              {analysis.fibonacci.retracements.slice(1, 5).map((f) => (
                <div key={f.level} className="flex justify-between py-2 border-b border-slate-700/30">
                  <span className="text-sm text-slate-300">{f.level}</span>
                  <span className="font-mono text-purple-400 font-semibold">{fmt(f.value)}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-3 font-semibold uppercase">Extensões</p>
              {analysis.fibonacci.extensions.slice(0, 3).map((f) => (
                <div key={f.level} className="flex justify-between py-2 border-b border-slate-700/30">
                  <span className="text-sm text-slate-300">{f.level}</span>
                  <span className="font-mono text-purple-400 font-semibold">{fmt(f.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="glass-effect rounded-2xl p-6 card-hover">
        <h3 className="text-lg font-bold text-white mb-4">Curva de Gauss</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/30 text-center">
            <p className="text-xs text-slate-500 mb-1">Equilíbrio (μ)</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">{fmt(analysis.gaussLevels.equilibrium)}</p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/30 text-center">
            <p className="text-xs text-slate-500 mb-1">Desvio Padrão (σ)</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">{fmt(analysis.gaussLevels.stdDev)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMetricsGrid;
