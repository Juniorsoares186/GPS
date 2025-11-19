import React from 'react';

const PremiumHeader = () => {
  return (
    <header className="border-b border-slate-800/50 glass-effect-dark sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-30 animate-pulse-glow" />
              <div className="relative h-14 w-14 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold gradient-text">Panorama Analytics</h1>
              <p className="text-sm text-slate-400">Análise Técnica Institucional</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl glass-effect-light">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-slate-300">Sistema Ativo</span>
            </div>

            <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 transition-all card-hover">
              Premium
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PremiumHeader;
