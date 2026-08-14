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

    // 2. Seed Products if empty
    const prodDocs = await getDocs(productsCollection);
    if (prodDocs.empty) {
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), { ...p, userId: 'user-admin' });
      }
    }

    // 3. Seed Settings if empty
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'settings', 'general'), INITIAL_SETTINGS);
    }

    // 4. Seed sample orders if empty
    const orderDocs = await getDocs(ordersCollection);
    if (orderDocs.empty && INITIAL_ORDERS.length > 0) {
      for (const o of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', o.id), { ...o, userId: 'user-admin' });
      }
    }

    // 5. Seed expenses if empty
    const expenseDocs = await getDocs(expensesCollection);
    if (expenseDocs.empty && INITIAL_EXPENSES.length > 0) {
      for (const e of INITIAL_EXPENSES) {
        await setDoc(doc(db, 'expenses', e.id), { ...e, userId: 'user-admin' });
      }
    }

    // 6. Seed customers if empty
    const customerDocs = await getDocs(customersCollection);
    if (customerDocs.empty && INITIAL_CUSTOMERS.length > 0) {
      for (const c of INITIAL_CUSTOMERS) {
        await setDoc(doc(db, 'customers', c.id), { ...c, userId: 'user-admin' });
      }
    }

    // 7. Seed tables if empty
    const tableDocs = await getDocs(tablesCollection);
    if (tableDocs.empty && INITIAL_TABLES.length > 0) {
      for (const t of INITIAL_TABLES) {
        await setDoc(doc(db, 'tables', t.id), { ...t, userId: 'user-admin' });
      }
    }
  } catch (err) {
    console.error('Error during Firestore initialization:', err);
  }
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
      userId,
      username,
      userRole,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, 'activity_logs', logId), logItem);
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
  await setDoc(doc(db, 'products', product.id), product);
}

// Delete Product
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

// Save Order
export async function saveOrderToFirestore(order: Order): Promise<void> {
  await setDoc(doc(db, 'orders', order.id), order);
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
  await setDoc(doc(db, 'expenses', expense.id), expense);
}

// Delete Expense
export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', expenseId));
}

// Save Customer
export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  await setDoc(doc(db, 'customers', customer.id), customer);
}

// Delete Customer
export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  await deleteDoc(doc(db, 'customers', customerId));
}

// Save Table
export async function saveTableToFirestore(table: TableInfo): Promise<void> {
  await setDoc(doc(db, 'tables', table.id), table);
}

// Save Settings
export async function saveSettingsToFirestore(settings: ShopSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'general'), settings);
}

// Save or Update User
export async function saveUserToFirestore(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), user);
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
