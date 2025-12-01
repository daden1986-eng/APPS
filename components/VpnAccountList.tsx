import React, { useState, useMemo } from 'react';
import { VpnAccount, Customer } from '../types';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import ConfirmDialog from './ConfirmDialog';

interface VpnAccountListProps {
  vpnAccounts: VpnAccount[];
  customers: Customer[];
  onDeleteVpnAccount: (id: string) => void;
  onSetEditingVpnAccount: (account: VpnAccount) => void;
}

const VpnAccountList: React.FC<VpnAccountListProps> = ({ vpnAccounts, customers, onDeleteVpnAccount, onSetEditingVpnAccount }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copyStatus, setCopyStatus] = useState<{ id: string; copied: boolean } | null>(null);
  
  const customerMap = useMemo(() => {
    return new Map(customers.map(c => [c.id, c.name]));
  }, [customers]);

  const handleOpenConfirm = (id: string) => {
    setAccountToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setAccountToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      onDeleteVpnAccount(accountToDelete);
    }
    handleCloseConfirm();
  };

  const handleCopyToClipboard = (account: VpnAccount) => {
    const details = `
--- Detail Akun VPN ---
Server: ${account.server}
Username: ${account.username}
Password: ${account.password}
Protokol: ${account.protocol}
Kadaluarsa: ${formatDate(account.expiryDate)}
    `.trim();
    navigator.clipboard.writeText(details);
    setCopyStatus({ id: account.id, copied: true });
    setTimeout(() => setCopyStatus(null), 2000);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const filteredAccounts = useMemo(() => {
    return vpnAccounts.filter(acc => 
      acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.server.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.customerId && customerMap.get(acc.customerId)?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  }, [vpnAccounts, searchTerm, customerMap]);

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Akun VPN</h2>
          <input
            type="text"
            placeholder="Cari username, server, atau pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="overflow-x-auto">
          {filteredAccounts.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              {searchTerm ? 'Tidak ada akun VPN yang cocok.' : 'Belum ada akun VPN.'}
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredAccounts.map(account => {
                const isExpired = new Date(account.expiryDate) < new Date();
                const expiryDate = new Date(account.expiryDate);
                const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const isExpiringSoon = !isExpired && daysLeft <= 7;

                return (
                  <li key={account.id} className={`p-4 rounded-lg border ${isExpired ? 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800/60' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{account.username}</p>
                                {account.customerId && (
                                    <span className="text-xs font-medium text-indigo-700 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-900 px-2 py-0.5 rounded-full">{customerMap.get(account.customerId)}</span>
                                )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                <p>Server: <span className="font-medium">{account.server}</span></p>
                                <p>Protokol: <span className="font-medium">{account.protocol}</span></p>
                            </div>
                            <div className={`text-sm font-medium mt-2 ${isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {isExpired ? `Kadaluarsa pada ${formatDate(account.expiryDate)}` : `Aktif hingga ${formatDate(account.expiryDate)} (${daysLeft} hari lagi)`}
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 self-start sm:self-center">
                            <button onClick={() => handleCopyToClipboard(account)} className="flex items-center gap-2 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold py-2 px-3 rounded-md transition-colors text-sm">
                                <ClipboardIcon /> {copyStatus?.id === account.id ? 'Disalin!' : 'Salin'}
                            </button>
                            <button onClick={() => onSetEditingVpnAccount(account)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full transition-colors"><EditIcon /></button>
                            <button onClick={() => handleOpenConfirm(account.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 p-2 rounded-full transition-colors"><TrashIcon /></button>
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
        title="Konfirmasi Hapus Akun"
        message="Apakah Anda yakin ingin menghapus akun VPN ini? Tindakan ini tidak dapat diurungkan."
      />
    </>
  );
};

export default VpnAccountList;
