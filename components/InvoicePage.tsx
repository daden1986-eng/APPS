import React, { useState, useMemo } from 'react';
import { Customer, CompanyProfile } from '../types';
import TrashIcon from './icons/TrashIcon';

// jspdf dan jspdf-autotable dimuat dari tag skrip di index.html
declare const jspdf: any;

interface InvoicePageProps {
  customers: Customer[];
  companyProfile: CompanyProfile;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

const InvoicePage: React.FC<InvoicePageProps> = ({ customers, companyProfile }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: '', quantity: 1, price: 0 },
  ]);
  const [invoiceNumber] = useState(`INV-${Date.now()}`);
  const [invoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 14 days from now
  const [notes, setNotes] = useState('Terima kasih atas bisnis Anda.');
  
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  }, [items]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generatePDF = () => {
    if (!selectedCustomer) {
      alert('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    // Header with Logo
    if (companyProfile.logo) {
      try {
        const img = new Image();
        img.src = companyProfile.logo;
        // You might need to adjust width/height based on your logo aspect ratio
        doc.addImage(img, 'PNG', 14, 15, 30, 15);
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FAKTUR', 200, 22, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyProfile.name, 14, 40);
    doc.text(companyProfile.address, 14, 45);
    doc.text(`Email: ${companyProfile.email} | Telp: ${companyProfile.phone}`, 14, 50);

    // Invoice Info
    doc.setFontSize(10);
    doc.text(`No. Faktur: ${invoiceNumber}`, 200, 32, { align: 'right' });
    doc.text(`Tanggal: ${new Date(invoiceDate).toLocaleDateString('id-ID')}`, 200, 38, { align: 'right' });
    doc.text(`Jatuh Tempo: ${new Date(dueDate).toLocaleDateString('id-ID')}`, 200, 44, { align: 'right' });

    // Bill To
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ditagihkan Kepada:', 14, 65);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(selectedCustomer.name, 14, 71);
    // Add more customer details here if available, e.g., address, phone

    // Table
    const tableColumn = ["Deskripsi", "Kuantitas", "Harga Satuan", "Total"];
    const tableRows: (string|number)[][] = [];

    items.forEach(item => {
        const itemData = [
            item.description,
            item.quantity,
            formatCurrency(item.price),
            formatCurrency(item.quantity * item.price)
        ];
        tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    // Total
    const finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', 150, finalY + 10, { align: 'left' });
    doc.text(formatCurrency(subtotal), 200, finalY + 10, { align: 'right' });
    
    // Notes
    if (notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Catatan:', 14, finalY + 25);
      doc.text(notes, 14, finalY + 30, { maxWidth: 180 });
    }
    
    doc.save(`faktur-${selectedCustomer.name.replace(/\s/g, '_')}-${invoiceNumber}.pdf`);
  };

  const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Buat Faktur Baru</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Isi detail di bawah untuk membuat faktur PDF.</p>
            </div>
            <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{invoiceNumber}</span>
        </div>
      
        {/* Customer & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
                <label htmlFor="customer" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Pelanggan</label>
                <select
                    id="customer"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className={inputClasses}
                >
                    <option value="" disabled>Pilih Pelanggan</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Jatuh Tempo</label>
                <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClasses}
                />
            </div>
        </div>
        
        {/* Items Table */}
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Rincian Item</h3>
            <div className="overflow-x-auto -mx-2">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-2/5">Deskripsi</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Kuantitas</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Harga</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total</th>
                            <th className="px-2 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td className="px-2 sm:px-4 py-2"><input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={inputClasses} placeholder="Layanan atau produk"/></td>
                                <td className="px-2 sm:px-4 py-2"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} className={`${inputClasses} w-20`} min="0" /></td>
                                <td className="px-2 sm:px-4 py-2"><input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} className={`${inputClasses} w-32`} min="0" /></td>
                                <td className="px-2 sm:px-4 py-2 font-medium text-gray-800 dark:text-gray-100">{formatCurrency(item.quantity * item.price)}</td>
                                <td className="px-2 py-2 text-right">
                                    {items.length > 1 && (
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full transition-colors"><TrashIcon /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button onClick={handleAddItem} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">+ Tambah Item</button>
        </div>
        
        {/* Summary and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t dark:border-gray-700 pt-6">
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Catatan</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputClasses} h-24`}
                    placeholder="Contoh: Info rekening bank, dll."
                ></textarea>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                </div>
                <div className="border-t my-4 dark:border-gray-600"></div>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">TOTAL</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xl">{formatCurrency(subtotal)}</span>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
             <button
                onClick={generatePDF}
                disabled={!selectedCustomerId || items.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
                Buat PDF Faktur
            </button>
        </div>
    </div>
  );
};

export default InvoicePage;