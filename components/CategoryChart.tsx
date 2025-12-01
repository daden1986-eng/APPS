import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';

interface CategoryChartProps {
  transactions: Transaction[];
}

interface ProcessedData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface TooltipData {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const CategoryChart: React.FC<CategoryChartProps> = ({ transactions }) => {
  const [tooltip, setTooltip] = useState<TooltipData>({ visible: false, content: '', x: 0, y: 0 });

  const processedData = useMemo<ProcessedData[]>(() => {
    const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenseTransactions.length === 0) return [];

    const categoryMap = new Map<string, number>();
    let totalExpense = 0;

    expenseTransactions.forEach(t => {
      const category = t.category || 'Lain-lain';
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + t.amount);
      totalExpense += t.amount;
    });

    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        percentage: (value / totalExpense) * 100,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const showTooltip = (data: ProcessedData, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      content: `${data.name}: ${formatCurrency(data.value)} (${data.percentage.toFixed(1)}%)`,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  let cumulativePercent = 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Rincian Pengeluaran per Kategori</h2>
      {processedData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px]">
          <p className="text-gray-500 dark:text-gray-400">Tidak ada data pengeluaran untuk ditampilkan.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-full max-w-[250px] md:w-1/2">
            {tooltip.visible && (
              <div
                className="absolute bg-gray-800 dark:bg-slate-600 text-white text-xs rounded py-1 px-2 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10"
                style={{ left: tooltip.x, top: tooltip.y - 10 }}
              >
                {tooltip.content}
              </div>
            )}
            <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ transform: 'rotate(-90deg)' }}>
              {processedData.map(slice => {
                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += slice.percentage / 100;
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                const largeArcFlag = slice.percentage > 50 ? 1 : 0;
                
                const pathData = [
                  `M ${startX} ${startY}`, // Move
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
                  `L 0 0`, // Line
                ].join(' ');

                return (
                  <path
                    key={slice.name}
                    d={pathData}
                    fill={slice.color}
                    className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                    onMouseMove={(e) => showTooltip(slice, e)}
                    onMouseLeave={hideTooltip}
                  />
                );
              })}
            </svg>
          </div>
          <div className="w-full md:w-1/2">
            <ul className="space-y-2 text-sm">
              {processedData.map(slice => (
                <li key={slice.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: slice.color }}
                    ></span>
                    <span className="text-gray-700 dark:text-gray-300">{slice.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{slice.percentage.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryChart;