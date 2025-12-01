import React, { useState, useEffect } from 'react';
import { Transaction, TransactionMode, TransactionType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionForm from './TransactionForm';
import ConfirmDialog from './ConfirmDialog';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import TransactionCashIcon from './icons/TransactionCashIcon';
import TransactionTransferIcon from './icons/TransactionTransferIcon';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
    }
  }, [isOpen, transaction]);

  if (!transaction) return null;

  const handleUpdate = (updatedTransaction: Transaction) => {
    onUpdateTransaction(updatedTransaction);
    onClose(); 
  };

  const handleDelete = () => {
    onDeleteTransaction(transaction.id);
    setIsConfirmOpen(false);
    onClose();
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

  const isIncome = transaction.type === TransactionType.INCOME;
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-slate-800">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 font-semibold">{value}</dd>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-labelledby="transaction-detail-title"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60"
              onClick={onClose}
              aria-hidden="true"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-gray-50 dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 id="transaction-detail-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {isEditing ? 'Edit Transaksi' : 'Detail Transaksi'}
                  </h2>
                  <button
                      type="button"
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label="Tutup"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>

              {isEditing ? (
                <div className="p-6">
                  <TransactionForm
                    editingTransaction={transaction}
                    onUpdateTransaction={handleUpdate}
                    onCancelEdit={() => setIsEditing(false)}
                  />
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <dl>
                      <DetailItem label="Deskripsi" value={transaction.description} />
                      <DetailItem label="Jumlah" value={<span className={amountColor}>{formatCurrency(transaction.amount)}</span>} />
                      <DetailItem label="Jenis" value={
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${isIncome ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      }/>
                      <DetailItem label="Kategori" value={transaction.category ?? '-'} />
                      <DetailItem label="Tanggal" value={formatDate(transaction.date)} />
                      <DetailItem label="Metode" value={
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            transaction.mode === TransactionMode.CASH 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {transaction.mode === TransactionMode.CASH ? <TransactionCashIcon /> : <TransactionTransferIcon />}
                          <span className="capitalize">{transaction.mode === TransactionMode.CASH ? 'Tunai' : 'Transfer'}</span>
                        </span>
                      } />
                    </dl>
                    
                    {transaction.proof && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bukti Transaksi</h3>
                        <img src={transaction.proof} alt="Bukti Transaksi" className="w-full h-auto max-h-80 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800" />
                      </div>
                    )}
                  </div>
                  <div className="bg-white dark:bg-slate-800/90 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => setIsConfirmOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        <TrashIcon /> Hapus
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <EditIcon /> Edit
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat diurungkan."
      />
    </>
  );
};

export default TransactionDetailModal;