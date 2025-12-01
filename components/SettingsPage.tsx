import React, { useState, useEffect, useMemo } from 'react';
import { CompanyProfile, DashboardSettings } from '../types';
import CameraIcon from './icons/CameraIcon';
import TrashIcon from './icons/TrashIcon';
import TelegramIcon from './icons/TelegramIcon';

interface SettingsPageProps {
  profile: CompanyProfile;
  onUpdateProfile: (profile: CompanyProfile) => void;
  dashboardSettings: DashboardSettings;
  onUpdateDashboardSettings: (settings: DashboardSettings) => void;
}

const sendTelegramMessage = async (token: string, chatId: string, text: string): Promise<{ success: boolean; message: string }> => {
    if (!token || !chatId) {
        return { success: false, message: 'Token Bot atau Chat ID tidak lengkap.' };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
            }),
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, message: 'Pesan berhasil dikirim.' };
        } else {
            console.error('Telegram API Error:', data);
            return { success: false, message: `Gagal mengirim pesan: ${data.description || 'Error tidak diketahui'}` };
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        return { success: false, message: 'Gagal menghubungi API Telegram. Periksa koneksi internet Anda.' };
    }
};

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-700 p-3 rounded-lg">
        <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                aria-hidden="true"
                className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            ></span>
        </button>
    </div>
);


const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  const { profile, onUpdateProfile, dashboardSettings, onUpdateDashboardSettings } = props;
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [telegramSettings, setTelegramSettings] = useState({
      token: dashboardSettings.telegramBotToken || '',
      chatId: dashboardSettings.telegramChatId || '',
  });
  const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  useEffect(() => {
    setFormData(profile);
  }, [profile]);
  
  const wordCount = useMemo(() => {
    return (dashboardSettings.loginMarqueeText || '').trim().split(/\s+/).filter(Boolean).length;
  }, [dashboardSettings.loginMarqueeText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB size limit
            alert('Ukuran logo tidak boleh melebihi 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({...prev, logo: reader.result as string }));
        };
        reader.readAsDataURL(file);
    } else {
        alert('Harap pilih file gambar yang valid (JPEG, PNG, dll.).');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
  };
  
  const handleDashboardSettingChange = (key: keyof DashboardSettings, value: any) => {
    onUpdateDashboardSettings({ ...dashboardSettings, [key]: value });
  };
  
  const handleTelegramInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTelegramSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAndTestTelegram = async () => {
    setTestStatus({ status: 'loading', message: 'Menyimpan & mengirim pesan tes...' });
    
    onUpdateDashboardSettings({
        ...dashboardSettings,
        telegramBotToken: telegramSettings.token,
        telegramChatId: telegramSettings.chatId,
    });
    
    const result = await sendTelegramMessage(telegramSettings.token, telegramSettings.chatId, '✅ Koneksi Berhasil! Notifikasi Sirekap DGN akan dikirim di sini.');
    
    if (result.success) {
        setTestStatus({ status: 'success', message: 'Koneksi berhasil! Pesan tes telah dikirim.' });
    } else {
        setTestStatus({ status: 'error', message: `Gagal: ${result.message}` });
    }
    setTimeout(() => setTestStatus({ status: 'idle', message: '' }), 5000);
  };


  const handleMarqueeTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 20) {
          handleDashboardSettingChange('loginMarqueeText', text);
      }
  };
  
  const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Company Profile Section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Pengaturan Perusahaan</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Informasi ini akan digunakan pada dokumen seperti faktur.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nama Perusahaan</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nomor Telepon</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Alamat</label>
              <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className={inputClasses} required />
            </div>
          </div>
          
           <div>
              <label htmlFor="directorName" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nama Direktur</label>
              <input type="text" id="directorName" name="directorName" value={formData.directorName || ''} onChange={handleInputChange} className={`${inputClasses} mt-1`} placeholder="Nama lengkap untuk ttd laporan"/>
            </div>

          <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Logo Perusahaan</label>
              {formData.logo ? (
                  <div className="mt-2 relative group w-48 h-24 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <img src={formData.logo} alt="Logo Perusahaan" className="max-w-full max-h-full object-contain p-2" />
                      <button 
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, logo: ''}))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Hapus logo"
                      >
                          <TrashIcon />
                      </button>
                  </div>
              ) : (
                  <label className="mt-1 flex justify-center w-full px-3 py-4 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <span className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <CameraIcon />
                          <span>Unggah Logo</span>
                      </span>
                      <input type="file" id="logo" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" />
                  </label>
              )}
               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rekomendasi ukuran: 300x150px. Maks 2MB.</p>
          </div>

          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            {isSaved && <span className="text-green-600 font-semibold self-center mr-4">Tersimpan!</span>}
            <button type="submit" className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-2.5 px-6 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Simpan Profil
            </button>
          </div>
        </form>
      </div>

      {/* Application Settings Section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Pengaturan Aplikasi</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Ubah tampilan dan fungsionalitas aplikasi.</p>

        <div className="space-y-6">
            <div>
              <label htmlFor="dashboardTitle" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Judul Dasbor Utama</label>
              <input 
                  type="text" 
                  id="dashboardTitle" 
                  value={dashboardSettings.dashboardTitle} 
                  onChange={(e) => handleDashboardSettingChange('dashboardTitle', e.target.value)} 
                  className={inputClasses} 
                  placeholder="cth: Halaman Utama"
              />
            </div>
            <div>
                <label htmlFor="loginMarqueeText" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Teks Berjalan di Halaman Login</label>
                 <textarea 
                    id="loginMarqueeText" 
                    value={dashboardSettings.loginMarqueeText} 
                    onChange={handleMarqueeTextChange}
                    className={`${inputClasses} h-20`}
                    placeholder="Teks motivasi atau pengumuman singkat..."
                />
                <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">{wordCount}/20 kata</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tema Aplikasi</label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                    <button type="button" onClick={() => handleDashboardSettingChange('theme', 'light')} className={`w-full p-2.5 rounded-lg text-center font-semibold transition-all ${dashboardSettings.theme === 'light' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 dark:text-gray-200'}`}>Terang</button>
                    <button type="button" onClick={() => handleDashboardSettingChange('theme', 'dark')} className={`w-full p-2.5 rounded-lg text-center font-semibold transition-all ${dashboardSettings.theme === 'dark' ? 'bg-slate-700 shadow text-white' : 'text-gray-600 dark:text-gray-200'}`}>Gelap</button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Tampilkan Modul di Halaman Transaksi</h3>
                <div className="space-y-3">
                    <Toggle label="Ringkasan Keuangan" enabled={dashboardSettings.showSummary} onChange={(val) => handleDashboardSettingChange('showSummary', val)} />
                    <Toggle label="Grafik Tren Keuangan" enabled={dashboardSettings.showChart} onChange={(val) => handleDashboardSettingChange('showChart', val)} />
                    <Toggle label="Grafik Kategori Pengeluaran" enabled={dashboardSettings.showCategoryChart} onChange={(val) => handleDashboardSettingChange('showCategoryChart', val)} />
                    <Toggle label="Ringkasan Bulanan" enabled={dashboardSettings.showMonthlySummary} onChange={(val) => handleDashboardSettingChange('showMonthlySummary', val)} />
                    <Toggle label="Kalkulator Bagi Hasil" enabled={dashboardSettings.showProfitSharing} onChange={(val) => handleDashboardSettingChange('showProfitSharing', val)} />
                </div>
            </div>
        </div>
      </div>
       {/* Telegram Notification Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
            <TelegramIcon />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Notifikasi Telegram</h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Dapatkan notifikasi real-time setiap ada transaksi baru.</p>
        
        <div className="space-y-6">
            <Toggle label="Aktifkan Notifikasi Telegram" enabled={dashboardSettings.enableTelegramNotifications ?? false} onChange={(val) => handleDashboardSettingChange('enableTelegramNotifications', val)} />

            {dashboardSettings.enableTelegramNotifications && (
                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                    <div>
                        <label htmlFor="token" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Token Bot</label>
                        <input type="password" id="token" name="token" value={telegramSettings.token} onChange={handleTelegramInputChange} className={inputClasses} placeholder="Contoh: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dapatkan dari @BotFather di Telegram.</p>
                    </div>
                    <div>
                        <label htmlFor="chatId" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Chat ID</label>
                        <input type="text" id="chatId" name="chatId" value={telegramSettings.chatId} onChange={handleTelegramInputChange} className={inputClasses} placeholder="ID unik chat Anda atau grup" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dapatkan dari @userinfobot (untuk personal) atau tambahkan bot ke grup.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                        {testStatus.status !== 'idle' && (
                            <span className={`text-sm font-medium ${testStatus.status === 'success' ? 'text-green-600' : testStatus.status === 'error' ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                {testStatus.message}
                            </span>
                        )}
                        <button 
                            onClick={handleSaveAndTestTelegram}
                            disabled={testStatus.status === 'loading'}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-2.5 px-6 rounded-lg hover:from-blue-700 hover:to-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                        >
                           {testStatus.status === 'loading' && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            Simpan & Tes Koneksi
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;