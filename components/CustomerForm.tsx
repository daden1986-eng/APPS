import React, { useState, useEffect } from 'react';
import { Customer, SubscriptionType } from '../types';

interface CustomerFormProps {
  onAddCustomer: (customer: Pick<Customer, 'name' | 'fee' | 'phone' | 'subscriptionType'>) => void;
  editingCustomer: Customer | null;
  onUpdateCustomer: (customer: Pick<Customer, 'id' | 'name' | 'fee' | 'phone' | 'subscriptionType'>) => void;
  onCancelEdit: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onAddCustomer, editingCustomer, onUpdateCustomer, onCancelEdit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fee, setFee] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType | ''>('');

  const isEditing = !!editingCustomer;

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setFee(editingCustomer.fee.toString());
      setPhone(editingCustomer.phone ?? '');
      setSubscriptionType(editingCustomer.subscriptionType ?? '');
    } else {
      resetForm();
    }
  }, [editingCustomer]);

  const resetForm = () => {
    setName('');
    setFee('');
    setPhone('');
    setSubscriptionType('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !fee || !subscriptionType) {
        alert("Harap isi semua kolom, termasuk tipe langganan.");
        return;
    }
    
    const customerData = {
      name,
      fee: parseFloat(fee),
      phone,
      subscriptionType,
    };

    if (isEditing) {
        onUpdateCustomer({ ...customerData, id: editingCustomer.id });
    } else {
        onAddCustomer(customerData);
        resetForm();
    }
  };
  
  const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nama Pelanggan</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
            placeholder="cth: John Doe"
            required
          />
        </div>
        <div>
          <label htmlFor="subscriptionType" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Tipe Langganan</label>
          <select
            id="subscriptionType"
            value={subscriptionType}
            onChange={(e) => setSubscriptionType(e.target.value as SubscriptionType)}
            className={inputClasses}
            required
          >
            <option value="" disabled>Pilih Tipe</option>
            {Object.values(SubscriptionType).map(type => (
                <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nomor Telepon (Opsional)</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClasses}
            placeholder="cth: 081234567890"
          />
        </div>
        <div>
          <label htmlFor="fee" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Iuran Bulanan (IDR)</label>
          <input
            type="number"
            id="fee"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className={inputClasses}
            placeholder="cth: 150000"
            required
            min="0"
          />
        </div>
        
        <div className={`flex gap-3 ${isEditing ? 'flex-row' : 'flex-col'}`}>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            {isEditing ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
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

export default CustomerForm;