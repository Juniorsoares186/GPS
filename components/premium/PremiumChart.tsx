import React, { useMemo } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { MarketData, AnalysisData, ChartDataPoint } from '../../types';

interface Props {
  marketData: MarketData[];
  analysis: AnalysisData;
}

const PremiumChart: React.FC<Props> = ({ marketData, analysis }) => {
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!marketData || marketData.length === 0) return [];
    return marketData.slice().reverse().slice(-30).map((d) => ({
      date: new Date(d.Data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      open: d.Abertura,
      high: d.Maxima,
      low: d.Minima,
      close: d.Fechamento,
    }));
  }, [marketData]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover animate-fadeInUp">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Gráfico de Preços</h3>
        <p className="text-sm text-slate-400">Últimos 30 pregões</p>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} orientation="right" />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />

          <Bar dataKey={(d: ChartDataPoint) => [d.low, d.high]} barSize={2} fill="#64748b" legendType="none" />
          <Bar dataKey={(d: ChartDataPoint) => [d.open, d.close]} barSize={12} legendType="none">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>

          <ReferenceLine y={analysis.pivotPoints.p} stroke="#eab308" strokeDasharray="5 5" label={{ value: 'Pivô', fill: '#eab308', fontSize: 11 }} />
          {analysis.pivotPoints.resistances.slice(0, 2).map((r) => (
            <ReferenceLine key={r.level} y={r.value} stroke="#f87171" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: r.level, fill: '#f87171', fontSize: 10 }} />
          ))}
          {analysis.pivotPoints.supports.slice(0, 2).map((s) => (
            <ReferenceLine key={s.level} y={s.value} stroke="#4ade80" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: s.level, fill: '#4ade80', fontSize: 10 }} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PremiumChart;
