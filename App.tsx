import React, { useState, useMemo, useCallback, FC, ReactNode } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    ReferenceArea,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
    Legend,
} from 'recharts';


// --- TYPES ---
type MarketData = {
  Data: Date;
  Abertura: number;
  Maxima: number;
  Minima: number;
  Fechamento: number;
};

type AnalysisData = {
  operationDate: string;
  previousDay: {
    Fechamento: number;
    Abertura: number;
    Maxima: number;
    Minima: number;
    Range: number;
    Variation: number;
  };
  historicalSR: {
    resistances: { level: string; value: number }[];
    supports: { level: string; value: number }[];
  };
  pivotPoints: {
    p: number;
    resistances: { level: string; value: number }[];
    supports: { level: string; value: number }[];
  };
  fibonacci: {
    retracements: { level: string; value: number }[];
    extensions: { level: string; value: number }[];
  } | null;
  gaussLevels: {
    equilibrium: number;
    stdDev: number;
    levels: { level: string; value: number }[];
  };
  longTermMA: number | null;
  atr: {
    value: number;
    buyStop: number;
    sellStop: number;
  } | null;
  trapZones: {
    buyTrap: { start: number; end: number };
    sellTrap: { start: number; end: number };
    sellerDefense: { start: number; end: number };
  };
  accumulationZones: {
    primary: { start: number; end: number };
    secondary: { start: number; end: number } | null;
  };
};

type ChartDataPoint = {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
};


// --- HELPER & CALCULATION FUNCTIONS ---

const parseValue = (str: string): number => {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
};

const formatToBRL = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
};

const getCandleColorClasses = (open: number, close: number) => {
    return close >= open 
        ? 'bg-green-500/10 text-green-400 ring-green-500/20' 
        : 'bg-red-500/10 text-red-400 ring-red-500/20';
};


// --- UI COMPONENTS (Defined at the top level to prevent re-creation on render) ---

const InputField: FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, value, onChange }) => (
    <div className="flex flex-col">
        <label className="text-sm text-gray-400 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            className="bg-slate-800 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);

const ResultDisplay: FC<{ label: string; value: ReactNode; colorClass?: string, isAlert?: boolean }> = ({ label, value, colorClass = 'text-white', isAlert = false }) => (
    <div className="flex flex-col items-center justify-center bg-slate-800/50 p-2 rounded-md">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`font-bold text-lg ${colorClass} ${isAlert ? 'animate-pulse' : ''}`}>{value}</span>
    </div>
);

