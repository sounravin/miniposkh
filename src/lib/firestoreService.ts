import {
  db,
  usersCollection,
  productsCollection,
  ordersCollection,
  expensesCollection,
  customersCollection,
  tablesCollection,
  settingsCollection,
  logsCollection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from './firebase';
import { User, Product, Order, Expense, Customer, TableInfo, ShopSettings, ActivityLog } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_ORDERS, INITIAL_EXPENSES, INITIAL_CUSTOMERS, INITIAL_TABLES } from '../data/initialData';

// Pre-seeded Admin, Manager & Default Cashier
export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin',
    fullName: 'ប្រធានគ្រប់គ្រងទូទៅ (System Admin)',
    role: 'admin',
    status: 'active',
    phone: '+855 12 888 999',
    email: 'admin@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-manager-1',
    username: 'manager',
    password: '123',
    fullName: 'ចាន់ វ៉ាន់នី (Chan Vanny)',
    role: 'manager',
    status: 'active',
    phone: '+855 77 123 456',
    email: 'manager@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cashier-1',
    username: 'cashier01',
    password: '123',
    fullName: 'សុខ ពិសិដ្ឋ (Sok Piseth)',
    role: 'cashier',
    status: 'active',
    phone: '+855 98 777 666',
    email: 'piseth@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cashier-2',
    username: 'cashier',
    password: '123',
    fullName: 'កែវ មុនី (Keo Mony)',
    role: 'cashier',
    status: 'active',
    phone: '+855 10 555 444',
    email: 'mony@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  }
];

// Initialize / Seed Database
export async function initializeFirestoreDatabase(): Promise<void> {
  try {
    // 1. Seed Users if empty
    try {
      const userDocs = await getDocs(usersCollection);
      if (userDocs.empty) {
        for (const u of DEFAULT_USERS) {
          await setDoc(doc(db, 'users', u.id), u);
        }
      } else {
        const adminDoc = await getDoc(doc(db, 'users', 'user-admin'));
        if (!adminDoc.exists()) {
          await setDoc(doc(db, 'users', 'user-admin'), DEFAULT_USERS[0]);
        }
      }
    } catch (uErr: any) {
      if (uErr?.message?.includes('offline') || uErr?.code === 'unavailable') {
        console.info('Firestore users seeding deferred (operating in offline/cached mode)');
        return;
      }
      throw uErr;
    }

    // 2. Seed Products if empty
    try {
      const prodDocs = await getDocs(productsCollection);
      if (prodDocs.empty) {
        for (const p of INITIAL_PRODUCTS) {
          await setDoc(doc(db, 'products', p.id), { ...p, userId: 'user-admin' });
        }
      }
    } catch (pErr: any) {
      if (pErr?.message?.includes('offline') || pErr?.code === 'unavailable') return;
      throw pErr;
    }

    // 3. Seed Settings if empty
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (!settingsDoc.exists()) {
        await setDoc(doc(db, 'settings', 'general'), INITIAL_SETTINGS);
      }
    } catch (sErr: any) {
      if (sErr?.message?.includes('offline') || sErr?.code === 'unavailable') return;
      throw sErr;
    }

    // 4. Seed sample orders if empty
    try {
      const orderDocs = await getDocs(ordersCollection);
      if (orderDocs.empty && INITIAL_ORDERS.length > 0) {
        for (const o of INITIAL_ORDERS) {
          await setDoc(doc(db, 'orders', o.id), { ...o, userId: 'user-admin' });
        }
      }
    } catch (oErr: any) {
      if (oErr?.message?.includes('offline') || oErr?.code === 'unavailable') return;
      throw oErr;
    }

    // 5. Seed expenses if empty
    try {
      const expenseDocs = await getDocs(expensesCollection);
      if (expenseDocs.empty && INITIAL_EXPENSES.length > 0) {
        for (const e of INITIAL_EXPENSES) {
          await setDoc(doc(db, 'expenses', e.id), { ...e, userId: 'user-admin' });
        }
      }
    } catch (eErr: any) {
      if (eErr?.message?.includes('offline') || eErr?.code === 'unavailable') return;
      throw eErr;
    }

    // 6. Seed customers if empty
    try {
      const customerDocs = await getDocs(customersCollection);
      if (customerDocs.empty && INITIAL_CUSTOMERS.length > 0) {
        for (const c of INITIAL_CUSTOMERS) {
          await setDoc(doc(db, 'customers', c.id), { ...c, userId: 'user-admin' });
        }
      }
    } catch (cErr: any) {
      if (cErr?.message?.includes('offline') || cErr?.code === 'unavailable') return;
      throw cErr;
    }

    // 7. Seed tables if empty
    try {
      const tableDocs = await getDocs(tablesCollection);
      if (tableDocs.empty && INITIAL_TABLES.length > 0) {
        for (const t of INITIAL_TABLES) {
          await setDoc(doc(db, 'tables', t.id), { ...t, userId: 'user-admin' });
        }
      }
    } catch (tErr: any) {
      if (tErr?.message?.includes('offline') || tErr?.code === 'unavailable') return;
      throw tErr;
    }
  } catch (err: any) {
    if (err?.message?.includes('offline') || err?.code === 'unavailable') {
      console.info('Firestore initial seeding deferred: client is currently in offline mode.');
    } else {
      console.warn('Firestore initialization notice:', err);
    }
  }
}

