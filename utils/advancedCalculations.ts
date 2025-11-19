import { MarketData, AnalysisData } from '../types';

export const calculateAdvancedAnalysis = (data: MarketData[]): AnalysisData | null => {
  if (data.length < 2) return null;

  const today = data[0];
  const yesterday = data[1];

  let operationDate = new Date(today.Data);
  operationDate.setDate(operationDate.getDate() + 1);

  if (operationDate.getDay() === 6) {
    operationDate.setDate(operationDate.getDate() + 2);
  } else if (operationDate.getDay() === 0) {
    operationDate.setDate(operationDate.getDate() + 1);
  }

  const lookbackPeriod = Math.min(150, data.length);
  const recentData = data.slice(0, lookbackPeriod);

  // ===================== RESISTÊNCIAS HISTÓRICAS =====================
  const allMaximas = recentData.map(d => d.Maxima).filter(v => v > 0);
  const uniqueMaximas = [...new Set(allMaximas)].sort((a, b) => b - a);

  let historicalResistances: number[] = [];
  for (const m of uniqueMaximas) {
    if (m >= today.Fechamento * 0.99) {
      historicalResistances.push(m);
      if (historicalResistances.length === 6) break;
    }
  }
  while (historicalResistances.length < 6) {
    historicalResistances.push(historicalResistances[historicalResistances.length - 1] || today.Maxima);
  }
  historicalResistances = historicalResistances.slice(0, 6).sort((a, b) => a - b);

  // ===================== SUPORTES HISTÓRICOS =====================
  const allMinimas = recentData.map(d => d.Minima).filter(v => v > 0);
  const uniqueMinimas = [...new Set(allMinimas)].sort((a, b) => a - b);

  let historicalSupports: number[] = [];
  for (const m of uniqueMinimas) {
    if (m <= today.Fechamento * 1.01) {
      historicalSupports.push(m);
      if (historicalSupports.length === 6) break;
    }
  }
  while (historicalSupports.length < 6) {
    historicalSupports.push(historicalSupports[historicalSupports.length - 1] || today.Minima);
  }
  historicalSupports = historicalSupports.slice(0, 6).sort((a, b) => b - a);

  // ===================== PONTOS DE PIVÔ - FORMULA PADRÃO =====================
  const P = (today.Maxima + today.Minima + today.Fechamento) / 3;
  const R1 = 2 * P - today.Minima;
  const S1 = 2 * P - today.Maxima;
  const R2 = P + (today.Maxima - today.Minima);
  const S2 = P - (today.Maxima - today.Minima);
  const R3 = today.Maxima + 2 * (P - today.Minima);
  const S3 = today.Minima - 2 * (today.Maxima - P);
  const R4 = today.Maxima + 3 * (P - today.Minima);
  const S4 = today.Minima - 3 * (today.Maxima - P);

  // ===================== FIBONACCI - 20 CANDLES =====================
  let fibonacci = null;
  if (data.length >= 20) {
    const swingData = data.slice(0, 20);
    const recent_high = Math.max(...swingData.map(d => d.Maxima));
    const recent_low = Math.min(...swingData.map(d => d.Minima));
    const diff_swing = recent_high - recent_low;

    if (diff_swing > 0) {
      const isUptrend = today.Fechamento > yesterday.Fechamento;
      const basePrice = isUptrend ? recent_low : recent_high;

      fibonacci = {
        retracements: [
          { level: '0%', value: recent_high },
          { level: '23.6%', value: recent_high - diff_swing * 0.236 },
          { level: '38.2%', value: recent_high - diff_swing * 0.382 },
          { level: '50%', value: recent_high - diff_swing * 0.5 },
          { level: '61.8%', value: recent_high - diff_swing * 0.618 },
          { level: '78.6%', value: recent_high - diff_swing * 0.786 },
          { level: '100%', value: recent_low },
        ],
        extensions: [
          { level: '127.2%', value: basePrice + diff_swing * 1.272 * (isUptrend ? 1 : -1) },
          { level: '161.8%', value: basePrice + diff_swing * 1.618 * (isUptrend ? 1 : -1) },
          { level: '200%', value: basePrice + diff_swing * 2 * (isUptrend ? 1 : -1) },
          { level: '261.8%', value: basePrice + diff_swing * 2.618 * (isUptrend ? 1 : -1) },
        ],
      };
    }
  }

  // ===================== CURVA DE GAUSS - MÉDIA MÓVEL 20 =====================
  const gaussPeriod = Math.min(20, data.length);
  const relevantCloses = data.slice(0, gaussPeriod).map(d => d.Fechamento);
  const media = relevantCloses.reduce((a, b) => a + b, 0) / relevantCloses.length;
  const variance = relevantCloses.map(x => Math.pow(x - media, 2)).reduce((a, b) => a + b, 0) / relevantCloses.length;
  const stdDev = Math.sqrt(variance);

  const gaussLevels = [
    { level: '+3σ', value: media + 3 * stdDev },
    { level: '+2σ', value: media + 2 * stdDev },
    { level: '+1σ', value: media + stdDev },
    { level: 'μ', value: media },
    { level: '-1σ', value: media - stdDev },
    { level: '-2σ', value: media - 2 * stdDev },
    { level: '-3σ', value: media - 3 * stdDev },
  ];

  // ===================== MÉDIA MÓVEL 50 PERÍODOS =====================
  let longTermMA = null;
  if (data.length >= 50) {
    longTermMA = data.slice(0, 50).map(d => d.Fechamento).reduce((a, b) => a + b, 0) / 50;
  }

  // ===================== ATR - 14 PERÍODOS =====================
  let atr = null;
  const atrPeriod = 14;
  if (data.length >= atrPeriod + 1) {
    const sortedForAtr = [...data].sort((a, b) => a.Data.getTime() - b.Data.getTime()).slice(-(atrPeriod + 1));
    const trueRanges: number[] = [];

    for (let i = 1; i < sortedForAtr.length; i++) {
      const high = sortedForAtr[i].Maxima;
      const low = sortedForAtr[i].Minima;
      const prevClose = sortedForAtr[i - 1].Fechamento;
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    const atrValue = trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
    atr = {
      value: atrValue,
      buyStop: today.Fechamento - 1.5 * atrValue,
      sellStop: today.Fechamento + 1.5 * atrValue,
    };
  }

  // ===================== ZONAS OPERACIONAIS =====================
  const range = today.Maxima - today.Minima;
  const midRange = today.Minima + range / 2;

  const buyTrapLevel = today.Maxima - range * 0.15;
  const sellTrapLevel = today.Minima + range * 0.15;

  return {
    operationDate: operationDate.toLocaleDateString('pt-BR'),
    previousDay: {
      Fechamento: today.Fechamento,
      Abertura: today.Abertura,
      Maxima: today.Maxima,
      Minima: today.Minima,
      Range: range,
      Variation: ((today.Fechamento - yesterday.Fechamento) / yesterday.Fechamento) * 100,
    },
    historicalSR: {
      resistances: historicalResistances.map((v, i) => ({ level: `R${i + 1}`, value: v })),
      supports: historicalSupports.map((v, i) => ({ level: `S${i + 1}`, value: v })),
    },
    pivotPoints: {
      p: P,
      resistances: [
        { level: 'R1', value: R1 },
        { level: 'R2', value: R2 },
        { level: 'R3', value: R3 },
        { level: 'R4', value: R4 },
      ].sort((a, b) => a.value - b.value),
      supports: [
        { level: 'S1', value: S1 },
        { level: 'S2', value: S2 },
        { level: 'S3', value: S3 },
        { level: 'S4', value: S4 },
      ].sort((a, b) => a.value - b.value),
    },
    fibonacci,
    gaussLevels: {
      equilibrium: media,
      stdDev,
      levels: gaussLevels,
    },
    longTermMA,
    atr,
    trapZones: {
      buyTrap: { start: buyTrapLevel, end: today.Maxima },
      sellTrap: { start: today.Minima, end: sellTrapLevel },
      sellerDefense: { start: media + 2 * stdDev, end: media + 3 * stdDev },
    },
    accumulationZones: {
      primary: { start: Math.max(media - 2 * stdDev, historicalSupports[0] * 0.995), end: media - stdDev },
      secondary: historicalSupports.length > 3 ? { start: historicalSupports[3], end: historicalSupports[2] } : null,
    },
  };
};