const IconWrapper: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center text-white ${className}`}>
        {children}
    </div>
);

const ActionDetail: FC<{ icon: ReactNode; iconClass: string; title: string; children: ReactNode }> = ({ icon, iconClass, title, children }) => (
    <div className="flex items-start space-x-3">
        <IconWrapper className={iconClass}>{icon}</IconWrapper>
        <div>
            <h4 className="font-semibold text-gray-200">{title}</h4>
            <p className="text-gray-400">{children}</p>
        </div>
    </div>
);

const ScenarioCard: FC<{ title: string; scenario: string; colorClass: string }> = ({ title, scenario, colorClass }) => {
    const lines = scenario.split('*').map(s => s.trim()).filter(Boolean);
    const trigger = lines.find(l => l.startsWith('Trigger:'))?.replace('Trigger:', '').trim();
    const entry = lines.find(l => l.startsWith('Ponto de Entrada:'))?.replace('Ponto de Entrada:', '').trim();
    const targets = lines.filter(l => l.startsWith('Alvo'));
    const stopLoss = lines.find(l => l.startsWith('Stop Loss:'))?.replace('Stop Loss:', '').trim();

    return (
        <div className={`bg-slate-800/50 border-l-4 ${colorClass} rounded-r-lg p-4 shadow-lg space-y-4`}>
            <h3 className={`text-lg font-bold ${colorClass.replace('border-', 'text-')}`}>{title}</h3>
            {trigger && (
                <ActionDetail title="Gatilho" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.362-3.797A8.33 8.33 0 0 1 15.362 5.214Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75A6.75 6.75 0 0 0 18.75 12a6.75 6.75 0 0 0-6.75-6.75A6.75 6.75 0 0 0 5.25 12a6.75 6.75 0 0 0 6.75 6.75Z" /></svg>} iconClass="bg-blue-500">
                    <span className="block text-blue-300">{trigger}</span>
                    {entry && <span className="block text-gray-300 mt-1">Entrada: <span className="font-semibold">{entry}</span></span>}
                </ActionDetail>
            )}
            {targets.length > 0 && (
                <ActionDetail title="Alvos" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>} iconClass="bg-green-500">
                    <ul className="list-disc list-inside text-green-300">
                        {targets.map((t, i) => <li key={i}>{t.trim()}</li>)}
                    </ul>
                </ActionDetail>
            )}
            {stopLoss && (
                <ActionDetail title="Stop Loss" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>} iconClass="bg-red-500">
                    <span className="block text-red-300">{stopLoss}</span>
                </ActionDetail>
            )}
        </div>
    );
};

const FormattedCommentary: FC<{ text: string }> = ({ text }) => {
    const sections = text.split('---').map(s => s.trim()).filter(Boolean);
    const context = sections.find(s => s.startsWith('CONTEXTO GERAL:'));
    const mostImportantRegions = sections.find(s => s.startsWith('REGIÕES MAIS IMPORTANTES'));
    const tradingPlan = sections.find(s => s.startsWith('PLANO DE TRADING OBJETIVO:'));
    const riskManagement = sections.find(s => s.startsWith('GESTÃO DE RISCO'));

    const scenarios = tradingPlan?.split(/CENÁRIO \d:/).map(s => s.trim()).filter(Boolean) ?? [];

    return (
        <div className="space-y-6 mt-4 text-gray-300">
            {context && <AnalysisCard title="Contexto Geral"><p className="text-gray-400">{context.replace('CONTEXTO GERAL:', '').trim()}</p></AnalysisCard>}
            {mostImportantRegions && <AnalysisCard title="Regiões Mais Importantes"><p className="text-gray-400 whitespace-pre-line">{mostImportantRegions.substring(mostImportantRegions.indexOf(':') + 1).trim()}</p></AnalysisCard>}
            {tradingPlan && (
                <AnalysisCard title="Plano de Trading">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {scenarios.map((scenario, index) => {
                            const titleLine = scenario.substring(0, scenario.indexOf(':')).trim();
                            const content = scenario.substring(scenario.indexOf(':') + 1).trim();
                            const isBearish = titleLine.toLowerCase().includes('baixa') || titleLine.toLowerCase().includes('venda');
                            return <ScenarioCard key={index} title={titleLine} scenario={content} colorClass={isBearish ? 'border-red-500' : 'border-green-500'} />;
                        })}
                    </div>
                </AnalysisCard>
            )}
            {riskManagement && <AnalysisCard title="Gestão de Risco e Observações"><p className="text-gray-400 whitespace-pre-line">{riskManagement.substring(riskManagement.indexOf(':') + 1).trim()}</p></AnalysisCard>}
        </div>
    );
};

const AnalysisCard: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-800/50 rounded-lg p-4 shadow-lg">
        <h3 className="text-lg font-bold text-blue-400 border-b border-slate-700 pb-2 mb-3">{title}</h3>
        {children}
    </div>
);

const DataRow: FC<{ label: string; value: string; color?: string; description?: string }> = ({ label, value, color, description }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
        <div>
            <span className="text-sm text-gray-400">{label}</span>
            {description && <span className="block text-xs text-gray-500">{description}</span>}
        </div>
        <span className={`font-mono font-semibold text-sm ${color || 'text-gray-200'}`}>{value}</span>
    </div>
);

const DetailCard: FC<{ title: string; children: ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-slate-800/50 rounded-lg p-3 shadow-lg ${className}`}>
        <h4 className="text-md font-bold text-blue-400 border-b border-slate-700 pb-2 mb-2">{title}</h4>
        <div className="space-y-1">{children}</div>
    </div>
);

const SummaryDataPoint: FC<{ label: string; value: string; subValue?: string; colorClass?: string; isCandle?: boolean; candleType?: 'high' | 'low' }> = ({ label, value, subValue, colorClass, isCandle, candleType }) => (
  <div className={`bg-slate-800/50 p-3 rounded-lg flex flex-col justify-between ${isCandle ? candleType === 'high' ? 'ring-2 ring-green-500/30' : 'ring-2 ring-red-500/30' : ''}`}>
    <div>
        <span className="text-sm text-gray-400">{label}</span>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
    {subValue && (
        <p className={`text-sm font-semibold ${colorClass}`}>{subValue}</p>
    )}
  </div>
);

// --- CHART STYLES ---
const chartColors = {
    grid: '#334155',
    axisText: '#94a3b8',
    axisLine: '#475569',
    wick: '#94a3b8',
    bull: '#10b981',
    bear: '#ef4444',
    pivot: '#eab308',
    resistance: '#f87171',
    support: '#4ade80',
    histResistanceStroke: '#ef4444',
    histSupportStroke: '#10b981',
    trapFill: '#be123c',
    trapStroke: '#fda4af',
    accumulationFill: '#059669',
    accumulationStroke: '#6ee7b7',
};

// --- CHART COMPONENT ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const colorClass = data.close >= data.open ? 'text-green-400' : 'text-red-400';
        return (
            <div className="bg-slate-700/80 backdrop-blur-sm p-3 rounded-md border border-slate-600 shadow-lg">
                <p className="text-sm text-gray-200 font-bold">{label}</p>
                <p className={colorClass}>Abertura: <span className="font-mono">{formatToBRL(data.open)}</span></p>
                <p className={colorClass}>Máxima: <span className="font-mono">{formatToBRL(data.high)}</span></p>
                <p className={colorClass}>Mínima: <span className="font-mono">{formatToBRL(data.low)}</span></p>
                <p className={colorClass}>Fechamento: <span className="font-mono">{formatToBRL(data.close)}</span></p>
            </div>
        );
    }
    return null;
};

