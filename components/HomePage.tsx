import React from 'react';
import CashIcon from './icons/CashIcon';
import UsersIcon from './icons/UsersIcon';
import InvoiceIcon from './icons/InvoiceIcon';
import SettingsIcon from './icons/SettingsIcon';
import ReportIcon from './icons/ReportIcon';
import RepairIcon from './icons/RepairIcon';
import ChatIcon from './icons/ChatIcon';
import { Page } from './Dashboard';
import { DashboardSettings } from '../types';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  dashboardSettings: DashboardSettings;
}

interface MenuCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, dashboardSettings }) => {
  
  const MenuCard: React.FC<MenuCardProps> = ({ icon, title, description, onClick }) => (
      <button 
          onClick={onClick}
          className="w-full text-left p-6 rounded-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent
                     bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-lg
                     border border-white/20 dark:border-slate-700/50 
                     hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-white/50 dark:hover:border-slate-600"
      >
          <div className="flex items-start gap-4">
              <div className="bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 p-3 rounded-lg flex-shrink-0">
                  {icon}
              </div>
              <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
              </div>
          </div>
      </button>
  );

  return (
    <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-sky-400">
                {dashboardSettings.dashboardTitle || 'Dasbor Utama'}
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Pilih salah satu menu di bawah untuk memulai.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <MenuCard
                icon={<CashIcon />}
                title="Manajemen Transaksi"
                description="Catat pemasukan, pengeluaran, dan lihat laporan keuangan."
                onClick={() => onNavigate('transactions')}
            />
            <MenuCard
                icon={<UsersIcon />}
                title="Manajemen Pelanggan"
                description="Kelola data pelanggan dan status pembayaran iuran bulanan."
                onClick={() => onNavigate('customers')}
            />
             <MenuCard
                icon={<ChatIcon />}
                title="Chat Pelanggan"
                description="Kelola chat dan dapatkan saran balasan otomatis dari AI."
                onClick={() => onNavigate('chat')}
            />
            <MenuCard
                icon={<RepairIcon />}
                title="Manajemen Perbaikan"
                description="Kelola tiket perbaikan, jadwal teknisi, dan lacak status."
                onClick={() => onNavigate('repair')}
            />
             <MenuCard
                icon={<ReportIcon />}
                title="Laporan Bulanan"
                description="Rincian transaksi bulanan dan pembagian hasil."
                onClick={() => onNavigate('monthly-report')}
            />
            <MenuCard
                icon={<InvoiceIcon />}
                title="Pembuat Faktur"
                description="Buat dan unduh faktur profesional untuk pelanggan Anda."
                onClick={() => onNavigate('invoice')}
            />
            <MenuCard
                icon={<SettingsIcon />}
                title="Pengaturan Aplikasi"
                description="Sesuaikan profil perusahaan, tema, dan tampilan dasbor."
                onClick={() => onNavigate('settings')}
            />
        </div>
    </div>
  );
};

export default HomePage;