// Helper to recursively remove undefined values which cause Firestore setDoc/updateDoc to throw errors
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Activity Logging
export async function logUserActivity(
  userId: string,
  username: string,
  userRole: string,
  action: string,
  details: string
): Promise<void> {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const logItem: ActivityLog = {
      id: logId,
      userId: userId || 'system',
      username: username || 'User',
      userRole: userRole || 'staff',
      action: action || 'Action',
      details: details || '',
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, 'activity_logs', logId), cleanForFirestore(logItem));
  } catch (err) {
    console.warn('Failed to record activity log to Firestore:', err);
  }
}

// Subscribe to Products
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  try {
    const unsub = onSnapshot(productsCollection, (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Product);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore products subscription error:', error);
      callback([]);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to products:', err);
    callback([]);
    return () => {};
  }
}

// Subscribe to Orders
export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  try {
    const q = query(ordersCollection, orderBy('createdAt', 'desc'), limit(150));
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Order);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore orders subscription error:', error);
      callback([]);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to orders:', err);
    callback([]);
    return () => {};
  }
}

// Subscribe to Expenses
export function subscribeToExpenses(callback: (expenses: Expense[]) => void): () => void {
  try {
    const q = query(expensesCollection, orderBy('date', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const list: Expense[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Expense);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore expenses subscription error:', error);
      callback([]);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to expenses:', err);
    callback([]);
    return () => {};
  }
}

// Subscribe to Customers
export function subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
  try {
    const unsub = onSnapshot(customersCollection, (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Customer);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore customers subscription error:', error);
      callback([]);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to customers:', err);
    callback([]);
    return () => {};
  }
}

// Subscribe to Tables
export function subscribeToTables(callback: (tables: TableInfo[]) => void): () => void {
  try {
    const unsub = onSnapshot(tablesCollection, (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const list: TableInfo[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as TableInfo);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore tables subscription error:', error);
      callback([]);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to tables:', err);
    callback([]);
    return () => {};
  }
}

// Subscribe to Registered Users
export function subscribeToUsers(callback: (users: User[]) => void): () => void {
  try {
    const unsub = onSnapshot(usersCollection, (snapshot) => {
      if (snapshot.empty) {
        callback(DEFAULT_USERS);
        return;
      }
      const list: User[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as User);
      });
      list.sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));
      callback(list);
    }, (error) => {
      console.warn('Firestore users subscription error:', error);
      callback(DEFAULT_USERS);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to users:', err);
    callback(DEFAULT_USERS);
    return () => {};
  }
}

// Subscribe to Activity Logs
export function subscribeToActivityLogs(callback: (logs: ActivityLog[]) => void): () => void {
  try {
    const q = query(logsCollection, orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ActivityLog);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore logs subscription error:', error);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to logs:', err);
    return () => {};
  }
}

// Subscribe to Shop Settings
export function subscribeToSettings(callback: (settings: ShopSettings) => void): () => void {
  try {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as ShopSettings);
      } else {
        callback(INITIAL_SETTINGS);
      }
    }, (error) => {
      console.warn('Firestore settings subscription error:', error);
      callback(INITIAL_SETTINGS);
    });
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to settings:', err);
    callback(INITIAL_SETTINGS);
    return () => {};
  }
}