const MarketChart: FC<{ chartData: ChartDataPoint[], analysis: AnalysisData }> = ({ chartData, analysis }) => {
    const yDomain = useMemo(() => {
        if (!analysis || chartData.length === 0) return ['auto', 'auto'];

        const prices = chartData.flatMap(d => [d.high, d.low]);
        const levels = [
            ...analysis.historicalSR.resistances.map(r => r.value),
            ...analysis.historicalSR.supports.map(s => s.value),
            ...analysis.pivotPoints.resistances.map(r => r.value),
            ...analysis.pivotPoints.supports.map(s => s.value),
            analysis.pivotPoints.p,
            analysis.trapZones.buyTrap.start,
            analysis.trapZones.buyTrap.end,
            analysis.trapZones.sellTrap.start,
            analysis.trapZones.sellTrap.end,
            analysis.trapZones.sellerDefense.start,
            analysis.trapZones.sellerDefense.end,
            analysis.accumulationZones.primary.start,
            analysis.accumulationZones.primary.end,
        ];
        
        if (analysis.accumulationZones.secondary) {
            levels.push(analysis.accumulationZones.secondary.start, analysis.accumulationZones.secondary.end);
        }

        const allValues = [...prices, ...levels].filter(v => v !== null && !isNaN(v) && v !== undefined);
        
        if (allValues.length === 0) return ['auto', 'auto'];

        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const buffer = (max - min) * 0.05;

        return [min - buffer, max + buffer];
    }, [analysis, chartData]);

    return (
        <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: chartColors.axisText, fontSize: 12 }} tickLine={{ stroke: chartColors.axisLine }} axisLine={{ stroke: chartColors.axisLine }} />
                <YAxis
                    tickFormatter={(tick) => formatToBRL(tick)}
                    domain={yDomain}
                    orientation="right"
                    tick={{ fill: chartColors.axisText, fontSize: 12 }}
                    tickLine={{ stroke: chartColors.axisLine }}
                    axisLine={{ stroke: chartColors.axisLine }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36}/>
                
                {/* Reference Areas for Zones */}
                <ReferenceArea y1={analysis.trapZones.buyTrap.start} y2={analysis.trapZones.buyTrap.end} fill={chartColors.trapFill} fillOpacity={0.15} stroke={chartColors.trapStroke} strokeDasharray="4 4" ifOverflow="visible" />
                <ReferenceArea y1={analysis.trapZones.sellerDefense.start} y2={analysis.trapZones.sellerDefense.end} fill={chartColors.trapFill} fillOpacity={0.15} stroke={chartColors.trapStroke} strokeDasharray="4 4" ifOverflow="visible" />
                <ReferenceArea y1={analysis.accumulationZones.primary.start} y2={analysis.accumulationZones.primary.end} fill={chartColors.accumulationFill} fillOpacity={0.15} stroke={chartColors.accumulationStroke} strokeDasharray="4 4" ifOverflow="visible" />
                {analysis.accumulationZones.secondary && <ReferenceArea y1={analysis.accumulationZones.secondary.start} y2={analysis.accumulationZones.secondary.end} fill={chartColors.accumulationFill} fillOpacity={0.10} stroke={chartColors.accumulationStroke} strokeDasharray="4 4" ifOverflow="visible" />}
                
                {/* Wicks */}
                <Bar dataKey={(d: ChartDataPoint) => [d.low, d.high]} barSize={1} fill={chartColors.wick} shape={<rect />} legendType="none" />

                {/* Candlestick Body */}
                <Bar dataKey={(d: ChartDataPoint) => [d.open, d.close]} barSize={10} legendType="none">
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? chartColors.bull : chartColors.bear} />
                    ))}
                </Bar>
                
                {/* Reference Lines for Levels */}
                <ReferenceLine y={analysis.pivotPoints.p} label={{ value: "Pivô", position: 'insideTopLeft', fill: chartColors.pivot }} stroke={chartColors.pivot} strokeDasharray="3 3" />
                {analysis.pivotPoints.resistances.map(r => <ReferenceLine key={`pr-${r.level}`} y={r.value} label={{ value: r.level, position: 'insideTopLeft', fill: chartColors.resistance }} stroke={chartColors.resistance} strokeDasharray="3 3" />)}
                {analysis.pivotPoints.supports.map(s => <ReferenceLine key={`ps-${s.level}`} y={s.value} label={{ value: s.level, position: 'insideTopLeft', fill: chartColors.support }} stroke={chartColors.support} strokeDasharray="3 3" />)}
                {analysis.historicalSR.resistances.map(r => <ReferenceLine key={`hr-${r.level}`} y={r.value} label={{ value: `H-${r.level}`, position: 'insideTopLeft', fill: chartColors.resistance, fontSize: 10 }} stroke={chartColors.histResistanceStroke} strokeOpacity={0.5} strokeDasharray="2 2" />)}
                {analysis.historicalSR.supports.map(s => <ReferenceLine key={`hs-${s.level}`} y={s.value} label={{ value: `H-${s.level}`, position: 'insideTopLeft', fill: chartColors.support, fontSize: 10 }} stroke={chartColors.histSupportStroke} strokeOpacity={0.5} strokeDasharray="2 2" />)}
                
            </ComposedChart>
        </ResponsiveContainer>
    );
};


