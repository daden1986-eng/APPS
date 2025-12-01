import React, { useState, useMemo, useEffect } from 'react';
// FIX: Imported all necessary types including VpnAccount.
import { Transaction, TransactionType, User, Customer, TransactionMode, CompanyProfile, DashboardSettings, SubscriptionType, RepairTicket, RepairStatus, ChatConversation, VpnAccount, VpnProtocol } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import HomePage from './HomePage';
import TransactionPage from './TransactionPage';
import CustomerPage from './CustomerPage';
import InvoicePage from './InvoicePage';
import SettingsPage from './SettingsPage';
import RepairPage from './RepairPage';
import ChatPage from './ChatPage';
import MonthlyReportPage from './MonthlyReportPage';
// FIX: Imported VpnPage component to be used.
import VpnPage from './VpnPage';
import LogoutIcon from './icons/LogoutIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { ChartDataPoint } from './Chart';
import { FinancialSummaryData } from './Summary';

declare const gapi: any;
declare const google: any;

interface DashboardProps {
    currentUser: User;
    onLogout: () => void;
}

// FIX: Added 'vpn' to the Page type to enable navigation to the VPN management page.
export type Page = 'home' | 'transactions' | 'customers' | 'invoice' | 'settings' | 'monthly-report' | 'repair' | 'chat' | 'vpn';

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
  // FIX: Added state management for VPN accounts.
  const [vpnAccounts, setVpnAccounts] = useLocalStorage<VpnAccount[]>('vpnAccounts', []);
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
    googleClientId: '',
    googleSheetId: '',
  });
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingRepairTicket, setEditingRepairTicket] = useState<RepairTicket | null>(null);
  // FIX: Added state for editing a VPN account.
  const [editingVpnAccount, setEditingVpnAccount] = useState<VpnAccount | null>(null);

  // --- Google Integration State ---
  const [googleToken, setGoogleToken] = useLocalStorage<any>('googleToken', null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [lastBackup, setLastBackup] = useLocalStorage<string | null>('lastBackupTimestamp', null);
  const [syncStatus, setSyncStatus] = useState({ state: 'idle', message: '' });

  // --- Google API Initialization ---
  useEffect(() => {
    // Load GAPI client library
    if (typeof gapi !== 'undefined') {
        gapi.load('client', () => {
            // Initialize the client
            gapi.client.init({}).then(() => {
                // Load Drive and Sheets APIs after client initialization
                return Promise.all([
                    gapi.client.load('drive', 'v3'),
                    gapi.client.load('sheets', 'v4')
                ]);
            }).then(() => {
                setIsGapiLoaded(true);
            }).catch((e: any) => {
                 console.error("Error initializing GAPI client or loading APIs", e);
            });
        });
    }
  }, []); // Run only once on mount

  useEffect(() => {
    // When GAPI is loaded and token exists, set the token
    if (isGapiLoaded && googleToken && typeof gapi !== 'undefined' && gapi.client) {
        gapi.client.setToken(googleToken);
    }
  }, [googleToken, isGapiLoaded]);


  useEffect(() => {
    if (dashboardSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [dashboardSettings.theme]);

  // --- Google API Handlers ---
  const handleGoogleSignIn = () => {
    if (!dashboardSettings.googleClientId) {
      alert('Harap masukkan Google Client ID di pengaturan terlebih dahulu.');
      return;
    }
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: dashboardSettings.googleClientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          setGoogleToken(tokenResponse);
          gapi.client.setToken(tokenResponse);
        }
      },
    });
    tokenClient.requestAccessToken();
  };

  const handleGoogleSignOut = () => {
    if (googleToken) {
      google.accounts.oauth2.revoke(googleToken.access_token, () => {});
      setGoogleToken(null);
      gapi.client.setToken(null);
    }
  };

  const getBackupFileId = async (): Promise<string | null> => {
    const response = await gapi.client.drive.files.list({
      q: "name='sirekap_dgn_backup.json' and 'root' in parents and trashed=false",
      fields: 'files(id, name)',
    });
    return response.result.files.length > 0 ? response.result.files[0].id : null;
  };
  
  const handleBackupToDrive = async () => {
    setSyncStatus({ state: 'loading', message: 'Membuat cadangan data...' });
    try {
      const backupData = JSON.stringify({
        transactions, customers, repairTickets, chatConversations, vpnAccounts, companyProfile, dashboardSettings,
      });
      const blob = new Blob([backupData], { type: 'application/json' });
      const fileId = await getBackupFileId();

      const response = await fetch(
        fileId
          ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`
          : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media',
        {
          method: fileId ? 'PATCH' : 'POST',
          headers: new Headers({ Authorization: `Bearer ${googleToken.access_token}` }),
          body: blob,
        }
      );
      
      const file = await response.json();
      if (!fileId) { // If creating a new file, update its metadata to set the name
          await gapi.client.drive.files.update({
              fileId: file.id,
              resource: { name: 'sirekap_dgn_backup.json' },
          });
      }

      setLastBackup(new Date().toISOString());
      setSyncStatus({ state: 'success', message: 'Pencadangan berhasil!' });
    } catch (error) {
      console.error('Backup error:', error);
      setSyncStatus({ state: 'error', message: 'Pencadangan gagal.' });
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!window.confirm("Apakah Anda yakin? Ini akan menimpa semua data lokal Anda saat ini dengan data dari Google Drive.")) return;

    setSyncStatus({ state: 'loading', message: 'Memulihkan data...' });
    try {
      const fileId = await getBackupFileId();
      if (!fileId) {
        setSyncStatus({ state: 'error', message: 'File cadangan tidak ditemukan.' });
        return;
      }
      const response = await gapi.client.drive.files.get({ fileId, alt: 'media' });
      const data = JSON.parse(response.body);

      // Restore data
      setTransactions(data.transactions || []);
      setCustomers(data.customers || []);
      setRepairTickets(data.repairTickets || []);
      setChatConversations(data.chatConversations || []);
      setVpnAccounts(data.vpnAccounts || []);
      setCompanyProfile(data.companyProfile);
      setDashboardSettings(data.dashboardSettings);

      setSyncStatus({ state: 'success', message: 'Pemulihan berhasil!' });
      // Force reload to ensure all components re-render with new data
      window.location.reload();
    } catch (error) {
      console.error('Restore error:', error);
      setSyncStatus({ state: 'error', message: 'Pemulihan gagal.' });
    }
  };

  const handleSyncToSheets = async () => {
    if (!dashboardSettings.googleSheetId) {
      alert("Harap masukkan ID Google Sheet di pengaturan.");
      return;
    }
    setSyncStatus({ state: 'loading', message: 'Menyinkronkan ke Google Sheets...' });
    try {
      const sheetName = 'Pelanggan';
      const range = `${sheetName}!A:G`;
      const spreadsheetId = dashboardSettings.googleSheetId;

      await gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId, range });

      const values = [
          ['ID Pelanggan', 'Nama', 'Telepon', 'Iuran', 'Status Bayar', 'Tgl Bayar Terakhir', 'Tipe Langganan'],
          ...customers.map(c => [
              c.id, c.name, c.phone || '', c.fee, c.paid ? 'Lunas' : 'Belum Bayar', 
              c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('id-ID') : '', c.subscriptionType || ''
          ])
      ];

      await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          resource: { values },
      });
      setSyncStatus({ state: 'success', message: 'Sinkronisasi berhasil!' });
    } catch (error) {
      console.error('Sheets sync error:', error);
      setSyncStatus({ state: 'error', message: `Sinkronisasi gagal. Pastikan ID Sheet benar dan Anda memiliki izin.` });
    }
  };


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

  // FIX: Added VPN Account Management Logic.
  const addVpnAccount = (accountData: Omit<VpnAccount, 'id' | 'creationDate'>) => {
    const newAccount: VpnAccount = {
      ...accountData,
      id: new Date().getTime().toString(),
      creationDate: new Date().toISOString().split('T')[0],
    };
    setVpnAccounts(prev => [newAccount, ...prev]);
  };

  const updateVpnAccount = (updatedAccount: VpnAccount) => {
      setVpnAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
      setEditingVpnAccount(null);
  };

  const deleteVpnAccount = (id: string) => {
      setVpnAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const handleSetEditingVpnAccount = (account: VpnAccount) => {
      setEditingVpnAccount(account);
  };

  const handleCancelEditVpnAccount = () => {
      setEditingVpnAccount(null);
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
      'vpn': 'Manajemen Akun VPN Pelanggan',
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
        // FIX: Added case to render VpnPage and pass necessary props.
        case 'vpn':
            return <VpnPage
                vpnAccounts={vpnAccounts}
                customers={customers}
                editingVpnAccount={editingVpnAccount}
                onAddVpnAccount={addVpnAccount}
                onUpdateVpnAccount={updateVpnAccount}
                onCancelEdit={handleCancelEditVpnAccount}
                onDeleteVpnAccount={deleteVpnAccount}
                onSetEditingVpnAccount={handleSetEditingVpnAccount}
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
                // Google Integration Props
                isGapiLoaded={isGapiLoaded}
                googleToken={googleToken}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                onBackup={handleBackupToDrive}
                onRestore={handleRestoreFromDrive}
                onSyncSheets={handleSyncToSheets}
                lastBackup={lastBackup}
                syncStatus={syncStatus}
                onClearSyncStatus={() => setSyncStatus({ state: 'idle', message: ''})}
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