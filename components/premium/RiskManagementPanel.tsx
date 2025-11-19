import React, { useState, useMemo } from 'react';

const RiskManagementPanel = () => {
  const [capital, setCapital] = useState('15000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [stopPoints, setStopPoints] = useState('100');
  const [targetMultiplier, setTargetMultiplier] = useState('2.5');

  const results = useMemo(() => {
    const K = parseFloat(capital) || 0;
    const R = parseFloat(riskPercent) / 100 || 0;
    const S_pts = parseFloat(stopPoints) || 0;
    const T_mult = parseFloat(targetMultiplier) || 0;
    const cost_per_point = 0.2;

    if (K <= 0 || R <= 0 || S_pts <= 0) {
      return { contracts: 0, riskValue: 0, gainValue: 0, ratio: 0, alert: null };
    }

    const max_risk_value = K * R;
    const stop_value_per_contract = S_pts * cost_per_point;
    let contracts = Math.floor(max_risk_value / stop_value_per_contract);
    let alert = null;

    if (contracts < 1) {
      if (K >= stop_value_per_contract) {
        contracts = 1;
        const realRiskPercent = (stop_value_per_contract / K) * 100;
        alert = `Risco real: ${realRiskPercent.toFixed(2)}%`;
      } else {
        contracts = 0;
        alert = 'Capital insuficiente';
      }
    }

    const finalRiskValue = contracts * stop_value_per_contract;
    const finalGainValue = finalRiskValue * T_mult;
    const ratio = T_mult > 0 ? (finalGainValue / finalRiskValue).toFixed(2) : '0';

    return { contracts, riskValue: finalRiskValue, gainValue: finalGainValue, ratio: parseFloat(ratio), alert };
  }, [capital, riskPercent, stopPoints, targetMultiplier]);

  const inputClass = 'w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono';

  return (
    <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
          <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Gestão de Risco</h3>
          <p className="text-sm text-slate-400">Calculadora profissional</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Capital (R$)</label>
          <input type="text" value={capital} onChange={(e) => setCapital(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Risco (%)</label>
          <input type="text" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Stop (pts)</label>
          <input type="text" value={stopPoints} onChange={(e) => setStopPoints(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Alvo (x)</label>
          <input type="text" value={targetMultiplier} onChange={(e) => setTargetMultiplier(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-400 uppercase tracking-wide font-semibold mb-1">Contratos</p>
          <p className="text-3xl font-bold text-white font-mono">{results.contracts}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-1">Risco</p>
          <p className="text-2xl font-bold text-white font-mono">R$ {results.riskValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-green-400 uppercase tracking-wide font-semibold mb-1">Ganho Pot.</p>
          <p className="text-2xl font-bold text-white font-mono">R$ {results.gainValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-purple-400 uppercase tracking-wide font-semibold mb-1">Razão R:R</p>
          <p className="text-3xl font-bold text-white font-mono">1:{results.ratio}</p>
        </div>
      </div>

      {results.alert && <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"><p className="text-sm text-yellow-300 text-center font-medium">{results.alert}</p></div>}
    </div>
  );
};

export default RiskManagementPanel;
