import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, User, Customer, TransactionMode, CompanyProfile, DashboardSettings, SubscriptionType, RepairTicket, RepairStatus, ChatConversation } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import HomePage from './HomePage';
import TransactionPage from './TransactionPage';
import CustomerPage from './CustomerPage';
import InvoicePage from './InvoicePage';
import SettingsPage from './SettingsPage';
import RepairPage from './RepairPage';
import ChatPage from './ChatPage';
import MonthlyReportPage from './MonthlyReportPage';
import LogoutIcon from './icons/LogoutIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { ChartDataPoint } from './Chart';
import { FinancialSummaryData } from './Summary';


interface DashboardProps {
    currentUser: User;
    onLogout: () => void;
}

export type Page = 'home' | 'transactions' | 'customers' | 'invoice' | 'settings' | 'monthly-report' | 'repair' | 'chat';

// Helper to calculate financial summary
const calculateFinancialSummary = (transactions: Transaction[]): FinancialSummaryData => {
    const summary = {
        cash: { income: 0, expense: 0 },
        transfer: { income: 0, expense: 0 },
    };

    transactions.forEach(t => {
        const target = t.mode === TransactionMode.CASH ? summary.cash : summary.transfer;
        if (t.type === TransactionType.INCOME) {
            target.income += t.amount;
        } else {
            target.expense += t.amount;
        }
    });

    const totalIncome = summary.cash.income + summary.transfer.income;
    const totalExpense = summary.cash.expense + summary.transfer.expense;

    return {
        cash: {
            income: summary.cash.income,
            expense: summary.cash.expense,
            balance: summary.cash.income - summary.cash.expense,
        },
        transfer: {
            income: summary.transfer.income,
            expense: summary.transfer.expense,
            balance: summary.transfer.income - summary.transfer.expense,
        },
        total: {
            income: totalIncome,
            expense: totalExpense,
            balance: totalIncome - totalExpense,
        },
    };
};

// Telegram notification logic
const sendTelegramMessage = async (token: string, chatId: string, text: string) => {
    if (!token || !chatId) return;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
            }),
        });
    } catch (error) {
        console.error('Failed to send Telegram message:', error);
    }
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTransactionForTelegram = (
    transaction: Transaction,
    summary: FinancialSummaryData,
    action: 'add' | 'update' | 'delete'
): string => {
    const title = action === 'add' ? '✅ Transaksi Baru Ditambahkan!' : action === 'update' ? '🔄 Transaksi Diperbarui!' : '❌ Transaksi Dihapus!';
    const sign = transaction.type === TransactionType.INCOME ? '+' : '-';

    const message = `
*${title}*

*Deskripsi:* ${transaction.description}
*Jenis:* ${transaction.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran'}
*Jumlah:* \`${sign}${formatCurrency(transaction.amount)}\`
*Metode:* ${transaction.mode === TransactionMode.CASH ? 'Tunai' : 'Transfer'}
*Tanggal:* ${formatDate(transaction.date)}

---

*📊 Ringkasan Saat Ini:*
*Pemasukan:* \`${formatCurrency(summary.total.income)}\`
*Pengeluaran:* \`${formatCurrency(summary.total.expense)}\`
*Saldo Akhir:* \`${formatCurrency(summary.total.balance)}\`
    `;
    return message.trim();
};


