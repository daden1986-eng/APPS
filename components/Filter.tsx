import React from 'react';
import FilterIcon from './icons/FilterIcon';
import { TransactionType } from '../types';

export interface Filters {
  dateFrom: string;
  dateTo: string;
  type: 'all' | TransactionType;
  description: string;
}

interface FilterProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onResetFilters: () => void;
}

const Filter: React.FC<FilterProps> = ({ filters, onFilterChange, onResetFilters }) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange(name as keyof Filters, value as any);
  };
  
  const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
        <FilterIcon />
        Filter Transaksi
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Dari Tanggal</label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Sampai Tanggal</label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Jenis Transaksi</label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleInputChange}
            className={inputClasses}
          >
            <option value="all">Semua</option>
            <option value={TransactionType.INCOME}>Pemasukan</option>
            <option value={TransactionType.EXPENSE}>Pengeluaran</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Deskripsi</label>
          <input
            type="text"
            id="description"
            name="description"
            value={filters.description}
            onChange={handleInputChange}
            className={inputClasses}
            placeholder="Cari deskripsi..."
          />
        </div>
      </div>
       <div className="mt-4 flex justify-end">
        <button 
            onClick={onResetFilters}
            className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
        >
            Reset Filter
        </button>
      </div>
    </div>
  );
};

export default Filter;