export interface Product {
  id: string;
  userId?: string; // Scoped to user/member account
  name: string;
  nameKh?: string;
  category: string;
  price: number; // in USD
  costPrice: number; // in USD
  stock: number;
  barcode: string;
  image: string;
  isPopular?: boolean;
  unit?: string;
  description?: string;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
  itemNote?: string;
}

export type PaymentMethod = 'cash' | 'khqr' | 'card' | 'aba_pay';

export interface Order {
  id: string;
  userId?: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percent';
  tax: number;
  taxRate: number;
  total: number;
  totalKhr: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeDue: number;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  status: 'completed' | 'draft' | 'cancelled';
  createdAt: string; // ISO string
  note?: string;
}

export interface Expense {
  id: string;
  userId?: string;
  title: string;
  category: 'Stock Purchase' | 'Utilities' | 'Rent' | 'Staff Salary' | 'Marketing' | 'Maintenance' | 'Other';
  amount: number;
  date: string;
  paidBy: string;
  notes?: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  points: number;
  lastVisit: string;
}

export interface TableInfo {
  id: string;
  userId?: string;
  name: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
}

export interface ShopSettings {
  shopName: string;
  shopNameKh: string;
  address: string;
  phone: string;
  taxRate: number; // e.g. 0.08 for 8%
  currencySymbol: string;
  khrExchangeRate: number; // e.g. 4100
  enableSound: boolean;
  receiptFooterText: string;
  language: 'en' | 'kh';
}

export type UserRole = 'admin' | 'cashier' | 'manager';
export type UserStatus = 'active' | 'pending' | 'disabled';

export interface User {
  id: string;
  username: string;
  password?: string; // used for local/simulated validation if needed
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export type ActiveView = 
  | 'pos' 
  | 'products' 
  | 'orders' 
  | 'income_reports' 
  | 'expenses' 
  | 'tables' 
  | 'customers' 
  | 'settings'
  | 'admin_console';

