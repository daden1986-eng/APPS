
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { ChatConversation, Customer, CompanyProfile, Message, ChatStatus } from '../types';
import WhatsappIcon from './icons/WhatsappIcon';
import TrashIcon from './icons/TrashIcon';
import UsersIcon from './icons/UsersIcon';
import SparkleIcon from './icons/SparkleIcon';
import ConfirmDialog from './ConfirmDialog';

interface ChatPageProps {
  conversations: ChatConversation[];
  customers: Customer[];
  companyProfile: CompanyProfile;
  onUpdateConversation: (conversation: ChatConversation) => void;
  onDeleteConversation: (id: string) => void;
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

const ChatPage: React.FC<ChatPageProps> = ({ conversations, customers, companyProfile, onUpdateConversation, onDeleteConversation }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [conversations]);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConversationId);
  }, [selectedConversationId, conversations]);

  const handleCreateNewChat = (customer: { name: string, phone: string }) => {
    const newConversation: ChatConversation = {
      id: new Date().getTime().toString(),
      customerName: customer.name,
      customerPhone: customer.phone,
      messages: [],
      status: ChatStatus.OPEN,
      lastUpdate: new Date().toISOString(),
    };
    onUpdateConversation(newConversation);
    setSelectedConversationId(newConversation.id);
    setIsNewChatModalOpen(false);
  };
  
  const handleOpenConfirmDelete = (id: string) => {
    setConversationToDelete(id);
    setIsConfirmDeleteOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete);
      if (selectedConversationId === conversationToDelete) {
        setSelectedConversationId(null);
      }
      setConversationToDelete(null);
    }
    setIsConfirmDeleteOpen(false);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row h-[calc(100vh-220px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-1/3 xl:w-1/4 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setIsNewChatModalOpen(true)} className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Mulai Chat Baru
            </button>
          </div>
          <ul className="overflow-y-auto flex-grow">
            {sortedConversations.map(conv => (
              <li key={conv.id}>
                <button 
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left p-4 border-l-4 transition-colors ${selectedConversationId === conv.id ? 'bg-indigo-50 dark:bg-slate-700/50 border-indigo-500' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{conv.customerName}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(conv.lastUpdate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                    {conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : 'Belum ada pesan...'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-grow h-2/3 md:h-full flex flex-col">
          {activeConversation ? (
            <ChatWindow 
              key={activeConversation.id}
              conversation={activeConversation} 
              onUpdateConversation={onUpdateConversation}
              companyProfile={companyProfile}
              onDelete={() => handleOpenConfirmDelete(activeConversation.id)}
            />
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
              <UsersIcon />
              <h2 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-100">Selamat Datang di Chat Pelanggan</h2>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Pilih percakapan dari sisi kiri atau mulai yang baru.</p>
            </div>
          )}
        </main>
      </div>
      <NewChatModal 
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        customers={customers}
        onStartChat={handleCreateNewChat}
      />
       <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Percakapan"
        message="Anda yakin ingin menghapus percakapan ini? Semua riwayat pesan akan hilang."
      />
    </>
  );
};

// ChatWindow Component
const ChatWindow: React.FC<{ conversation: ChatConversation, onUpdateConversation: (c: ChatConversation) => void, companyProfile: CompanyProfile, onDelete: () => void }> = ({ conversation, onUpdateConversation, companyProfile, onDelete }) => {
    const [customerMessage, setCustomerMessage] = useState('');
    const [assistantReply, setAssistantReply] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation.messages]);

    const handleGenerateReply = async () => {
        if (!customerMessage) {
            setError('Harap masukkan pesan pelanggan terlebih dahulu.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setIsGenerating(true);
        setError('');
        setAssistantReply('');

        const chatHistory = conversation.messages.map(msg => `${msg.sender === 'customer' ? 'Pelanggan' : 'Anda'}: ${msg.text}`).join('\n');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `Anda adalah asisten layanan pelanggan yang ramah dan sangat membantu untuk sebuah perusahaan penyedia internet bernama "${companyProfile.name}".
Tugas Anda adalah membalas pesan pelanggan dengan sopan, jelas, dan singkat dalam Bahasa Indonesia.

Berikut adalah riwayat percakapan sebelumnya:
${chatHistory || '(Tidak ada riwayat chat sebelumnya)'}

Pelanggan baru saja mengirim pesan: "${customerMessage}"

Buatkan draf balasan yang sesuai untuk pesan pelanggan tersebut.`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            
            setAssistantReply(response.text);

        } catch (err) {
            console.error(err);
            setError('Gagal menghasilkan balasan. Silakan coba lagi.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSend = () => {
        if (!assistantReply) {
             alert('Harap tulis balasan atau buat balasan dengan AI terlebih dahulu.');
             return;
        }
        
        const newMessages: Message[] = [...conversation.messages];
        
        if (customerMessage) {
            newMessages.push({
                id: `msg-${Date.now()}-cust`,
                text: customerMessage,
                sender: 'customer',
                timestamp: new Date().toISOString()
            });
        }
        
        newMessages.push({
            id: `msg-${Date.now()}-asst`,
            text: assistantReply,
            sender: 'assistant',
            timestamp: new Date().toISOString()
        });

        onUpdateConversation({ ...conversation, messages: newMessages });
        
        const phoneNumber = formatPhoneNumber(conversation.customerPhone);
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(assistantReply)}`;
        window.open(url, '_blank');

        setCustomerMessage('');
        setAssistantReply('');
    };

    return (
        <>
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{conversation.customerName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{conversation.customerPhone}</p>
                </div>
                 <button onClick={onDelete} className="text-gray-400 hover:text-red-600 p-2 rounded-full transition-colors" aria-label="Hapus percakapan">
                    <TrashIcon />
                </button>
            </header>
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-slate-800/50">
                {conversation.messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 my-2 ${msg.sender === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.sender === 'assistant' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-bl-none'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-xs mt-1 opacity-70 ${msg.sender === 'assistant' ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 flex-shrink-0">
                <textarea
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    placeholder="Langkah 1: Masukkan pesan masuk dari pelanggan di sini..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="text-center my-2">
                    <button onClick={handleGenerateReply} disabled={isGenerating} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors">
                        {isGenerating ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <SparkleIcon />}
                        {isGenerating ? 'Memproses...' : 'Langkah 2: Buat Balasan Otomatis (AI)'}
                    </button>
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <textarea
                    value={assistantReply}
                    onChange={(e) => setAssistantReply(e.target.value)}
                    placeholder="Langkah 3: Balasan yang dibuat AI akan muncul di sini. Edit jika perlu."
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
                 <button onClick={handleSend} className="w-full mt-3 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-px">
                    <WhatsappIcon />
                    Log & Kirim Balasan via WhatsApp
                </button>
            </footer>
        </>
    );
};

// NewChatModal Component
const NewChatModal: React.FC<{isOpen: boolean, onClose: () => void, customers: Customer[], onStartChat: (c: {name: string, phone: string}) => void}> = ({isOpen, onClose, customers, onStartChat}) => {
    const [mode, setMode] = useState<'select' | 'new'>('select');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const handleSubmit = () => {
        if (mode === 'select') {
            const customer = customers.find(c => c.id === selectedCustomerId);
            if(customer && customer.phone) {
                onStartChat({ name: customer.name, phone: customer.phone });
            } else {
                alert('Pelanggan tidak ditemukan atau tidak memiliki nomor telepon.');
            }
        } else {
            if (newName && newPhone) {
                onStartChat({ name: newName, phone: newPhone });
            } else {
                alert('Nama dan nomor telepon baru harus diisi.');
            }
        }
    };
    
    return (
       <AnimatePresence>
         {isOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                 <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Mulai Percakapan Baru</h2>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-lg mb-4">
                        <button onClick={() => setMode('select')} className={`p-2 rounded-md font-semibold ${mode === 'select' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Pilih Pelanggan</button>
                        <button onClick={() => setMode('new')} className={`p-2 rounded-md font-semibold ${mode === 'new' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Kontak Baru</button>
                    </div>

                    {mode === 'select' ? (
                        <div>
                            <label htmlFor="customer-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">Pilih dari daftar pelanggan</label>
                            <select id="customer-select" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <option value="" disabled>Pilih pelanggan...</option>
                                {customers.filter(c => c.phone).map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             <div>
                                <label htmlFor="new-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Pelanggan Baru</label>
                                <input id="new-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg" placeholder="John Doe"/>
                             </div>
                             <div>
                                <label htmlFor="new-phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Telepon</label>
                                <input id="new-phone" type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="mt-1 block w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg" placeholder="081234567890"/>
                             </div>
                        </div>
                    )}
                 </div>
                 <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Batal</button>
                    <button onClick={handleSubmit} className="px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors">Mulai</button>
                 </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    );
};

export default ChatPage;