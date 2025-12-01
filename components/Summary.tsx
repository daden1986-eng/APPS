import React from 'react';
import IncomeIcon from './icons/IncomeIcon';
import ExpenseIcon from './icons/ExpenseIcon';
import BalanceIcon from './icons/BalanceIcon';
import TransactionCashIcon from './icons/TransactionCashIcon';
import TransactionTransferIcon from './icons/TransactionTransferIcon';


export interface FinancialSummaryData {
  cash: { income: number; expense: number; balance: number; };
  transfer: { income: number; expense: number; balance: number; };
  total: { income: number; expense: number; balance: number; };
}

interface SummaryProps {
  summary: FinancialSummaryData;
}

const Summary: React.FC<SummaryProps> = ({ summary }) => {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const SummaryCard: React.FC<{ icon: React.ReactNode; title: string; amount: number; colorClass: string; amountColorClass?: string }> = ({ icon, title, amount, colorClass, amountColorClass }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-xl font-bold ${amountColorClass || 'text-gray-800 dark:text-gray-100'}`}>{formatCurrency(amount)}</p>
      </div>
    </div>
  );
  
  const DetailCard: React.FC<{ title: string; amount: number; colorClass: string }> = ({ title, amount, colorClass }) => (
    <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-lg font-bold ${colorClass}`}>{formatCurrency(amount)}</p>
    </div>
  );

  return (
    <div>
        <h2 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200 px-1">Ringkasan Keuangan (Total)</h2>
        <div className="space-y-4">
            <SummaryCard 
                icon={<IncomeIcon />}
                title="Total Pemasukan"
                amount={summary.total.income}
                colorClass="bg-green-100 text-green-700"
            />
            <SummaryCard 
                icon={<ExpenseIcon />}
                title="Total Pengeluaran"
                amount={summary.total.expense}
                colorClass="bg-red-100 text-red-700"
            />
            <SummaryCard 
                icon={<BalanceIcon />}
                title="Laba / Rugi"
                amount={summary.total.balance}
                colorClass="bg-indigo-100 text-indigo-700"
                amountColorClass={summary.total.balance >= 0 ? 'text-green-600' : 'text-red-600'}
            />
        </div>
        
        <div className="mt-8">
            <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200 px-1">Rincian per Metode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rincian Tunai */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
                        <div className="bg-green-100 text-green-700 p-2 rounded-full"><TransactionCashIcon/></div>
                        <h4>Tunai</h4>
                    </div>
                    <DetailCard title="Pemasukan" amount={summary.cash.income} colorClass="text-green-600 dark:text-green-400"/>
                    <DetailCard title="Pengeluaran" amount={summary.cash.expense} colorClass="text-red-600 dark:text-red-400"/>
                    <div className="border-t pt-2 dark:border-gray-700">
                        <DetailCard title="Saldo Tunai" amount={summary.cash.balance} colorClass={summary.cash.balance >= 0 ? "text-gray-800 dark:text-gray-100" : "text-red-600"}/>
                    </div>
                </div>
                 {/* Rincian Transfer */}
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-full"><TransactionTransferIcon/></div>
                        <h4>Transfer</h4>
                    </div>
                    <DetailCard title="Pemasukan" amount={summary.transfer.income} colorClass="text-green-600 dark:text-green-400"/>
                    <DetailCard title="Pengeluaran" amount={summary.transfer.expense} colorClass="text-red-600 dark:text-red-400"/>
                    <div className="border-t pt-2 dark:border-gray-700">
                        <DetailCard title="Saldo Transfer" amount={summary.transfer.balance} colorClass={summary.transfer.balance >= 0 ? "text-gray-800 dark:text-gray-100" : "text-red-600"}/>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Summary;