const Dashboard: React.FC<DashboardProps> = ({ currentUser, onLogout }) => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [repairTickets, setRepairTickets] = useLocalStorage<RepairTicket[]>('repairTickets', []);
  const [chatConversations, setChatConversations] = useLocalStorage<ChatConversation[]>('chatConversations', []);
  const [companyProfile, setCompanyProfile] = useLocalStorage<CompanyProfile>('companyProfile', {
    name: 'Sirekap DGN',
    address: 'Jalan Digital No. 1, Kota Internet',
    phone: '081234567890',
    email: 'kontak@dgn.com',
    logo: '',
    directorName: 'Nama Direktur Anda',
  });
  const [dashboardSettings, setDashboardSettings] = useLocalStorage<DashboardSettings>('dashboardSettings', {
    showSummary: true,
    showProfitSharing: true,
    showMonthlySummary: true,
    showChart: true,
    showCategoryChart: true,
    theme: 'light',
    loginMarqueeText: 'awali dengan bismilah, akhiri dengan alhamdulilah',
    dashboardTitle: 'Dasbor Utama',
    enableTelegramNotifications: false,
    telegramBotToken: '',
    telegramChatId: '',
  });
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingRepairTicket, setEditingRepairTicket] = useState<RepairTicket | null>(null);

  useEffect(() => {
    if (dashboardSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [dashboardSettings.theme]);

  const notifyOnTransactionChange = (transaction: Transaction, allTransactions: Transaction[], action: 'add' | 'update' | 'delete') => {
      if (
          dashboardSettings.enableTelegramNotifications &&
          dashboardSettings.telegramBotToken &&
          dashboardSettings.telegramChatId
      ) {
          const summary = calculateFinancialSummary(allTransactions);
          const message = formatTransactionForTelegram(transaction, summary, action);
          sendTelegramMessage(dashboardSettings.telegramBotToken, dashboardSettings.telegramChatId, message);
      }
  };


  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: new Date().getTime().toString(),
    };
    const newTransactions = [newTransaction, ...transactions];
    setTransactions(newTransactions);
    notifyOnTransactionChange(newTransaction, newTransactions, 'add');
  };
  
  const updateTransaction = (updatedTransaction: Transaction) => {
    const newTransactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    setTransactions(newTransactions);
    notifyOnTransactionChange(updatedTransaction, newTransactions, 'update');
  };

  const deleteTransaction = (id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (transactionToDelete) {
        const newTransactions = transactions.filter(t => t.id !== id);
        setTransactions(newTransactions);
        notifyOnTransactionChange(transactionToDelete, newTransactions, 'delete');
    }
  };
  
  // Customer Management Logic
  const addCustomer = (customerData: Pick<Customer, 'name' | 'fee' | 'phone' | 'subscriptionType'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: new Date().getTime().toString(),
      paid: false,
    };
    setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
  };
  
  const updateCustomer = (updatedCustomerData: Pick<Customer, 'id' | 'name' | 'fee' | 'phone' | 'subscriptionType'>) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(c => (c.id === updatedCustomerData.id ? { ...c, ...updatedCustomerData } : c))
    );
    setEditingCustomer(null);
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== id));
  };
  
  const markCustomerAsPaid = (id: string, mode: TransactionMode) => {
    setCustomers(prevCustomers => {
      const customerToUpdate = prevCustomers.find(c => c.id === id);
      if (!customerToUpdate || customerToUpdate.paid) return prevCustomers;

      addTransaction({
        description: `Iuran Bulanan - ${customerToUpdate.name}`,
        amount: customerToUpdate.fee,
        type: TransactionType.INCOME,
        category: 'Iuran',
        date: new Date().toISOString().split('T')[0],
        mode: mode,
      });
      
      return prevCustomers.map(customer => {
        if (customer.id === id) {
          return {
            ...customer,
            paid: true,
            lastPaymentDate: new Date().toISOString(),
            lastPaymentMode: mode,
          };
        }
        return customer;
      });
    });
  };
  
  const resetAllPayments = () => {
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => ({
        ...customer,
        paid: false,
        lastPaymentDate: undefined,
        lastPaymentMode: undefined,
      }))
    );
  };

  const handleSetEditingCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
  };
  
  const handleCancelEditCustomer = () => {
    setEditingCustomer(null);
  };

  const addRepairTicket = (ticketData: Omit<RepairTicket, 'id' | 'receivedDate' | 'status' | 'completedDate'>) => {
    const newTicket: RepairTicket = {
      ...ticketData,
      id: new Date().getTime().toString(),
      receivedDate: new Date().toISOString().split('T')[0],
      status: RepairStatus.NEW,
    };
    setRepairTickets(prev => [newTicket, ...prev]);
  };

  const updateRepairTicket = (updatedTicket: RepairTicket) => {
    setRepairTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setEditingRepairTicket(null);
  };

  const deleteRepairTicket = (id: string) => {
    setRepairTickets(prev => prev.filter(t => t.id !== id));
  };

  const handleSetEditingRepairTicket = (ticket: RepairTicket) => {
    setEditingRepairTicket(ticket);
  };

  const handleCancelEditRepairTicket = () => {
    setEditingRepairTicket(null);
  };

  // Customer Chat Logic
  const updateChatConversation = (conversation: ChatConversation) => {
    setChatConversations(prev => {
        const index = prev.findIndex(c => c.id === conversation.id);
        const updatedConversation = { ...conversation, lastUpdate: new Date().toISOString() };
        if (index > -1) {
            const newConversations = [...prev];
            newConversations[index] = updatedConversation;
            return newConversations;
        }
        return [updatedConversation, ...prev];
    });
  };

  const deleteChatConversation = (id: string) => {
      setChatConversations(prev => prev.filter(c => c.id !== id));
  };


  const financialSummary = useMemo(() => calculateFinancialSummary(transactions), [transactions]);


  const chartData = useMemo<ChartDataPoint[]>(() => {
    const aggregated: { [key: string]: { income: number; expense: number } } = {};

    [...transactions].forEach(t => {
        if (!aggregated[t.date]) {
            aggregated[t.date] = { income: 0, expense: 0 };
        }
        if (t.type === TransactionType.INCOME) {
            aggregated[t.date].income += t.amount;
        } else {
            aggregated[t.date].expense += t.amount;
        }
    });

    const sortedAggregatedData = Object.keys(aggregated)
        .map(date => ({
            date,
            income: aggregated[date].income,
            expense: aggregated[date].expense,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedAggregatedData.slice(-30);
  }, [transactions]);
  
  const pageTitles: Record<Page, string> = {
      home: 'Catat dan kelola keuangan Anda dengan mudah.',
      transactions: 'Manajemen Keuangan & Transaksi',
      customers: 'Manajemen Data Pelanggan',
      invoice: 'Buat Faktur Profesional',
      settings: 'Pengaturan & Kustomisasi Aplikasi',
      'monthly-report': 'Laporan Keuangan Bulanan & Bagi Hasil',
      'repair': 'Manajemen Tiket & Layanan Perbaikan',
      'chat': 'Chat Pelanggan dengan Bantuan AI',
  };

  const renderPage = () => {
    switch(currentPage) {
        case 'transactions':
            return <TransactionPage 
                transactions={transactions}
                financialSummary={financialSummary}
                chartData={chartData}
                dashboardSettings={dashboardSettings}
                onAddTransaction={addTransaction}
                onUpdateTransaction={updateTransaction}
                onDeleteTransaction={deleteTransaction}
            />;
        case 'customers':
            return <CustomerPage 
                customers={customers}
                editingCustomer={editingCustomer}
                companyProfile={companyProfile}
                onAddCustomer={addCustomer}
                onUpdateCustomer={updateCustomer}
                onCancelEdit={handleCancelEditCustomer}
                onDeleteCustomer={deleteCustomer}
                onSetEditingCustomer={handleSetEditingCustomer}
                onMarkAsPaid={markCustomerAsPaid}
                onResetAllPayments={resetAllPayments}
            />;
        case 'repair':
            return <RepairPage
                repairTickets={repairTickets}
                editingRepairTicket={editingRepairTicket}
                onAddRepairTicket={addRepairTicket}
                onUpdateRepairTicket={updateRepairTicket}
                onCancelEdit={handleCancelEditRepairTicket}
                onDeleteRepairTicket={deleteRepairTicket}
                onSetEditingRepairTicket={handleSetEditingRepairTicket}
            />;
        case 'chat':
            return <ChatPage 
                conversations={chatConversations}
                customers={customers}
                companyProfile={companyProfile}
                onUpdateConversation={updateChatConversation}
                onDeleteConversation={deleteChatConversation}
            />;
        case 'invoice':
            return <InvoicePage customers={customers} companyProfile={companyProfile} />;
        case 'settings':
            return <SettingsPage 
                profile={companyProfile}
                onUpdateProfile={setCompanyProfile}
                dashboardSettings={dashboardSettings}
                onUpdateDashboardSettings={setDashboardSettings}
            />;
        case 'monthly-report':
            return <MonthlyReportPage transactions={transactions} companyProfile={companyProfile} />;
        case 'home':
        default:
            return <HomePage onNavigate={setCurrentPage} dashboardSettings={dashboardSettings} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 font-sans">
      <header className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap justify-between items-center gap-y-4 gap-x-6">
                <div className="flex items-center gap-4">
                    {currentPage !== 'home' && (
                        <button
                            onClick={() => setCurrentPage('home')}
                            className="flex-shrink-0 flex items-center gap-2 bg-indigo-500/80 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-colors duration-200"
                            aria-label="Kembali"
                        >
                            <ArrowLeftIcon />
                            <span className="hidden sm:inline">Kembali</span>
                        </button>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {companyProfile.logo && (
                             <img src={companyProfile.logo} alt="Logo Perusahaan" className="h-8 sm:h-10 w-auto rounded-md object-contain flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{companyProfile.name || 'Sirekap DGN'}</h1>
                            <p className="text-xs sm:text-sm text-indigo-200 dark:text-indigo-300 mt-1 truncate">{pageTitles[currentPage]}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <span className="text-sm font-medium text-right">
                        Selamat datang,<br/>
                        <span className="font-bold text-base">{currentUser.username}</span>
                    </span>
                    <button 
                        onClick={onLogout}
                        className="flex-shrink-0 flex items-center gap-2 bg-indigo-500/80 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-colors duration-200"
                        aria-label="Keluar"
                    >
                        <LogoutIcon />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
      <footer className="text-center py-8 mt-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} {companyProfile.name || 'Sirekap Damar Global Network'}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;