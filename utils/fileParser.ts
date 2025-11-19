import { MarketData } from '../types';

const parseValue = (str: string): number => {
  if (!str) return 0;
  const cleaned = str.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const parseMarketDataFile = (
  file: File,
  onSuccess: (data: MarketData[]) => void,
  onError: (error: string) => void
) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target?.result as string;
    if (!text) {
      onError('O arquivo está vazio.');
      return;
    }

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const dataLines = lines.slice(1);

    try {
      const parsedData = dataLines
        .map((line) => {
          const columns = line.split(/\s+/).filter(Boolean);
          if (columns.length < 5) return null;

          const [dateStr, openStr, highStr, lowStr, closeStr] = columns;
          const [day, month, year] = dateStr.split('/');

          return {
            Data: new Date(`${year}-${month}-${day}`),
            Abertura: parseValue(openStr),
            Maxima: parseValue(highStr),
            Minima: parseValue(lowStr),
            Fechamento: parseValue(closeStr),
          };
        })
        .filter((d): d is MarketData =>
          d !== null && !isNaN(d.Data.getTime()) &&
          d.Abertura > 0 && d.Maxima > 0 && d.Minima > 0 && d.Fechamento > 0
        )
        .sort((a, b) => b.Data.getTime() - a.Data.getTime());

      if (parsedData.length < 2) {
        throw new Error('São necessários pelo menos 2 dias.');
      }

      onSuccess(parsedData);
    } catch (err: any) {
      onError(`Erro: ${err.message}`);
    }
  };

  reader.onerror = () => onError('Falha ao ler.');
  reader.readAsText(file);
};