// Save or Update Product
export async function saveProductToFirestore(product: Product): Promise<void> {
  await setDoc(doc(db, 'products', product.id), cleanForFirestore(product));
}

// Delete Product
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

// Save Order
export async function saveOrderToFirestore(order: Order): Promise<void> {
  await setDoc(doc(db, 'orders', order.id), cleanForFirestore(order));
}

// Update Order Status
export async function updateOrderStatusInFirestore(orderId: string, status: Order['status']): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status });
}

// Delete Order
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', orderId));
}

// Save Expense
export async function saveExpenseToFirestore(expense: Expense): Promise<void> {
  await setDoc(doc(db, 'expenses', expense.id), cleanForFirestore(expense));
}

// Delete Expense
export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', expenseId));
}

// Save Customer
export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  await setDoc(doc(db, 'customers', customer.id), cleanForFirestore(customer));
}

// Delete Customer
export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  await deleteDoc(doc(db, 'customers', customerId));
}

// Save Table
export async function saveTableToFirestore(table: TableInfo): Promise<void> {
  await setDoc(doc(db, 'tables', table.id), cleanForFirestore(table));
}

// Save Settings
export async function saveSettingsToFirestore(settings: ShopSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'general'), cleanForFirestore(settings));
}

// Save or Update User
export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    // 1. Immediately update Local Storage cache
    const currentCached = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
    const updated = [user, ...currentCached.filter(u => u.id !== user.id && u.username.toLowerCase() !== user.username.toLowerCase())];
    setCachedData(LOCAL_STORAGE_KEYS.USERS, updated);

    // Also update a permanent registry in localStorage
    try {
      const backupUsers = JSON.parse(localStorage.getItem('minipos_all_registered_accounts') || '[]');
      const backupUpdated = [user, ...backupUsers.filter((u: any) => u.id !== user.id && u.username?.toLowerCase() !== user.username.toLowerCase())];
      localStorage.setItem('minipos_all_registered_accounts', JSON.stringify(backupUpdated));
    } catch {
      // Safe fallback
    }

    // 2. Persist to Firestore
    await setDoc(doc(db, 'users', user.id), cleanForFirestore(user));
  } catch (err) {
    console.warn('Failed to save user to Firestore directly:', err);
  }
}

// Fetch all registered users directly from Firestore Cloud
export async function fetchAllUsersFromFirestoreDirectly(): Promise<User[]> {
  try {
    const userDocs = await getDocs(usersCollection);
    const list: User[] = [];
    if (!userDocs.empty) {
      userDocs.forEach((docSnap) => {
        list.push(docSnap.data() as User);
      });
    }

    // Ensure all default admin & staff accounts are included
    for (const defU of DEFAULT_USERS) {
      if (!list.some(u => u.id === defU.id || u.username.toLowerCase() === defU.username.toLowerCase())) {
        list.push(defU);
      }
    }

    // Merge with any locally stored users
    try {
      const backupUsers = JSON.parse(localStorage.getItem('minipos_all_registered_accounts') || '[]');
      for (const bU of backupUsers) {
        if (!list.some(u => u.id === bU.id || u.username.toLowerCase() === bU.username?.toLowerCase())) {
          list.push(bU);
        }
      }
    } catch {
      // Safe fallback
    }

    list.sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));
    setCachedData(LOCAL_STORAGE_KEYS.USERS, list);
    return list;
  } catch (err) {
    console.warn('Direct fetch users from Firestore fallback to cache:', err);
    return getCachedData(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
  }
}

