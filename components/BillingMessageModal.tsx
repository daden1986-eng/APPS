import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, CompanyProfile } from '../types';
import WhatsappIcon from './icons/WhatsappIcon';

interface BillingMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  companyProfile: CompanyProfile;
}

const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

const defaultMessageTemplate = `Yth. Bpk/Ibu {nama_pelanggan},

Kami dari *{nama_perusahaan}* ingin memberitahukan bahwa tagihan internet Anda untuk bulan *{bulan_tagihan}* sebesar *{jumlah_tagihan}* telah jatuh tempo.

Mohon untuk segera melakukan pembayaran agar layanan Anda tidak terganggu.

Terima kasih.`;

const BillingMessageModal: React.FC<BillingMessageModalProps> = ({ isOpen, onClose, customers, companyProfile }) => {
    const unpaidCustomers = useMemo(() => customers.filter(c => !c.paid && c.phone), [customers]);
    
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
    const [messageTemplate, setMessageTemplate] = useState(defaultMessageTemplate);
    const [billingMonth, setBillingMonth] = useState(new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Select all unpaid customers by default when modal opens
            setSelectedCustomerIds(new Set(unpaidCustomers.map(c => c.id)));
        }
    }, [isOpen, unpaidCustomers]);

    const handleSelectAll = () => setSelectedCustomerIds(new Set(unpaidCustomers.map(c => c.id)));
    const handleDeselectAll = () => setSelectedCustomerIds(new Set());
    const handleToggleCustomer = (id: string) => {
        const newSelection = new Set(selectedCustomerIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedCustomerIds(newSelection);
    };

    const handleSendMessages = async () => {
        setIsSending(true);
        const selectedCustomers = unpaidCustomers.filter(c => selectedCustomerIds.has(c.id));

        for (const customer of selectedCustomers) {
            const phoneNumber = formatPhoneNumber(customer.phone!);
            let message = messageTemplate
                .replace(/{nama_pelanggan}/g, customer.name)
                .replace(/{nama_perusahaan}/g, companyProfile.name)
                .replace(/{jumlah_tagihan}/g, formatCurrency(customer.fee))
                .replace(/{bulan_tagihan}/g, billingMonth);
            
            const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            // Add a small delay between opening each link to avoid potential browser popup blocking
            await new Promise(resolve => setTimeout(resolve, 500)); 
        }

        setIsSending(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-gray-50 dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl m-4 max-h-[90vh] flex flex-col"
                    >
                        <div className="sticky top-0 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Kirim Tagihan WhatsApp</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-grow space-y-6">
                            {unpaidCustomers.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-12">Tidak ada pelanggan yang belum bayar dengan nomor telepon.</p>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">1. Pilih Pelanggan ({selectedCustomerIds.size}/{unpaidCustomers.length})</h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <button onClick={handleSelectAll} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Pilih Semua</button>
                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                            <button onClick={handleDeselectAll} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Batal Pilih Semua</button>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {unpaidCustomers.map(customer => (
                                                <label key={customer.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer">
                                                    <input type="checkbox" checked={selectedCustomerIds.has(customer.id)} onChange={() => handleToggleCustomer(customer.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                                                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{customer.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="billingMonth" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">2. Bulan Penagihan</label>
                                        <input type="text" id="billingMonth" value={billingMonth} onChange={e => setBillingMonth(e.target.value)} className="w-full sm:w-1/2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">3. Template Pesan</h3>
                                        <textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} rows={8} className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm"></textarea>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Placeholder yang tersedia: <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded-sm">{'{nama_pelanggan}'}</code>, <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded-sm">{'{jumlah_tagihan}'}</code>, <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded-sm">{'{bulan_tagihan}'}</code>, <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded-sm">{'{nama_perusahaan}'}</code>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-800/90 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">Batal</button>
                            <button 
                                onClick={handleSendMessages}
                                disabled={isSending || selectedCustomerIds.size === 0}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSending ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <WhatsappIcon />
                                        Kirim {selectedCustomerIds.size > 0 ? `(${selectedCustomerIds.size})` : ''} Pesan
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BillingMessageModal;