// --- APP COMPONENT ---

function App() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [iaCommentary, setIaCommentary] = useState<string>('');
  const [loadingIa, setLoadingIa] = useState(false);
  
  // Risk Calculator State
  const [capital, setCapital] = useState('1000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [stopPoints, setStopPoints] = useState('150');
  const [targetMultiplier, setTargetMultiplier] = useState('2');

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setError("O arquivo está vazio ou não pôde ser lido.");
        return;
      }

      const lines = text.split('\n').filter(line => line.trim() !== '');
      const dataLines = lines.slice(1); // Ignora o cabeçalho
      
      try {
        const parsedData = dataLines.map((line) => {
          const columns = line.split(/\s+/).filter(Boolean);
          if (columns.length < 5) throw new Error(`Linha inválida com ${columns.length} colunas: "${line}"`);
          
          const [dateStr, openStr, highStr, lowStr, closeStr] = columns;
          const [day, month, year] = dateStr.split('/');

          return {
            Data: new Date(`${year}-${month}-${day}`),
            Abertura: parseValue(openStr),
            Maxima: parseValue(highStr),
            Minima: parseValue(lowStr),
            Fechamento: parseValue(closeStr),
          };
        }).filter(d => !isNaN(d.Data.getTime()) && d.Abertura && d.Maxima && d.Minima && d.Fechamento)
          .sort((a, b) => b.Data.getTime() - a.Data.getTime());

        if (parsedData.length < 1) {
          throw new Error("Nenhum dado válido encontrado no arquivo. Verifique o formato.");
        }

        setMarketData(parsedData);
        setError('');
        setIaCommentary('');
      } catch (err: any) {
        console.error("Erro ao processar o arquivo:", err);
        setError(`Erro ao processar o arquivo: ${err.message}. Verifique o formato das colunas e números.`);
        setMarketData([]);
        setAnalysis(null);
      }
    };
    reader.onerror = () => setError("Falha ao ler o arquivo.");
    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setLoading(true);
      processFile(file);
      setLoading(false);
    }
  };

  const calculateAnalysis = useCallback((data: MarketData[]): AnalysisData | null => {
    if (data.length < 1) return null;

    // --- 1. GET LATEST DATA ---
    const df_indice = data;
    const today = df_indice[0];
    const yesterday = df_indice[1];
    if (!today || !yesterday) return null;

    let operationDate = new Date(today.Data);
    operationDate.setDate(operationDate.getDate() + 1);
    // Skip weekends
    if (operationDate.getDay() === 6) { // Saturday
        operationDate.setDate(operationDate.getDate() + 2);
    } else if (operationDate.getDay() === 0) { // Sunday
        operationDate.setDate(operationDate.getDate() + 1);
    }


    // --- 2. HISTORICAL S/R ---
    const recent_maximas = [...new Set(df_indice.slice(0, 100).map(d => d.Maxima))].sort((a, b) => b - a);
    let resistances = [today.Maxima];
    for (const m of recent_maximas) {
        if (m > today.Maxima && !resistances.includes(m)) resistances.push(m);
        if (resistances.length === 4) break;
    }
    while (resistances.length < 4) resistances.push(resistances[resistances.length - 1]);
    resistances.sort((a, b) => a - b);
    
    const recent_minimas = [...new Set(df_indice.slice(0, 100).map(d => d.Minima))].sort((a, b) => a - b);
    let supports = [today.Minima];
    for (const m of recent_minimas) {
        if (m < today.Minima && !supports.includes(m)) supports.push(m);
        if (supports.length === 4) break;
    }
    while (supports.length < 4) supports.push(supports[supports.length - 1]);
    supports.sort((a, b) => a - b);
    
    const historicalSupports = supports.map((v, i) => ({level: `S${i+1}`, value: v}));

    // --- 3. PIVOT POINTS ---
    const P = (today.Maxima + today.Minima + today.Fechamento) / 3;
    const R1 = (2 * P) - today.Minima;
    const S1 = (2 * P) - today.Maxima;
    const R2 = P + (today.Maxima - today.Minima);
    const S2 = P - (today.Maxima - today.Minima);
    const R3 = R1 + (today.Maxima - today.Minima);
    const S3 = S1 - (today.Maxima - today.Minima);

    // --- 4. FIBONACCI ---
    let fibonacci = null;
    if(df_indice.length >= 10) {
        const recentCloses = df_indice.slice(0, 10).map(d => d.Fechamento);
        const recent_high = Math.max(...recentCloses);
        const recent_low = Math.min(...recentCloses);
        const diff_swing = recent_high - recent_low;
        
        if (diff_swing > 0) {
            fibonacci = {
                retracements: [
                    { level: '78.6%', value: recent_high - (diff_swing * 0.786) },
                    { level: '61.8%', value: recent_high - (diff_swing * 0.618) },
                    { level: '50.0%', value: recent_high - (diff_swing * 0.5) },
                    { level: '38.2%', value: recent_high - (diff_swing * 0.382) },
                    { level: '23.6%', value: recent_high - (diff_swing * 0.236) },
                ].sort((a,b) => a.value - b.value),
                extensions: [
                    { level: '161.8%_up', value: today.Fechamento + (diff_swing * 0.618) },
                    { level: '138.2%_up', value: today.Fechamento + (diff_swing * 0.382) },
                    { level: '123.6%_up', value: today.Fechamento + (diff_swing * 0.236) },
                    { level: '123.6%_down', value: today.Fechamento - (diff_swing * 0.236) },
                    { level: '138.2%_down', value: today.Fechamento - (diff_swing * 0.382) },
                    { level: '161.8%_down', value: today.Fechamento - (diff_swing * 0.618) },
                ].sort((a,b) => a.value - b.value)
            };
        }
    }

    // --- 5. GAUSS ---
    const relevantCloses = df_indice.slice(0, 20).map(d => d.Fechamento);
    const media = relevantCloses.reduce((a, b) => a + b, 0) / relevantCloses.length;
    const stdDev = Math.sqrt(relevantCloses.map(x => Math.pow(x - media, 2)).reduce((a, b) => a + b, 0) / relevantCloses.length);
    const gaussLevels = [
        { level: "+4 DP", value: today.Fechamento + (4 * stdDev) },
        { level: "+3 DP", value: today.Fechamento + (3 * stdDev) },
        { level: "+2 DP", value: today.Fechamento + (2 * stdDev) },
        { level: "+1 DP", value: today.Fechamento + stdDev },
        { level: "-1 DP", value: today.Fechamento - stdDev },
        { level: "-2 DP", value: today.Fechamento - (2 * stdDev) },
        { level: "-3 DP", value: today.Fechamento - (3 * stdDev) },
        { level: "-4 DP", value: today.Fechamento - (4 * stdDev) },
    ].sort((a,b) => a.value - b.value);

    // --- 6. LONG-TERM MA ---
    let longTermMA = null;
    if (df_indice.length >= 50) {
        longTermMA = df_indice.slice(0, 50).map(d => d.Fechamento).reduce((a, b) => a + b, 0) / 50;
    }

    // --- 7. ATR ---
    let atr = null;
    if (df_indice.length >= 15) {
        const sortedForAtr = [...df_indice].sort((a,b) => a.Data.getTime() - b.Data.getTime()).slice(-15);
        let trueRanges = [];
        for (let i = 1; i < sortedForAtr.length; i++) {
            const high = sortedForAtr[i].Maxima;
            const low = sortedForAtr[i].Minima;
            const prevClose = sortedForAtr[i-1].Fechamento;
            trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
        }
        const atrValue = trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
        atr = {
            value: atrValue,
            buyStop: today.Fechamento - (2 * atrValue),
            sellStop: today.Fechamento + (2 * atrValue)
        };
    }

    // --- 8 & 9. TRAP & ACCUMULATION ZONES ---
    const DP_menos1 = today.Fechamento - stdDev;
    const DP_mais2 = today.Fechamento + (2 * stdDev);
    const DP_mais3 = today.Fechamento + (3 * stdDev);

    const buyTrapStart = Math.min(today.Abertura, today.Maxima - (today.Maxima - today.Minima) * 0.1);
    
    return {
      operationDate: operationDate.toLocaleDateString('pt-BR'),
      previousDay: {
        Fechamento: today.Fechamento,
        Abertura: today.Abertura,
        Maxima: today.Maxima,
        Minima: today.Minima,
        Range: today.Maxima - today.Minima,
        Variation: (today.Fechamento - yesterday.Fechamento) / yesterday.Fechamento * 100
      },
      historicalSR: {
        resistances: resistances.map((v, i) => ({level: `R${i+1}`, value: v})),
        supports: historicalSupports,
      },
      pivotPoints: {
        p: P,
        resistances: [
            { level: 'R1', value: R1 },
            { level: 'R2', value: R2 },
            { level: 'R3', value: R3 }
        ].sort((a,b) => a.value - b.value),
        supports: [
            { level: 'S1', value: S1 },
            { level: 'S2', value: S2 },
            { level: 'S3', value: S3 }
        ].sort((a,b) => a.value - b.value),
      },
      fibonacci,
      gaussLevels: {
          equilibrium: media,
          stdDev,
          levels: gaussLevels
      },
      longTermMA,
      atr,
      trapZones: {
        buyTrap: { start: Math.min(buyTrapStart, today.Maxima), end: Math.max(buyTrapStart, today.Maxima) },
        sellTrap: { start: Math.min(today.Minima, DP_menos1), end: Math.max(today.Minima, DP_menos1) },
        sellerDefense: { start: DP_mais2, end: DP_mais3 },
      },
      accumulationZones: {
        primary: { start: Math.min(today.Minima, DP_menos1), end: Math.max(today.Minima, DP_menos1) },
        secondary: historicalSupports.length > 2 ? { start: historicalSupports[1].value, end: historicalSupports[2].value } : null,
      }
    };
  }, []);

  useMemo(() => {
    if (marketData.length > 0) {
      setAnalysis(calculateAnalysis(marketData));
    }
  }, [marketData, calculateAnalysis]);

  const generateIaCommentary = async () => {
    if (!analysis) return;
    setLoadingIa(true);
    setIaCommentary('');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const prompt = `
        **CONTEXTO PARA ANÁLISE DE TRADING (MINI-ÍNDICE)**

        **Dados do Pregão Anterior:**
        - **Data do Pregão:** ${analysis.previousDay.Fechamento}
        - **Fechamento:** ${formatToBRL(analysis.previousDay.Fechamento)}
        - **Abertura:** ${formatToBRL(analysis.previousDay.Abertura)}
        - **Máxima:** ${formatToBRL(analysis.previousDay.Maxima)}
        - **Mínima:** ${formatToBRL(analysis.previousDay.Minima)}
        - **Variação:** ${analysis.previousDay.Variation.toFixed(2)}%

        **Pontos-Chave para o Pregão de ${analysis.operationDate}:**
        - **Pivô Central:** ${formatToBRL(analysis.pivotPoints.p)}
        - **Resistências Históricas (R1-R4):** ${analysis.historicalSR.resistances.map(r => formatToBRL(r.value)).join(' / ')}
        - **Suportes Históricos (S1-S4):** ${analysis.historicalSR.supports.map(s => formatToBRL(s.value)).join(' / ')}
        - **Resistências de Pivô (R1-R3):** ${analysis.pivotPoints.resistances.map(r => formatToBRL(r.value)).join(' / ')}
        - **Suportes de Pivô (S1-S3):** ${analysis.pivotPoints.supports.map(s => formatToBRL(s.value)).join(' / ')}
        - **Níveis de Gauss:** Média ${formatToBRL(analysis.gaussLevels.equilibrium)}, Desvio ${formatToBRL(analysis.gaussLevels.stdDev)}. Níveis de +1 a +4 DP e -1 a -4 DP.
        ${analysis.fibonacci ? `- **Fibonacci:** Retrações e extensões calculadas.` : ''}
        - **ATR (14):** ${formatToBRL(analysis.atr?.value)} (sugestão de volatilidade)
        - **Zonas Operacionais:**
          - Armadilha de Compra: ${formatToBRL(analysis.trapZones.buyTrap.start)} - ${formatToBRL(analysis.trapZones.buyTrap.end)}
          - Armadilha de Venda / Acumulação Primária: ${formatToBRL(analysis.trapZones.sellTrap.start)} - ${formatToBRL(analysis.trapZones.sellTrap.end)}
          - Defesa Vendedora: ${formatToBRL(analysis.trapZones.sellerDefense.start)} - ${formatToBRL(analysis.trapZones.sellerDefense.end)}
          - Acumulação Secundária: ${analysis.accumulationZones.secondary ? `${formatToBRL(analysis.accumulationZones.secondary.start)} - ${formatToBRL(analysis.accumulationZones.secondary.end)}` : 'N/A'}
        
        **TAREFA:**
        Com base nos dados fornecidos, atue como um analista de mercado quantitativo sênior e crie um **plano de trading objetivo e profissional** para o pregão do dia ${analysis.operationDate}. Sua resposta deve ser estruturada exatamente como o exemplo abaixo, usando "---" para separar as seções e "*" para os itens de lista. Seja direto, prático e foque em confluências de preço para definir as zonas mais importantes.

        **FORMATO OBRIGATÓRIO:**

        CONTEXTO GERAL:
        [Faça uma breve análise do fechamento anterior e o que ele sinaliza. Mencione a importância do Pivô Central como definidor de viés.]

        ---

        REGIÕES MAIS IMPORTANTES PARA O DAY TRADE (WIN ${analysis.operationDate}):
        1.  **ZONA DE SUPORTE E ARMADILHA DE VENDA / ACUMULAÇÃO PRIMÁRIA:**
            *   **Níveis:** [Liste os principais níveis de suporte que formam a zona, ex: Mínima Anterior, S1, Fib, etc.]
            *   **Confluência:** [Explique por que essa zona é importante, mencionando a confluência de indicadores.]
            *   **O que observar:** [Descreva os gatilhos para compra e o que observar em caso de rompimento.]
        
        2.  **ZONA DE RESISTÊNCIA E ARMADILHA DE COMPRA:**
            *   **Níveis:** [Liste os principais níveis de resistência que formam a zona.]
            *   **Confluência:** [Explique a importância da zona.]
            *   **O que observar:** [Descreva os gatilhos para venda e o que observar em caso de rompimento.]

        3. **PIVÔ CENTRAL (Nível de Decisão):**
            *   **Nível:** [Valor do Pivô]
            *   **Confluência:** [Explique sua importância]
            *   **O que observar:** [Como operar em relação a ele na abertura e durante o dia.]

        ---

        PLANO DE TRADING OBJETIVO:
        CENÁRIO 1: VIÉS DE BAIXA INICIAL (Mais Provável)
        *   **Entrada de Venda (Rompimento do Suporte Imediato):**
            *   Trigger: [Gatilho claro, ex: Perda da zona X com volume]
            *   Ponto de Entrada: [Ponto específico]
            *   Alvo 1: [Nível e valor]
            *   Alvo 2: [Nível e valor]
            *   Stop Loss: [Nível e valor]
        
        *   **Entrada de Compra (Defesa no Suporte / Armadilha de Venda):**
            *   Trigger: [Gatilho claro, ex: Absorção na zona Y]
            *   Ponto de Entrada: [Ponto específico]
            *   Alvo 1: [Nível e valor]
            *   Alvo 2: [Nível e valor]
            *   Stop Loss: [Nível e valor]
        
        CENÁRIO 2: VIÉS DE ALTA INICIAL OU RECUPERAÇÃO
        *   **Entrada de Compra (Rompimento do Pivô Central):**
            *   [Detalhes: Trigger, Ponto de Entrada, Alvos, Stop Loss]
        *   **Entrada de Venda (Defesa na Resistência / Armadilha de Compra):**
            *   [Detalhes: Trigger, Ponto de Entrada, Alvos, Stop Loss]
        
        CENÁRIO 3: EXTENSÕES DE MOVIMENTO
        *   **Se rompimento de [nível chave] para cima:**
            *   Alvos: [Liste alvos superiores]
        *   **Se rompimento de [nível chave] para baixo:**
            *   Alvos: [Liste alvos inferiores]
        
        ---
        
        GESTÃO DE RISCO E OBSERVAÇÕES FINAIS:
        *   **Tamanho do Stop:** [Comente sobre o ATR e a adequação dos stops do plano.]
        *   **Volume e Agressão:** [Reforce a importância de confirmar os movimentos.]
        *   **Flexibilidade:** [Lembrete sobre a dinâmica do mercado.]
        *   **Notícias:** [Alerta sobre eventos macroeconômicos.]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        setIaCommentary(response.text);
    } catch (err) {
        console.error("Erro da API Gemini:", err);
        setIaCommentary("Ocorreu um erro ao gerar o comentário. Verifique o console para mais detalhes.");
    } finally {
        setLoadingIa(false);
    }
  };

  const riskCalculatorResults = useMemo(() => {
    const K = parseFloat(capital) || 0;
    const R = parseFloat(riskPercent) / 100 || 0;
    const S_pts = parseFloat(stopPoints) || 0;
    const T_mult = parseFloat(targetMultiplier) || 0;
    const cost_per_point = 0.20;

    if (K <= 0 || R <= 0 || S_pts <= 0) {
        return { contracts: 0, riskValue: 0, gainValue: 0, alert: null };
    }

    const max_risk_value = K * R;
    const stop_value_per_contract = S_pts * cost_per_point;
    let contracts = Math.floor(max_risk_value / stop_value_per_contract);
    let alert = null;

    if (contracts < 1) {
        if (K >= stop_value_per_contract) {
            contracts = 1;
            const realRiskPercent = (stop_value_per_contract / K) * 100;
            alert = `Operando com 1 contrato, o risco é de ${realRiskPercent.toFixed(2)}% do capital.`;
        } else {
            contracts = 0;
            alert = "Capital insuficiente para 1 contrato com este stop.";
        }
    }
    
    const finalRiskValue = contracts * stop_value_per_contract;
    const finalGainValue = finalRiskValue * T_mult;

    return { contracts, riskValue: finalRiskValue, gainValue: finalGainValue, alert };
  }, [capital, riskPercent, stopPoints, targetMultiplier]);

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!marketData || marketData.length === 0) return [];
    return marketData
        .slice()
        .reverse()
        .slice(-30)
        .map((d): ChartDataPoint => ({
            date: new Date(d.Data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            open: d.Abertura,
            high: d.Maxima,
            low: d.Minima,
            close: d.Fechamento,
        }));
}, [marketData]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400">Panorama de Mercado</h1>
          <p className="text-slate-400 mt-2">Análise de pontos-chave para Day Trade com base no pregão anterior</p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">1. Carregar Dados</h2>
            <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Escolher Arquivo
            </label>
            <input id="file-upload" type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
            <span className="ml-4 text-slate-400">{fileName || "Nenhum arquivo escolhido"}</span>
            <p className="text-xs text-slate-500 mt-2">Use um arquivo .txt com colunas: Data, Abertura, Maxima, Minima, Fechamento.</p>
            {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
          </div>
          
          <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Calculadora de Gestão de Risco</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <InputField label="Capital (R$)" value={capital} onChange={(e) => setCapital(e.target.value)} />
                <InputField label="Risco/Trade (%)" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
                <InputField label="Stop (Pontos)" value={stopPoints} onChange={(e) => setStopPoints(e.target.value)} />
                <InputField label="Alvo (Múltiplo)" value={targetMultiplier} onChange={(e) => setTargetMultiplier(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
                <ResultDisplay label="Contratos" value={riskCalculatorResults.contracts} />
                <ResultDisplay label="Risco" value={`R$ ${formatToBRL(riskCalculatorResults.riskValue)}`} colorClass="text-red-400" />
                <ResultDisplay label="Ganho" value={`R$ ${formatToBRL(riskCalculatorResults.gainValue)}`} colorClass="text-green-400" />
            </div>
            {riskCalculatorResults.alert && <p className="text-yellow-400 text-xs mt-2 text-center">{riskCalculatorResults.alert}</p>}
          </div>
        </section>

        {loading && <p>Carregando e processando...</p>}

        {analysis && (
          <>
            <section className="mb-6">
                <AnalysisCard title={`Resumo do Pregão Anterior & Análise para ${analysis.operationDate}`}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                        <SummaryDataPoint 
                            label="Fechamento" 
                            value={formatToBRL(analysis.previousDay.Fechamento)} 
                            subValue={`${analysis.previousDay.Variation > 0 ? '+' : ''}${analysis.previousDay.Variation.toFixed(2)}%`}
                            colorClass={getColorClass(analysis.previousDay.Variation)}
                            isCandle={true}
                            candleType={analysis.previousDay.Fechamento >= analysis.previousDay.Abertura ? 'high' : 'low'}
                        />
                        <SummaryDataPoint label="Abertura" value={formatToBRL(analysis.previousDay.Abertura)} />
                        <SummaryDataPoint label="Máxima" value={formatToBRL(analysis.previousDay.Maxima)} />
                        <SummaryDataPoint label="Mínima" value={formatToBRL(analysis.previousDay.Minima)} />
                        <SummaryDataPoint label="Range do Dia" value={`${formatToBRL(analysis.previousDay.Range)} pts`} />
                    </div>
                     <MarketChart chartData={chartData} analysis={analysis} />
                </AnalysisCard>
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <DetailCard title="S/R Históricos">
                    {analysis.historicalSR.resistances.map(r => <DataRow key={r.level} label={r.level} value={formatToBRL(r.value)} color="text-red-400" />)}
                    <div className="h-2"></div>
                    {analysis.historicalSR.supports.map(s => <DataRow key={s.level} label={s.level} value={formatToBRL(s.value)} color="text-green-400" />)}
                </DetailCard>
                <DetailCard title="Pontos de Pivô">
                    <DataRow label="Pivô" value={formatToBRL(analysis.pivotPoints.p)} color="text-yellow-400"/>
                    <div className="h-2"></div>
                    {analysis.pivotPoints.resistances.map(r => <DataRow key={r.level} label={r.level} value={formatToBRL(r.value)} color="text-red-400" />)}
                    <div className="h-2"></div>
                    {analysis.pivotPoints.supports.map(s => <DataRow key={s.level} label={s.level} value={formatToBRL(s.value)} color="text-green-400" />)}
                </DetailCard>
                {analysis.fibonacci && (
                    <DetailCard title="Níveis de Fibonacci">
                         <h5 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Retrações</h5>
                         {analysis.fibonacci.retracements.map(f => <DataRow key={f.level} label={f.level} value={formatToBRL(f.value)} />)}
                         <div className="h-2"></div>
                         <h5 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Extensões</h5>
                         {analysis.fibonacci.extensions.map(f => <DataRow key={f.level} label={f.level} value={formatToBRL(f.value)} />)}
                    </DetailCard>
                )}
                <div className="space-y-6">
                    <DetailCard title="Curva de Gauss">
                        <DataRow label="Equilíbrio (Média 20p)" value={formatToBRL(analysis.gaussLevels.equilibrium)} color="text-cyan-400"/>
                        {analysis.gaussLevels.levels.map(l => <DataRow key={l.level} label={l.level} value={formatToBRL(l.value)} color="text-cyan-400"/>)}
                    </DetailCard>
                    <DetailCard title="Zonas Operacionais">
                        <DataRow label="Armadilha Compra" value={`${formatToBRL(analysis.trapZones.buyTrap.start)} - ${formatToBRL(analysis.trapZones.buyTrap.end)}`} color="text-red-400" />
                        <DataRow label="Armadilha Venda" value={`${formatToBRL(analysis.trapZones.sellTrap.start)} - ${formatToBRL(analysis.trapZones.sellTrap.end)}`} color="text-green-400"/>
                        <DataRow label="Defesa Vendedora" value={`${formatToBRL(analysis.trapZones.sellerDefense.start)} - ${formatToBRL(analysis.trapZones.sellerDefense.end)}`} color="text-red-400"/>
                        <DataRow label="Acumulação Primária" value={`${formatToBRL(analysis.accumulationZones.primary.start)} - ${formatToBRL(analysis.accumulationZones.primary.end)}`} color="text-green-400"/>
                        {analysis.accumulationZones.secondary && <DataRow label="Acumulação Secundária" value={`${formatToBRL(analysis.accumulationZones.secondary.start)} - ${formatToBRL(analysis.accumulationZones.secondary.end)}`} color="text-green-400" />}
                    </DetailCard>
                </div>
            </section>
            <section>
              <button onClick={generateIaCommentary} disabled={loadingIa} className="w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed">
                {loadingIa ? 'Gerando Análise...' : 'Gerar Comentário da IA'}
              </button>
              {loadingIa && <div className="text-center p-4">Analisando o mercado, por favor aguarde...</div>}
              {iaCommentary && <FormattedCommentary text={iaCommentary} />}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;