// Update User Status
export async function updateUserStatusInFirestore(userId: string, status: 'active' | 'pending' | 'disabled'): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { status });
}

// Update User Role
export async function updateUserRoleInFirestore(userId: string, role: 'admin' | 'cashier' | 'manager'): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { role });
}

// Delete User
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId));
}

// ============================================================================
// LOCAL STORAGE CACHE & CLOUD SYNC ENGINE (Cost-Saving & Offline-First)
// ============================================================================

export const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'minipos_cached_products',
  ORDERS: 'minipos_cached_orders',
  EXPENSES: 'minipos_cached_expenses',
  CUSTOMERS: 'minipos_cached_customers',
  TABLES: 'minipos_cached_tables',
  SETTINGS: 'minipos_cached_settings',
  USERS: 'minipos_cached_users',
  LAST_SYNC: 'minipos_last_cloud_sync',
  PENDING_CHANGES: 'minipos_pending_cloud_changes',
  AUTO_SYNC_INTERVAL_DAYS: 'minipos_auto_sync_interval_days'
};

export function getCachedData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to read cache for ${key}:`, e);
    return fallback;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to write cache for ${key}:`, e);
  }
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC);
  } catch {
    return null;
  }
}

export function setLastSyncTime(isoDate?: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, isoDate || new Date().toISOString());
  } catch (e) {
    console.warn('Failed to save last sync time:', e);
  }
}

export function isSyncDue(intervalDays: number = 3): boolean {
  const last = getLastSyncTime();
  if (!last) return true; // never synced
  try {
    const lastDate = new Date(last).getTime();
    const now = Date.now();
    const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
    return diffDays >= intervalDays;
  } catch {
    return true;
  }
}

export function getPendingChangesCount(): number {
  try {
    const count = localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_CHANGES);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementPendingChanges(): void {
  try {
    const curr = getPendingChangesCount();
    localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_CHANGES, (curr + 1).toString());
  } catch (e) {
    console.warn('Failed to increment pending changes:', e);
  }
}

export function resetPendingChanges(): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_CHANGES, '0');
  } catch (e) {
    console.warn('Failed to reset pending changes:', e);
  }
}

// Fetch all collections once from Cloud Firestore and update local storage caches
export async function fetchAllCloudData(): Promise<{
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  customers: Customer[];
  tables: TableInfo[];
  users: User[];
  settings: ShopSettings;
}> {
  const results = {
    products: [] as Product[],
    orders: [] as Order[],
    expenses: [] as Expense[],
    customers: [] as Customer[],
    tables: [] as TableInfo[],
    users: [] as User[],
    settings: INITIAL_SETTINGS
  };

  try {
    // 1. Fetch Users
    const userDocs = await getDocs(usersCollection);
    if (!userDocs.empty) {
      const list: User[] = [];
      userDocs.forEach(d => list.push(d.data() as User));
      results.users = list;
      setCachedData(LOCAL_STORAGE_KEYS.USERS, list);
    } else {
      results.users = DEFAULT_USERS;
    }

    // 2. Fetch Products
    const prodDocs = await getDocs(productsCollection);
    if (!prodDocs.empty) {
      const list: Product[] = [];
      prodDocs.forEach(d => list.push(d.data() as Product));
      results.products = list;
      setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
    } else {
      results.products = INITIAL_PRODUCTS;
    }

    // 3. Fetch Orders
    const orderDocs = await getDocs(query(ordersCollection, orderBy('createdAt', 'desc'), limit(200)));
    if (!orderDocs.empty) {
      const list: Order[] = [];
      orderDocs.forEach(d => list.push(d.data() as Order));
      results.orders = list;
      setCachedData(LOCAL_STORAGE_KEYS.ORDERS, list);
    }

    // 4. Fetch Expenses
    const expDocs = await getDocs(query(expensesCollection, orderBy('date', 'desc'), limit(150)));
    if (!expDocs.empty) {
      const list: Expense[] = [];
      expDocs.forEach(d => list.push(d.data() as Expense));
      results.expenses = list;
      setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, list);
    }

    // 5. Fetch Customers
    const custDocs = await getDocs(customersCollection);
    if (!custDocs.empty) {
      const list: Customer[] = [];
      custDocs.forEach(d => list.push(d.data() as Customer));
      results.customers = list;
      setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, list);
    }

    // 6. Fetch Tables
    const tblDocs = await getDocs(tablesCollection);
    if (!tblDocs.empty) {
      const list: TableInfo[] = [];
      tblDocs.forEach(d => list.push(d.data() as TableInfo));
      results.tables = list;
      setCachedData(LOCAL_STORAGE_KEYS.TABLES, list);
    }

    // 7. Fetch Settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (settingsDoc.exists()) {
      results.settings = settingsDoc.data() as ShopSettings;
      setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, results.settings);
    }

    setLastSyncTime();
    resetPendingChanges();
  } catch (err: any) {
    console.warn('Cloud fetch warning (operating in local cached mode):', err);
  }

  return results;
}

