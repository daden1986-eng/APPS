

import React, { useState } from 'react';
import { Transaction, TransactionType, TransactionMode } from '../types';
import TrashIcon from './icons/TrashIcon';
import DownloadIcon from './icons/DownloadIcon';
import ConfirmDialog from './ConfirmDialog';
import TransactionCashIcon from './icons/TransactionCashIcon';
import TransactionTransferIcon from './icons/TransactionTransferIcon';

// jspdf dan jspdf-autotable dimuat dari tag skrip di index.html
declare const jspdf: any;

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onViewTransaction: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDeleteTransaction, onViewTransaction }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const handleOpenConfirm = (id: string) => {
    setTransactionToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setTransactionToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete);
    }
    handleCloseConfirm();
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const handleDownloadPDF = () => {
    if (transactions.length === 0) return;

    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Laporan Transaksi', 14, 22);

    const tableColumn = ["Tanggal", "Deskripsi", "Kategori", "Jenis", "Metode", "Jumlah"];
    const tableRows: (string|number)[][] = [];

    const sortedTransactionsForPDF = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTransactionsForPDF.forEach(transaction => {
      const transactionData = [
        formatDate(transaction.date),
        transaction.description,
        transaction.category ?? 'Tanpa Kategori',
        transaction.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran',
        transaction.mode ? (transaction.mode === TransactionMode.CASH ? 'Tunai' : 'Transfer') : 'N/A',
        formatCurrency(transaction.amount)
      ];
      tableRows.push(transactionData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Tema Indigo untuk header
    });

    const date = new Date().toISOString().split('T')[0];
    doc.save(`laporan_transaksi_${date}.pdf`);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Riwayat Transaksi</h2>
          <button
              onClick={handleDownloadPDF}
              disabled={transactions.length === 0}
              className="flex items-center gap-2 bg-slate-700 dark:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200 shadow-sm text-sm disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
              <DownloadIcon />
              <span>Unduh PDF</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">Belum ada transaksi.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map(transaction => {
                const isIncome = transaction.type === TransactionType.INCOME;
                const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                const typeIndicatorColor = isIncome ? 'bg-green-500' : 'bg-red-500';

                return (
                  <li
                    key={transaction.id}
                    className="py-4 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                    onClick={() => onViewTransaction(transaction)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className={`w-1.5 h-10 rounded-full ${typeIndicatorColor} flex-shrink-0 mt-1 sm:mt-0`}></span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 sm:truncate pr-4">
                              {transaction.description}
                            </p>
                          </div>
                          <span className={`font-bold text-lg ${amountColor} sm:whitespace-nowrap mt-1 sm:mt-0 flex-shrink-0`}>
                            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatDate(transaction.date)}</span>
                            {transaction.category && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">&bull;</span>
                                <span className="font-medium">{transaction.category}</span>
                              </>
                            )}
                            {transaction.mode && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">&bull;</span>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    transaction.mode === TransactionMode.CASH 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                  {transaction.mode === TransactionMode.CASH ? <TransactionCashIcon /> : <TransactionTransferIcon />}
                                  <span className="capitalize">{transaction.mode === TransactionMode.CASH ? 'Tunai' : 'Transfer'}</span>
                                </span>
                              </>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenConfirm(transaction.id);
                            }}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-2 transition-colors duration-200 flex-shrink-0"
                            aria-label="Hapus transaksi"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat diurungkan."
      />
    </>
  );
};

export default TransactionList;