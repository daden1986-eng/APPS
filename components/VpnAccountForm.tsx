import React, { useState, useEffect } from 'react';
import { VpnAccount, VpnProtocol, Customer } from '../types';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import RefreshIcon from './icons/RefreshIcon';

interface VpnAccountFormProps {
  customers: Customer[];
  onAddVpnAccount: (account: Omit<VpnAccount, 'id' | 'creationDate'>) => void;
  editingVpnAccount: VpnAccount | null;
  onUpdateVpnAccount: (account: VpnAccount) => void;
  onCancelEdit: () => void;
}

const generatePassword = (length = 8) => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const VpnAccountForm: React.FC<VpnAccountFormProps> = ({ customers, onAddVpnAccount, editingVpnAccount, onUpdateVpnAccount, onCancelEdit }) => {
  const [formState, setFormState] = useState({
    customerId: '',
    username: '',
    password: '',
    server: '',
    protocol: VpnProtocol.OPENVPN,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    notes: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isEditing = !!editingVpnAccount;

  useEffect(() => {
    if (editingVpnAccount) {
      setFormState({
        customerId: editingVpnAccount.customerId ?? '',
        username: editingVpnAccount.username,
        password: editingVpnAccount.password,
        server: editingVpnAccount.server,
        protocol: editingVpnAccount.protocol,
        expiryDate: editingVpnAccount.expiryDate,
        notes: editingVpnAccount.notes ?? '',
      });
    } else {
      resetForm();
    }
  }, [editingVpnAccount]);

  const resetForm = () => {
    setFormState({
      customerId: '',
      username: '',
      password: generatePassword(),
      server: '',
      protocol: VpnProtocol.OPENVPN,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.username || !formState.password || !formState.server || !formState.expiryDate) {
      alert("Harap isi semua kolom yang wajib diisi (username, password, server, tanggal kadaluarsa).");
      return;
    }
    
    if (isEditing) {
      onUpdateVpnAccount({ ...editingVpnAccount, ...formState });
    } else {
      onAddVpnAccount(formState);
      resetForm();
    }
  };
  
  const inputClasses = "block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Akun VPN' : 'Tambah Akun VPN Baru'}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="customerId" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Pelanggan (Opsional)</label>
          <select id="customerId" name="customerId" value={formState.customerId} onChange={handleInputChange} className={`${inputClasses} mt-1`}>
            <option value="">Tidak terhubung</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Username</label>
          <input type="text" id="username" name="username" value={formState.username} onChange={handleInputChange} className={`${inputClasses} mt-1`} placeholder="cth: vpnuser01" required />
        </div>
        <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Password</label>
            <div className="mt-1 relative">
                <input type={isPasswordVisible ? 'text' : 'password'} id="password" name="password" value={formState.password} onChange={handleInputChange} className={`${inputClasses} pr-20`} placeholder="••••••••" required />
                <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
                    <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full" aria-label={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}>{isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}</button>
                    <button type="button" onClick={() => setFormState(prev => ({ ...prev, password: generatePassword() }))} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full" aria-label="Buat password baru"><RefreshIcon /></button>
                </div>
            </div>
        </div>
        <div>
          <label htmlFor="server" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Server</label>
          <input type="text" id="server" name="server" value={formState.server} onChange={handleInputChange} className={`${inputClasses} mt-1`} placeholder="cth: sg.server.com" required />
        </div>
        <div>
          <label htmlFor="protocol" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Protokol</label>
          <select id="protocol" name="protocol" value={formState.protocol} onChange={handleInputChange} className={`${inputClasses} mt-1`} required>
            {Object.values(VpnProtocol).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Kadaluarsa</label>
          <input type="date" id="expiryDate" name="expiryDate" value={formState.expiryDate} onChange={handleInputChange} className={`${inputClasses} mt-1`} required />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Catatan (Opsional)</label>
          <textarea id="notes" name="notes" value={formState.notes} onChange={handleInputChange} className={`${inputClasses} mt-1 h-24`} placeholder="Info tambahan..."></textarea>
        </div>
        <div className={`flex gap-3 ${isEditing ? 'flex-row' : 'flex-col'}`}>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            {isEditing ? 'Simpan Perubahan' : 'Tambah Akun VPN'}
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

export default VpnAccountForm;