// Bulk Sync all local datasets from all users to Firestore Cloud
export async function syncAllLocalDataToFirestore(payload: {
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  customers: Customer[];
  tables: TableInfo[];
  users: User[];
  settings: ShopSettings;
}): Promise<{
  success: boolean;
  productsSynced: number;
  ordersSynced: number;
  usersSynced: number;
  timestamp: string;
  error?: string;
}> {
  try {
    // 1. Sync Users
    for (const u of payload.users) {
      await setDoc(doc(db, 'users', u.id), cleanForFirestore(u));
    }

    // 2. Sync Products
    for (const p of payload.products) {
      await setDoc(doc(db, 'products', p.id), cleanForFirestore(p));
    }

    // 3. Sync Orders (recent orders)
    for (const o of payload.orders.slice(0, 150)) {
      await setDoc(doc(db, 'orders', o.id), cleanForFirestore(o));
    }

    // 4. Sync Customers
    for (const c of payload.customers) {
      await setDoc(doc(db, 'customers', c.id), cleanForFirestore(c));
    }

    // 5. Sync Expenses
    for (const e of payload.expenses.slice(0, 100)) {
      await setDoc(doc(db, 'expenses', e.id), cleanForFirestore(e));
    }

    // 6. Sync Tables
    for (const t of payload.tables) {
      await setDoc(doc(db, 'tables', t.id), cleanForFirestore(t));
    }

    // 7. Sync Settings
    if (payload.settings) {
      await setDoc(doc(db, 'settings', 'general'), cleanForFirestore(payload.settings));
    }

    const now = new Date().toISOString();
    setLastSyncTime(now);
    resetPendingChanges();

    // Cache everything to local storage as well
    setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, payload.products);
    setCachedData(LOCAL_STORAGE_KEYS.ORDERS, payload.orders);
    setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, payload.expenses);
    setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, payload.customers);
    setCachedData(LOCAL_STORAGE_KEYS.TABLES, payload.tables);
    setCachedData(LOCAL_STORAGE_KEYS.USERS, payload.users);
    setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, payload.settings);

    return {
      success: true,
      productsSynced: payload.products.length,
      ordersSynced: payload.orders.length,
      usersSynced: payload.users.length,
      timestamp: now
    };
  } catch (err: any) {
    console.error('Failed to sync data to Firestore:', err);
    return {
      success: false,
      productsSynced: 0,
      ordersSynced: 0,
      usersSynced: 0,
      timestamp: new Date().toISOString(),
      error: err.message || 'Unknown Firestore sync error'
    };
  }
}

