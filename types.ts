export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionMode {
  TRANSFER = 'transfer',
  CASH = 'cash',
}

export enum SubscriptionType {
  PPPOE = 'PPPoE',
  STATIC = 'Static',
  HOTSPOT = 'Hotspot',
  MITRA_VOUCHER = 'Mitra Voucher',
}

export interface Transaction {
  id: string;
  date: string;
  description:string;
  amount: number;
  type: TransactionType;
  proof?: string; // URL data base64 dari gambar bukti
  category?: string; // Kategori transaksi
  mode?: TransactionMode; // Mode transaksi
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  fee: number;
  paid: boolean;
  lastPaymentDate?: string;
  subscriptionType?: SubscriptionType;
  lastPaymentMode?: TransactionMode;
}

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string; // base64 encoded image
  directorName?: string;
}

export interface DashboardSettings {
  showSummary: boolean;
  showProfitSharing: boolean;
  showMonthlySummary: boolean;
  showChart: boolean;
  showCategoryChart: boolean;
  theme: 'light' | 'dark';
  loginMarqueeText: string;
  dashboardTitle: string;
  enableTelegramNotifications?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
}

// FIX: Added missing RepairStatus enum.
export enum RepairStatus {
  NEW = 'Baru',
  IN_PROGRESS = 'Dalam Pengerjaan',
  COMPLETED = 'Selesai',
}

// FIX: Added missing RepairTicket interface.
export interface RepairTicket {
  id: string;
  receivedDate: string;
  customerName: string;
  contact?: string;
  address?: string;
  description: string;
  technician?: string;
  cost?: number;
  status: RepairStatus;
  completedDate?: string;
}

// Types for Customer Chat Feature
export enum ChatStatus {
  OPEN = 'Buka',
  IN_PROGRESS = 'Dalam Proses',
  CLOSED = 'Selesai',
}

export interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'assistant';
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  customerName: string;
  customerPhone: string;
  messages: Message[];
  status: ChatStatus;
  lastUpdate: string;
}