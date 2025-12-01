import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionMode } from '../types';
import CameraIcon from './icons/CameraIcon';
import TrashIcon from './icons/TrashIcon';

interface TransactionFormProps {
  onAddTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
  editingTransaction?: Transaction | null;
  onUpdateTransaction?: (transaction: Transaction) => void;
  onCancelEdit?: () => void;
}

const INCOME_CATEGORIES = ['Iuran', 'Penjualan', 'Layanan', 'Gaji', 'Lain-lain'];
const EXPENSE_CATEGORIES = ['Operasional', 'Listrik', 'Internet', 'Gaji Karyawan', 'Transportasi', 'Lain-lain'];


const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, editingTransaction, onUpdateTransaction, onCancelEdit }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [proof, setProof] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [mode, setMode] = useState<TransactionMode>(TransactionMode.TRANSFER);

  const isEditing = !!editingTransaction;

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setProof(editingTransaction.proof ?? null);
      setCategory(editingTransaction.category ?? '');
      setMode(editingTransaction.mode ?? TransactionMode.TRANSFER);
    } else {
      resetForm();
    }
  }, [editingTransaction]);
  
  // Reset category when type changes, but not when in edit mode and type is loaded
  useEffect(() => {
    const isInitialLoadForEditing = isEditing && category === (editingTransaction?.category ?? '');
    if (!isInitialLoadForEditing) {
       setCategory('');
    }
  }, [type, isEditing]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType(TransactionType.INCOME);
    setDate(new Date().toISOString().split('T')[0]);
    setProof(null);
    setCategory('');
    setMode(TransactionMode.TRANSFER);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        alert('Harap pilih file gambar yang valid (JPEG, PNG, dll.).');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !category) {
        alert("Harap isi semua kolom, termasuk kategori.");
        return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert("Jumlah transaksi harus berupa angka positif.");
      return;
    }
    
    const transactionData = {
      description,
      amount: parsedAmount,
      type,
      date,
      category,
      mode,
      proof: proof ?? undefined,
    };

    if (isEditing) {
        onUpdateTransaction?.({ ...transactionData, id: editingTransaction.id });
    } else {
        onAddTransaction?.(transactionData);
        resetForm();
    }
  };
  
  const typeClasses = "w-full p-3 rounded-lg text-center font-semibold cursor-pointer transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";
  const incomeActive = type === TransactionType.INCOME ? "bg-green-600 text-white shadow-lg" : "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-500";
  const expenseActive = type === TransactionType.EXPENSE ? "bg-red-600 text-white shadow-lg" : "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-500";
  const transferActive = mode === TransactionMode.TRANSFER ? "bg-blue-600 text-white shadow-lg" : "bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-500";
  const cashActive = mode === TransactionMode.CASH ? "bg-green-600 text-white shadow-lg" : "bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-500";

  const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  
  const currentCategories = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
            <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`${typeClasses} ${incomeActive} focus:ring-green-500`}>
                    Pemasukan
                </button>
                <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`${typeClasses} ${expenseActive} focus:ring-red-500`}>
                    Pengeluaran
                </button>
            </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
              <button type="button" onClick={() => setMode(TransactionMode.TRANSFER)} className={`${typeClasses} ${transferActive} focus:ring-blue-500`}>
                  Transfer
              </button>
              <button type="button" onClick={() => setMode(TransactionMode.CASH)} className={`${typeClasses} ${cashActive} focus:ring-green-500`}>
                  Tunai
              </button>
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Deskripsi</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClasses}
            placeholder="cth: Gaji bulanan"
            required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Jumlah (IDR)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClasses}
            placeholder="cth: 5000000"
            required
            min="0"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Kategori</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClasses}
            required
          >
            <option value="" disabled>Pilih Kategori</option>
            {currentCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
            required
          />
        </div>
        
        <div>
            <label htmlFor="proof" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Bukti Transaksi (Opsional)</label>
            {proof ? (
                <div className="mt-2 relative group">
                    <img src={proof} alt="Pratinjau Bukti" className="w-full h-auto max-h-48 object-contain rounded-lg border border-gray-300 dark:border-gray-600" />
                    <button 
                        type="button"
                        onClick={() => setProof(null)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Hapus bukti"
                    >
                        <TrashIcon />
                    </button>
                </div>
            ) : (
                <label className="mt-1 flex justify-center w-full px-3 py-4 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <span className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <CameraIcon />
                        <span>Tambah Bukti</span>
                    </span>
                    <input type="file" id="proof" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
            )}
        </div>

        <div className={`flex gap-3 ${isEditing ? 'flex-row' : 'flex-col'}`}>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            {isEditing ? 'Simpan Perubahan' : 'Tambah Transaksi'}
          </button>
          {isEditing && (
            <button type="button" onClick={onCancelEdit} className="w-full bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200">
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;