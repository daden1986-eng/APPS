import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";

interface ProfitSharingProps {
  balance: number;
}

const ProfitSharing: React.FC<ProfitSharingProps> = ({ balance }) => {
  const [partners, setPartners] = useState('2');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const sharePerPartner = useMemo(() => {
    const numPartners = parseInt(partners, 10);
    if (balance <= 0 || !numPartners || numPartners <= 0) {
      return 0;
    }
    return balance / numPartners;
  }, [balance, partners]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const handleGetSuggestion = async () => {
      if (balance <= 0) {
          setSuggestion("Laba saat ini tidak positif, tidak ada saran yang bisa diberikan.");
          return;
      }
      setIsLoading(true);
      setSuggestion('');
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
          
          const prompt = `Berdasarkan laba sebesar ${formatCurrency(balance)}, berikan saran singkat dan praktis dalam bahasa Indonesia tentang cara terbaik untuk mengalokasikan atau menginvestasikan dana ini untuk pertumbuhan bisnis. Fokus pada 2-3 poin utama dalam format bullet point.`;
          
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

          setSuggestion(response.text);

      } catch (error) {
          console.error("Error getting suggestion from Gemini:", error);
          setSuggestion("Maaf, terjadi kesalahan saat mengambil saran. Silakan coba lagi.");
      } finally {
          setIsLoading(false);
      }
  };

  const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Kalkulator Bagi Hasil & Saran AI</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="partners" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Jumlah Partner</label>
          <input
            type="number"
            id="partners"
            value={partners}
            onChange={(e) => setPartners(e.target.value)}
            className={inputClasses}
            placeholder="cth: 2"
            min="1"
          />
        </div>
        <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-lg text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Estimasi Bagian per Partner</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(sharePerPartner)}
          </p>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Saran Alokasi Laba</h3>
            <button 
                onClick={handleGetSuggestion}
                disabled={isLoading || balance <= 0}
                className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Meminta Saran...
                    </>
                ) : (
                    'Dapatkan Saran dari AI'
                )}
            </button>
            {suggestion && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-slate-700/50 border border-indigo-200 dark:border-slate-600 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium">{suggestion}</p>
                </div>
            )}
             {balance <= 0 && !suggestion && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Laba harus positif untuk mendapatkan saran.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfitSharing;