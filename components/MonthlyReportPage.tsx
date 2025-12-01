import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, CompanyProfile } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import DownloadIcon from './icons/DownloadIcon';

declare const jspdf: any;

interface MonthlyReportPageProps {
  transactions: Transaction[];
  companyProfile: CompanyProfile;
}

const PARTNERS = ['Daden', 'Mardi', 'Hamdan', 'UMI', 'Ramdani'];

const MonthlyReportPage: React.FC<MonthlyReportPageProps> = ({ transactions, companyProfile }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const { monthlyIncome, monthlyExpense, incomeTransactions, expenseTransactions, balance } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });

    const incomeTransactions = filtered.filter(t => t.type === TransactionType.INCOME).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const expenseTransactions = filtered.filter(t => t.type === TransactionType.EXPENSE).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const monthlyIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const balance = monthlyIncome - monthlyExpense;

    return { monthlyIncome, monthlyExpense, incomeTransactions, expenseTransactions, balance };
  }, [transactions, currentDate]);
  
  const sharePerPartner = balance > 0 ? balance / PARTNERS.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatMonthYear = (date: Date) => date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const generatePDF = () => {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      const monthYear = formatMonthYear(currentDate);

      // --- PDF HEADER ---
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(companyProfile.name, 200, 22, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Laporan Keuangan Bulanan`, 200, 28, { align: 'right' });
      doc.text(`Periode: ${monthYear}`, 200, 33, { align: 'right' });

      doc.setDrawColor(221, 221, 221); // A light grey line
      doc.line(14, 40, 200, 40); // Line separator

      // --- Summary Section ---
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan Keuangan', 14, 50);
      doc.autoTable({
          startY: 55,
          body: [
              ['Total Pemasukan', formatCurrency(monthlyIncome)],
              ['Total Pengeluaran', formatCurrency(monthlyExpense)],
              ['Laba / Rugi', formatCurrency(balance)],
          ],
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 2 },
      });

      // --- Profit Sharing Section ---
      let lastY = doc.autoTable.previous.finalY;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Pembagian Hasil', 14, lastY + 10);
      const partnerData = PARTNERS.map(name => [name, formatCurrency(sharePerPartner)]);
      doc.autoTable({
          startY: lastY + 15,
          head: [['Nama Anggota', 'Bagian']],
          body: partnerData,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 10 },
      });

      // --- Income Transactions ---
      lastY = doc.autoTable.previous.finalY;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Rincian Pemasukan', 14, lastY + 10);
      const incomeRows = incomeTransactions.map(t => [formatDate(t.date), t.description, t.category || '-', formatCurrency(t.amount)]);
      doc.autoTable({
          startY: lastY + 15,
          head: [['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah']],
          body: incomeRows,
          theme: 'striped',
          headStyles: { fillColor: [22, 163, 74] }, // Green
      });
      
      // --- Expense Transactions ---
      lastY = doc.autoTable.previous.finalY;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Rincian Pengeluaran', 14, lastY + 10);
      const expenseRows = expenseTransactions.map(t => [formatDate(t.date), t.description, t.category || '-', formatCurrency(t.amount)]);
      doc.autoTable({
          startY: lastY + 15,
          head: [['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah']],
          body: expenseRows,
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38] }, // Red
      });

      // --- Signature Section ---
      lastY = doc.autoTable.previous.finalY;
      if (lastY > 230) {
        doc.addPage();
        lastY = 20;
      }
      
      const today = formatDate(new Date().toISOString().split('T')[0]);
      const directorName = companyProfile.directorName || '(....................................)';
      
      const signatureX = 140; 
      const signatureYStart = lastY + 25;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Disetujui, ${today}`, signatureX, signatureYStart);
      
      doc.setFont('helvetica', 'bold');
      doc.text(directorName, signatureX, signatureYStart + 25);
      doc.setFont('helvetica', 'normal');
      doc.setLineWidth(0.2);
      doc.line(signatureX, signatureYStart + 26, signatureX + 50, signatureYStart + 26);
      doc.text('Direktur', signatureX, signatureYStart + 31);

      doc.save(`laporan_bulanan_${monthYear.replace(' ', '_')}.pdf`);
  };

  const SummaryCard: React.FC<{ title: string, amount: number, colorClass: string }> = ({ title, amount, colorClass }) => (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(amount)}</p>
      </div>
  );

  const TransactionTable: React.FC<{ title: string, data: Transaction[], colorClass: string }> = ({ title, data, colorClass }) => (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className={`text-lg font-bold mb-4 ${colorClass}`}>{title}</h3>
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">Tanggal</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">Deskripsi</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-300">Jumlah</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.length > 0 ? data.map(t => (
                          <tr key={t.id}>
                              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{t.description}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 text-right font-medium whitespace-nowrap">{formatCurrency(t.amount)}</td>
                          </tr>
                      )) : (
                          <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">Tidak ada data.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );


  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 p-2 rounded-lg">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"><ChevronLeftIcon /></button>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-center w-40">{formatMonthYear(currentDate)}</span>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"><ChevronRightIcon /></button>
        </div>
        <button onClick={generatePDF} className="flex items-center gap-2 w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-2.5 px-5 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-px">
            <DownloadIcon />
            <span>Ekspor ke PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Total Pemasukan" amount={monthlyIncome} colorClass="text-green-600 dark:text-green-400" />
          <SummaryCard title="Total Pengeluaran" amount={monthlyExpense} colorClass="text-red-600 dark:text-red-400" />
          <SummaryCard title="Laba / Rugi" amount={balance} colorClass={balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'} />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Pembagian Hasil ({PARTNERS.length} Anggota)</h3>
          {balance > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {PARTNERS.map(name => (
                      <div key={name} className="bg-gray-100 dark:bg-slate-700 p-3 rounded-lg text-center">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{name}</p>
                          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(sharePerPartner)}</p>
                      </div>
                  ))}
              </div>
          ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Laba tidak positif, tidak ada pembagian hasil.</p>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TransactionTable title="Rincian Semua Pemasukan" data={incomeTransactions} colorClass="text-green-600 dark:text-green-400" />
          <TransactionTable title="Rincian Semua Pengeluaran" data={expenseTransactions} colorClass="text-red-600 dark:text-red-400" />
      </div>

    </div>
  );
};

export default MonthlyReportPage;