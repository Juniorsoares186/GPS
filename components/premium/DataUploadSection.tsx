import React from 'react';

interface Props {
  fileName: string;
  error: string;
  onFileChange: (file: File) => void;
}

const DataUploadSection: React.FC<Props> = ({ fileName, error, onFileChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover group">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
          <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Importar Dados</h3>
          <p className="text-sm text-slate-400">Carregue arquivo</p>
        </div>
      </div>

      <label htmlFor="file-upload" className="group/upload cursor-pointer block">
        <div className="border-2 border-dashed border-slate-600/50 rounded-xl p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
          <svg className="h-12 w-12 text-slate-400 group-hover/upload:text-emerald-400 transition-colors mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-white font-medium mb-1">Clique para selecionar</p>
          <p className="text-sm text-slate-500">Ou arraste um arquivo .txt</p>
        </div>
      </label>

      <input id="file-upload" type="file" className="hidden" accept=".txt" onChange={handleChange} />

      {fileName && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <p className="text-sm text-emerald-300 flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
            {fileName}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-slate-700/30">
        <p className="text-xs text-slate-500 font-mono">Formato: Data | Abertura | Máxima | Mínima | Fechamento</p>
      </div>
    </div>
  );
};

export default DataUploadSection;
