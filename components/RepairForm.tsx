import React, { useState, useEffect } from 'react';
import { RepairTicket, RepairStatus } from '../types';

interface RepairFormProps {
  onAddRepairTicket: (ticket: Omit<RepairTicket, 'id' | 'receivedDate' | 'status' | 'completedDate'>) => void;
  editingRepairTicket: RepairTicket | null;
  onUpdateRepairTicket: (ticket: RepairTicket) => void;
  onCancelEdit: () => void;
}

const RepairForm: React.FC<RepairFormProps> = ({ onAddRepairTicket, editingRepairTicket, onUpdateRepairTicket, onCancelEdit }) => {
  const [customerName, setCustomerName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [technician, setTechnician] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<RepairStatus>(RepairStatus.NEW);

  const isEditing = !!editingRepairTicket;

  useEffect(() => {
    if (editingRepairTicket) {
      setCustomerName(editingRepairTicket.customerName);
      setContact(editingRepairTicket.contact ?? '');
      setAddress(editingRepairTicket.address ?? '');
      setDescription(editingRepairTicket.description);
      setTechnician(editingRepairTicket.technician ?? '');
      setCost(editingRepairTicket.cost?.toString() ?? '');
      setStatus(editingRepairTicket.status);
    } else {
      resetForm();
    }
  }, [editingRepairTicket]);

  const resetForm = () => {
    setCustomerName('');
    setContact('');
    setAddress('');
    setDescription('');
    setTechnician('');
    setCost('');
    setStatus(RepairStatus.NEW);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !description) {
        alert("Nama pelanggan dan deskripsi masalah harus diisi.");
        return;
    }
    
    const ticketData = {
      customerName,
      contact,
      address,
      description,
      technician,
      cost: cost ? parseFloat(cost) : undefined,
    };

    if (isEditing) {
        let completedDate = editingRepairTicket.completedDate;
        if (status === RepairStatus.COMPLETED && !completedDate) {
            completedDate = new Date().toISOString().split('T')[0];
        } else if (status !== RepairStatus.COMPLETED) {
            completedDate = undefined;
        }

        onUpdateRepairTicket({ 
            ...editingRepairTicket, 
            ...ticketData, 
            status,
            completedDate,
        });
    } else {
        onAddRepairTicket(ticketData);
        resetForm();
    }
  };
  
  const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Tiket Perbaikan' : 'Buat Tiket Perbaikan'}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nama Pelanggan</label>
          <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClasses} placeholder="cth: John Doe" required />
        </div>
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Kontak (Opsional)</label>
          <input type="text" id="contact" value={contact} onChange={(e) => setContact(e.target.value)} className={inputClasses} placeholder="No. HP atau info kontak lainnya"/>
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Alamat Pelanggan</label>
          <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClasses} h-20`} placeholder="Alamat lengkap pelanggan" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Deskripsi Masalah</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClasses} h-24`} placeholder="cth: Internet lambat, koneksi terputus" required />
        </div>
        <div>
          <label htmlFor="technician" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Teknisi (Opsional)</label>
          <input type="text" id="technician" value={technician} onChange={(e) => setTechnician(e.target.value)} className={inputClasses} placeholder="Nama teknisi yang ditugaskan"/>
        </div>
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Biaya Perbaikan (IDR, Opsional)</label>
          <input type="number" id="cost" value={cost} onChange={(e) => setCost(e.target.value)} className={inputClasses} placeholder="cth: 50000" min="0" />
        </div>
        {isEditing && (
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Status</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as RepairStatus)} className={inputClasses} required>
                    {Object.values(RepairStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        )}
        
        <div className={`flex gap-3 ${isEditing ? 'flex-row' : 'flex-col'}`}>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            {isEditing ? 'Simpan Perubahan' : 'Buat Tiket'}
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

export default RepairForm;