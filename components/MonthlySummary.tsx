import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface MonthlySummaryProps {
  transactions: Transaction[];
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthlyData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });

    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions, currentDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };
  
  const balanceColor = monthlyData.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Ringkasan Bulanan</h2>
      
      <div className="flex justify-between items-center mb-4 bg-gray-100 dark:bg-slate-700 p-2 rounded-lg">
        <button 
          onClick={handlePrevMonth} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeftIcon />
        </button>
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-center w-40">
          {formatMonthYear(currentDate)}
        </span>
        <button 
          onClick={handleNextMonth} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          aria-label="Bulan berikutnya"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-green-700 dark:text-green-300">Pemasukan</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(monthlyData.income)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-red-700 dark:text-red-300">Pengeluaran</span>
          <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(monthlyData.expense)}</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Laba / Rugi</span>
          <span className={`font-bold text-lg ${balanceColor}`}>{formatCurrency(monthlyData.balance)}</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;