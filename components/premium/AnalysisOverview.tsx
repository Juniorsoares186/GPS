import React from 'react';
import { AnalysisData } from '../../types';

interface Props {
  analysis: AnalysisData;
}

const AnalysisOverview: React.FC<Props> = ({ analysis }) => {
  const isPositive = analysis.previousDay.Variation >= 0;

  return (
    <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover animate-fadeInUp">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide font-semibold">Fechamento</p>
          <p className="text-4xl font-bold text-white font-mono">{analysis.previousDay.Fechamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className={`text-sm font-semibold mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{analysis.previousDay.Variation.toFixed(2)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide font-semibold">Abertura</p>
          <p className="text-3xl font-bold text-white font-mono">{analysis.previousDay.Abertura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-orange-600/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide font-semibold">Máxima</p>
          <p className="text-3xl font-bold text-white font-mono">{analysis.previousDay.Maxima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-lime-600/10 border border-green-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide font-semibold">Mínima</p>
          <p className="text-3xl font-bold text-white font-mono">{analysis.previousDay.Minima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide font-semibold">Range</p>
          <p className="text-3xl font-bold text-white font-mono">{analysis.previousDay.Range.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700/30">
        <p className="text-center text-sm text-slate-400">
          Próximo Pregão: <span className="font-semibold text-emerald-400">{analysis.operationDate}</span>
        </p>
      </div>
    </div>
  );
};

export default AnalysisOverview;
