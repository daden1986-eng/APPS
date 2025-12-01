



import React, { useState, useMemo } from 'react';
import { Customer, SubscriptionType, TransactionMode, CompanyProfile } from '../types';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import ConfirmDialog from './ConfirmDialog';
import TransactionCashIcon from './icons/TransactionCashIcon';
import TransactionTransferIcon from './icons/TransactionTransferIcon';
import WhatsappIcon from './icons/WhatsappIcon';
import BillingMessageModal from './BillingMessageModal';


interface CustomerListProps {
  customers: Customer[];
  companyProfile: CompanyProfile;
  onDeleteCustomer: (id: string) => void;
  onSetEditingCustomer: (customer: Customer) => void;
  onMarkAsPaid: (id: string, mode: TransactionMode) => void;
  onResetAllPayments: () => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, companyProfile, onDeleteCustomer, onSetEditingCustomer, onMarkAsPaid, onResetAllPayments }) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [openPaymentMenu, setOpenPaymentMenu] = useState<string | null>(null);


  const handleOpenDeleteConfirm = (id: string) => {
    setCustomerToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setCustomerToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      onDeleteCustomer(customerToDelete);
    }
    handleCloseDeleteConfirm();
  };

  const handleOpenResetConfirm = () => {
    setIsResetConfirmOpen(true);
  };

  const handleCloseResetConfirm = () => {
    setIsResetConfirmOpen(false);
  };

  const handleConfirmReset = () => {
    onResetAllPayments();
    handleCloseResetConfirm();
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

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const summary = useMemo(() => {
    const paidCustomers = customers.filter(c => c.paid);
    const totalCollected = paidCustomers.reduce((acc, customer) => acc + customer.fee, 0);
    const totalExpected = customers.reduce((acc, customer) => acc + customer.fee, 0);
    
    const typeCounts = {
        [SubscriptionType.PPPOE]: 0,
        [SubscriptionType.STATIC]: 0,
        [SubscriptionType.HOTSPOT]: 0,
        [SubscriptionType.MITRA_VOUCHER]: 0,
    };

    customers.forEach(customer => {
        if (customer.subscriptionType && typeCounts.hasOwnProperty(customer.subscriptionType)) {
            typeCounts[customer.subscriptionType]++;
        }
    });

    return {
      paidCount: paidCustomers.length,
      unpaidCount: customers.length - paidCustomers.length,
      totalCollected,
      totalExpected,
      typeCounts,
    };
  }, [customers]);
  
  const getSubscriptionTypeBadgeColor = (type?: SubscriptionType) => {
    switch (type) {
        case SubscriptionType.PPPOE: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case SubscriptionType.STATIC: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case SubscriptionType.HOTSPOT: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case SubscriptionType.MITRA_VOUCHER: return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const SummaryCard: React.FC<{ title: string; value: string | number; colorClass?: string }> = ({ title, value, colorClass = 'text-gray-800 dark:text-gray-100' }) => (
    <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-lg text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={title}>{title}</p>
        <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    </div>
  );

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Ringkasan Pembayaran</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard title="Sudah Bayar" value={summary.paidCount} colorClass="text-green-600 dark:text-green-400" />
            <SummaryCard title="Belum Bayar" value={summary.unpaidCount} colorClass="text-red-600 dark:text-red-400" />
            <SummaryCard title="Terkumpul" value={formatCurrency(summary.totalCollected)} colorClass="text-indigo-600 dark:text-indigo-400" />
            <SummaryCard title="Total Iuran" value={formatCurrency(summary.totalExpected)} />
        </div>

        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-t dark:border-gray-700 pt-5">Jumlah Pelanggan per Tipe</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(summary.typeCounts).map(([type, count]) => (
                <SummaryCard key={type} title={type} value={count} />
            ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-t dark:border-gray-700 pt-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Pelanggan</h2>
          {customers.length > 0 && (
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsBillingModalOpen(true)}
                    disabled={summary.unpaidCount === 0}
                    className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-px disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    <WhatsappIcon />
                    Kirim Tagihan WA
                </button>
                <button 
                    onClick={handleOpenResetConfirm}
                    className="bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 text-sm"
                >
                    Reset Status
                </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          {sortedCustomers.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">Belum ada pelanggan.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedCustomers.map(customer => (
                  <li key={customer.id} className={`py-3 transition-colors rounded-lg px-2 -mx-2 ${customer.paid ? 'bg-green-50 dark:bg-green-900/40' : 'hover:bg-sky-100 dark:hover:bg-sky-900/50'}`}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                                {customer.paid ? (
                                    <div className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white" title="Lunas">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenPaymentMenu(openPaymentMenu === customer.id ? null : customer.id)}
                                            className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500 hover:border-indigo-600 focus:ring-indigo-500 focus:outline-none focus:ring-1 focus:ring-offset-1 transition"
                                            aria-label={`Tandai ${customer.name} lunas`}
                                        ></button>
                                        {openPaymentMenu === customer.id && (
                                            <div 
                                                className="absolute z-10 -left-2 mt-2 w-40 origin-top-left rounded-md bg-white dark:bg-slate-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                                onMouseLeave={() => setOpenPaymentMenu(null)}
                                            >
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => {
                                                            onMarkAsPaid(customer.id, TransactionMode.TRANSFER);
                                                            setOpenPaymentMenu(null);
                                                        }}
                                                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                                                    >
                                                        <TransactionTransferIcon /> Via Transfer
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            onMarkAsPaid(customer.id, TransactionMode.CASH);
                                                            setOpenPaymentMenu(null);
                                                        }}
                                                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                                                    >
                                                        <TransactionCashIcon /> Via Tunai
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-gray-800 dark:text-gray-100 truncate ${customer.paid ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{customer.name}</p>
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {customer.subscriptionType && (
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getSubscriptionTypeBadgeColor(customer.subscriptionType)}`}>
                                            {customer.subscriptionType}
                                        </span>
                                    )}
                                    <span>Iuran: {formatCurrency(customer.fee)}</span>
                                    {customer.phone && (
                                        <>
                                        <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">&bull;</span>
                                        <span>{customer.phone}</span>
                                        </>
                                    )}
                                </div>
                                {customer.paid && customer.lastPaymentDate && (
                                    <div className="flex items-center gap-2 text-xs text-green-700 font-medium mt-1">
                                      <span>Lunas pada: {formatDate(customer.lastPaymentDate)}</span>
                                      <span className="text-green-300">&bull;</span>
                                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                          customer.lastPaymentMode === TransactionMode.CASH
                                          ? 'bg-green-200 text-green-900'
                                          : 'bg-blue-200 text-blue-900'
                                      }`}>
                                          {customer.lastPaymentMode === TransactionMode.CASH ? 'Tunai' : 'Transfer'}
                                      </span>
                                  </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 self-end sm:self-auto">
                        <button
                            onClick={() => onSetEditingCustomer(customer)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-2 transition-colors duration-200"
                            aria-label={`Edit ${customer.name}`}
                        >
                            <EditIcon />
                        </button>
                        <button
                            onClick={() => handleOpenDeleteConfirm(customer.id)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-2 transition-colors duration-200"
                            aria-label={`Hapus ${customer.name}`}
                        >
                            <TrashIcon />
                        </button>
                        </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Pelanggan"
        message="Apakah Anda yakin ingin menghapus pelanggan ini? Tindakan ini tidak dapat diurungkan."
      />
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={handleCloseResetConfirm}
        onConfirm={handleConfirmReset}
        title="Konfirmasi Reset Pembayaran"
        message="Apakah Anda yakin ingin mereset status pembayaran semua pelanggan menjadi 'Belum Bayar'? Ini biasanya dilakukan di awal periode baru."
      />
      <BillingMessageModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        customers={customers}
        companyProfile={companyProfile}
      />
    </>
  );
};

export default CustomerList;