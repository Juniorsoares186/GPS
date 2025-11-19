import React from 'react';

interface Props {
  commentary: string;
  loading: boolean;
  onGenerate: () => void;
}

const AIAnalysisPanel: React.FC<Props> = ({ commentary, loading, onGenerate }) => {
  const sections = commentary.split('---').map(s => s.trim()).filter(Boolean);

  return (
    <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover animate-fadeInUp">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Análise Inteligente</h2>
            <p className="text-sm text-slate-400">Processamento de IA Avançado</p>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:shadow-none transition-all duration-300 flex items-center gap-2 card-hover"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Gerando...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Gerar Análise
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="h-16 w-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-300">Analisando estrutura de mercado...</p>
          </div>
        </div>
      )}

      {commentary && !loading && (
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
            const title = lines[0]?.toUpperCase() || `Seção ${idx + 1}`;
            const content = lines.slice(1).join('\n');

            return (
              <div key={idx} className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-4">{title}</h3>
                <div className="text-slate-300 space-y-2 leading-relaxed whitespace-pre-wrap text-sm">
                  {content}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!commentary && !loading && (
        <div className="text-center py-12">
          <svg className="h-16 w-16 text-slate-600 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m0 0a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
          <p className="text-slate-400">Clique em "Gerar Análise" para processar os dados</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
