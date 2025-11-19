import React, { useState, useMemo, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import PremiumHeader from './components/premium/PremiumHeader';
import DataUploadSection from './components/premium/DataUploadSection';
import AnalysisOverview from './components/premium/AnalysisOverview';
import AdvancedMetricsGrid from './components/premium/AdvancedMetricsGrid';
import PremiumChart from './components/premium/PremiumChart';
import RiskManagementPanel from './components/premium/RiskManagementPanel';
import AIAnalysisPanel from './components/premium/AIAnalysisPanel';
import { MarketData, AnalysisData } from './types';
import { calculateAdvancedAnalysis } from './utils/advancedCalculations';
import { parseMarketDataFile } from './utils/fileParser';

function App() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [iaCommentary, setIaCommentary] = useState<string>('');
  const [loadingIa, setLoadingIa] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    setFileName(file.name);
    setError('');
    setIaCommentary('');

    parseMarketDataFile(file, (data) => {
      setMarketData(data);
      const analysisResult = calculateAdvancedAnalysis(data);
      setAnalysis(analysisResult);
    }, (errorMsg) => {
      setError(errorMsg);
      setMarketData([]);
      setAnalysis(null);
    });
  }, []);

  const generateAIAnalysis = async () => {
    if (!analysis) return;
    setLoadingIa(true);
    setIaCommentary('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const prompt = `
Você é um analista técnico quantitativo sênior. Analise estes dados de mercado e crie um relatório executivo profissional.

DADOS OPERACIONAIS:
Data: ${analysis.operationDate}
Fechamento: ${fmt(analysis.previousDay.Fechamento)}
Variação: ${analysis.previousDay.Variation.toFixed(2)}%
Range: ${fmt(analysis.previousDay.Range)}

ESTRUTURA DE PREÇOS:
Pivô: ${fmt(analysis.pivotPoints.p)}
Resistências: R1=${fmt(analysis.pivotPoints.resistances[0].value)}, R2=${fmt(analysis.pivotPoints.resistances[1].value)}, R3=${fmt(analysis.pivotPoints.resistances[2].value)}
Suportes: S1=${fmt(analysis.pivotPoints.supports[0].value)}, S2=${fmt(analysis.pivotPoints.supports[1].value)}, S3=${fmt(analysis.pivotPoints.supports[2].value)}

VOLATILIDADE E RISCO:
ATR: ${fmt(analysis.atr?.value || 0)}
Desvio Padrão: ${fmt(analysis.gaussLevels.stdDev)}
Equilíbrio: ${fmt(analysis.gaussLevels.equilibrium)}

FORMATO (use --- para separar):

RESUMO EXECUTIVO:
[Análise breve da estrutura de preços e cenário para hoje]

---

ZONAS OPERACIONAIS:
ZONA 1 - SUPORTE CRÍTICO:
* Níveis: [S1, S2, S3, suportes históricos]
* Importância: [Por que defend]
* Ação se testado: [Gatilho de compra]

ZONA 2 - RESISTÊNCIA CRÍTICA:
* Níveis: [R1, R2, R3, resistências históricas]
* Importância: [Por que vender]
* Ação se testado: [Gatilho de venda]

ZONA 3 - PIVÔ CENTRAL:
* Nível: [Pivô]
* Função: [Decisão de viés]

---

PLANO DE OPERAÇÃO:

CENÁRIO ALTA:
* GATILHO: [Qual sinal ativa]
* ENTRADA: [Preço específico]
* ALV 1: [Primeiro alvo]
* ALV 2: [Segundo alvo]
* STOP: [Onde proteger]

CENÁRIO BAIXA:
* GATILHO: [Qual sinal ativa]
* ENTRADA: [Preço específico]
* ALV 1: [Primeiro alvo]
* ALV 2: [Segundo alvo]
* STOP: [Onde proteger]

---

GESTÃO DE RISCO:
* ATR está ${analysis.atr ? 'alto' : 'normal'} - ajuste stops conforme
* Volume crucial para validar rompimentos
* Eventos econômicos podem invalidar setup
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      setIaCommentary(response.text);
    } catch (err) {
      console.error("Erro Gemini:", err);
      setIaCommentary("Erro ao gerar análise. Verifique sua API key.");
    } finally {
      setLoadingIa(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(15,23,42,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_80%,rgba(6,182,212,0.05),rgba(15,23,42,0))]" />
      </div>

      <div className="relative z-10">
        <PremiumHeader />

        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DataUploadSection
              fileName={fileName}
              error={error}
              onFileChange={handleFileUpload}
            />
            <div className="lg:col-span-2">
              <RiskManagementPanel />
            </div>
          </div>

          {analysis && (
            <>
              <AnalysisOverview analysis={analysis} />

              <PremiumChart
                marketData={marketData}
                analysis={analysis}
              />

              <AdvancedMetricsGrid analysis={analysis} />

              <AIAnalysisPanel
                commentary={iaCommentary}
                loading={loadingIa}
                onGenerate={generateAIAnalysis}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
