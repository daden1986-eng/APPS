import React, { useState, useMemo } from 'react';
import { RepairTicket, RepairStatus } from '../types';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import ConfirmDialog from './ConfirmDialog';
import MapPinIcon from './icons/MapPinIcon';

interface RepairListProps {
  repairTickets: RepairTicket[];
  onDeleteRepairTicket: (id: string) => void;
  onSetEditingRepairTicket: (ticket: RepairTicket) => void;
  onUpdateRepairTicket: (ticket: RepairTicket) => void;
}

const RepairList: React.FC<RepairListProps> = ({ repairTickets, onDeleteRepairTicket, onSetEditingRepairTicket, onUpdateRepairTicket }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  const handleOpenConfirm = (id: string) => {
    setTicketToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setTicketToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    if (ticketToDelete) {
      onDeleteRepairTicket(ticketToDelete);
    }
    handleCloseConfirm();
  };

  const handleStatusChange = (ticket: RepairTicket, newStatus: RepairStatus) => {
    let completedDate = ticket.completedDate;
    if (newStatus === RepairStatus.COMPLETED && !completedDate) {
        completedDate = new Date().toISOString().split('T')[0];
    } else if (newStatus !== RepairStatus.COMPLETED) {
        completedDate = undefined;
    }
    onUpdateRepairTicket({ ...ticket, status: newStatus, completedDate });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const sortedTickets = useMemo(() => {
    return [...repairTickets].sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }, [repairTickets]);
  
  const getStatusBadgeColor = (status: RepairStatus) => {
    switch (status) {
        case RepairStatus.NEW: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case RepairStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case RepairStatus.COMPLETED: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Tiket Perbaikan</h2>
        </div>
        <div className="overflow-x-auto">
          {sortedTickets.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">Belum ada tiket perbaikan.</p>
          ) : (
            <ul className="space-y-4">
              {sortedTickets.map(ticket => (
                  <li key={ticket.id} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{ticket.customerName}</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{ticket.description}</p>
                            {ticket.address && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-start">
                                    <MapPinIcon />
                                    <a 
                                        href={`https://www.google.com/maps?q=${encodeURIComponent(ticket.address)}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="ml-1.5 leading-tight hover:underline hover:text-indigo-500 transition-colors"
                                    >
                                        {ticket.address}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                <span>Diterima: {formatDate(ticket.receivedDate)}</span>
                                {ticket.technician && <span>Teknisi: {ticket.technician}</span>}
                                {ticket.cost && <span>Biaya: {formatCurrency(ticket.cost)}</span>}
                                {ticket.completedDate && <span>Selesai: {formatDate(ticket.completedDate)}</span>}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 self-start sm:self-center">
                            <select value={ticket.status} onChange={(e) => handleStatusChange(ticket, e.target.value as RepairStatus)} className="text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                {Object.values(RepairStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button onClick={() => onSetEditingRepairTicket(ticket)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full transition-colors"><EditIcon /></button>
                            <button onClick={() => handleOpenConfirm(ticket.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full transition-colors"><TrashIcon /></button>
                        </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Tiket"
        message="Apakah Anda yakin ingin menghapus tiket perbaikan ini? Tindakan ini tidak dapat diurungkan."
      />
    </>
  );
};

export default RepairList;