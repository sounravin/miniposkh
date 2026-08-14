import React, { useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  Expense, 
  Customer, 
  TableInfo, 
  ShopSettings, 
  ActiveView,
  User,
  ActivityLog
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_EXPENSES, 
  INITIAL_CUSTOMERS, 
  INITIAL_TABLES, 
  INITIAL_SETTINGS 
} from './data/initialData';
import { sounds } from './utils/audio';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { PosView } from './components/PosView';
import { CartDrawer } from './components/CartDrawer';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ProductsManager } from './components/ProductsManager';
import { IncomeReports } from './components/IncomeReports';
import { ExpensesManager } from './components/ExpensesManager';
import { OrdersManager } from './components/OrdersManager';
import { TablesManager } from './components/TablesManager';
import { CustomersManager } from './components/CustomersManager';
import { SettingsManager } from './components/SettingsManager';
import { WelcomeAuthPage } from './components/WelcomeAuthPage';
import { AdminConsole } from './components/AdminConsole';
import { UserProfileModal } from './components/UserProfileModal';
import {
  initializeFirestoreDatabase,
  subscribeToProducts,
  subscribeToOrders,
  subscribeToExpenses,
  subscribeToCustomers,
  subscribeToTables,
  subscribeToUsers,
  subscribeToActivityLogs,
  subscribeToSettings,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  deleteOrderFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  saveTableToFirestore,
  saveSettingsToFirestore,
  logUserActivity,
  DEFAULT_USERS
} from './lib/firestoreService';

export default function App() {
  // Current Auth User Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('minipos_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // 1. Persistent Data with Real-Time Firestore Synchronization
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SETTINGS);

  // Filter products, orders, expenses by user account (Multi-user Data Isolation)
  const userProducts = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      const adminList = products.filter(p => !p.userId || p.userId === 'user-admin' || p.userId === currentUser.id);
      return adminList.length > 0 ? adminList : INITIAL_PRODUCTS;
    }
    return products.filter(p => p.userId === currentUser.id);
  }, [products, currentUser]);

  const userOrders = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      const adminOrders = orders.filter(o => !o.userId || o.userId === 'user-admin' || o.userId === currentUser.id);
      return adminOrders.length > 0 ? adminOrders : orders;
    }
    return orders.filter(o => o.userId === currentUser.id);
  }, [orders, currentUser]);

  const userExpenses = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      const adminExpenses = expenses.filter(e => !e.userId || e.userId === 'user-admin' || e.userId === currentUser.id);
      return adminExpenses.length > 0 ? adminExpenses : expenses;
    }
    return expenses.filter(e => e.userId === currentUser.id);
  }, [expenses, currentUser]);

  const userCustomers = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      const adminCustomers = customers.filter(c => !c.userId || c.userId === 'user-admin' || c.userId === currentUser.id);
      return adminCustomers.length > 0 ? adminCustomers : customers;
    }
    return customers.filter(c => c.userId === currentUser.id);
  }, [customers, currentUser]);

  // 2. Active Screen State
  const [activeView, setActiveView] = useState<ActiveView>('pos');
  const [cashierName, setCashierName] = useState('MD Atikur Rhaman');
  const [language, setLanguage] = useState<'en' | 'kh'>(() => {
    return (localStorage.getItem('minipos_lang') as 'en' | 'kh') || 'kh';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initialize Firestore and Real-time Listeners
  useEffect(() => {
    initializeFirestoreDatabase();

    const unsubProducts = subscribeToProducts((cloudProds) => {
      setProducts(cloudProds || []);
    });

    const unsubOrders = subscribeToOrders((cloudOrders) => {
      setOrders(cloudOrders || []);
    });

    const unsubExpenses = subscribeToExpenses((cloudExpenses) => {
      setExpenses(cloudExpenses || []);
    });

    const unsubCustomers = subscribeToCustomers((cloudCustomers) => {
      setCustomers(cloudCustomers || []);
    });

    const unsubTables = subscribeToTables((cloudTables) => {
      setTables(cloudTables || []);
    });

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
      }
    });

    const unsubLogs = subscribeToActivityLogs((cloudLogs) => {
      setActivityLogs(cloudLogs);
    });

    const unsubSettings = subscribeToSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubExpenses();
      unsubCustomers();
      unsubTables();
      unsubUsers();
      unsubLogs();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('minipos_lang', language);
    if (language === 'kh') {
      document.body.classList.add('lang-kh');
    } else {
      document.body.classList.remove('lang-kh');
    }
  }, [language]);

  // Auth login handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCashierName(user.fullName);
    localStorage.setItem('minipos_auth_user', JSON.stringify(user));
    setCartItems([]);
    setDiscount(0);
    setOrderNote('');
    setCustomerName('');
    setActiveView('pos');
  };

  // Auth logout handler
  const handleLogout = () => {
    if (currentUser) {
      logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'LOGOUT',
        `${currentUser.fullName} signed out`
      ).catch((err) => console.warn('Logout log skipped:', err));
    }
    setCurrentUser(null);
    setCartItems([]);
    localStorage.removeItem('minipos_auth_user');
    setMobileSidebarOpen(false);
  };

  // 3. Current Order / Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('Counter 01 (Main POS)');
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [orderNote, setOrderNote] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  // 4. Modals State
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Profile update handler
  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('minipos_auth_user', JSON.stringify(updatedUser));
  };

  // Handle Cart Operations
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1
        };
        return next;
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    setIsMobileCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setOrderNote('');
    setCustomerName('');
  };

  // Barcode scanned callback
  const handleBarcodeScanSuccess = (product: Product) => {
    handleAddToCart(product);
  };

  // Complete Order & Save to Firestore
  const handleOrderCompleted = async (newOrder: Order) => {
    const orderWithUser: Order = {
      ...newOrder,
      userId: currentUser?.id || 'user-admin'
    };
    
    // Save order to Firestore cloud
    await saveOrderToFirestore(orderWithUser);

    // If customer was specified, update customer's lifetime stats & points
    if (orderWithUser.customerName && orderWithUser.customerName !== 'Walk-in Customer' && orderWithUser.customerName !== 'Draft Order') {
      const matchedCust = customers.find(c => c.name.toLowerCase() === orderWithUser.customerName?.toLowerCase());
      if (matchedCust) {
        const updatedCust: Customer = {
          ...matchedCust,
          totalOrders: matchedCust.totalOrders + 1,
          totalSpent: matchedCust.totalSpent + orderWithUser.total,
          points: matchedCust.points + Math.round(orderWithUser.total),
          lastVisit: new Date().toISOString().slice(0, 10)
        };
        await saveCustomerToFirestore(updatedCust);
      }
    }

    if (currentUser) {
      await logUserActivity(
        currentUser.id, 
        currentUser.username, 
        currentUser.role, 
        'COMPLETED_SALE', 
        `Completed order #${orderWithUser.orderNumber} for $${orderWithUser.total.toFixed(2)}`
      );
    }
    
    // Decrement stock in state and Firestore
    for (const item of newOrder.items) {
      const p = products.find(prod => prod.id === item.product.id);
      if (p) {
        const updatedStock = Math.max(0, p.stock - item.quantity);
        const updatedProduct: Product = { ...p, stock: updatedStock, userId: p.userId || currentUser?.id || 'user-admin' };
        await saveProductToFirestore(updatedProduct);
      }
    }

    // Close checkout and show receipt
    setIsPaymentModalOpen(false);
    setActiveReceiptOrder(orderWithUser);

    // Reset current order
    setCartItems([]);
    setDiscount(0);
    setOrderNote('');
    setCustomerName('');
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (cartItems.length === 0) return;
    
    const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const computedDiscount = discountType === 'percent' ? (subtotal * discount) / 100 : discount;
    const tax = Math.max(0, subtotal - computedDiscount) * settings.taxRate;
    const total = Math.max(0, subtotal - computedDiscount) + tax;

    const draftOrder: Order = {
      id: `ord-draft-${Date.now()}`,
      userId: currentUser?.id || 'user-admin',
      orderNumber: `DRF-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [...cartItems],
      subtotal,
      discount,
      discountType,
      tax,
      taxRate: settings.taxRate,
      total,
      totalKhr: total * settings.khrExchangeRate,
      paymentMethod: 'cash',
      amountPaid: 0,
      changeDue: 0,
      tableNumber: selectedTable,
      customerName: customerName || (language === 'kh' ? 'សេចក្តីព្រាង' : 'Draft Order'),
      cashierName: currentUser?.fullName || cashierName,
      status: 'draft',
      createdAt: new Date().toISOString(),
      note: orderNote
    };

    await saveOrderToFirestore(draftOrder);
    setCartItems([]);
    alert(language === 'kh' ? 'ការកុម្ម៉ង់ត្រូវបានរក្សាទុកក្នុងសេចក្តីព្រាង (Draft)!' : 'Order saved as draft!');
  };

  // Product CRUD with Cloud Sync
  const handleAddProduct = async (newProd: Product) => {
    const prodWithUser: Product = {
      ...newProd,
      userId: currentUser?.id || 'user-admin',
      createdAt: newProd.createdAt || new Date().toISOString()
    };
    await saveProductToFirestore(prodWithUser);
    if (currentUser) {
      await logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'ADD_PRODUCT', `Added product "${prodWithUser.name}"`);
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    const prodWithUser: Product = {
      ...updated,
      userId: updated.userId || currentUser?.id || 'user-admin'
    };
    await saveProductToFirestore(prodWithUser);
    if (currentUser) {
      await logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'UPDATE_PRODUCT', `Updated product "${prodWithUser.name}"`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const target = products.find(p => p.id === productId);
    await deleteProductFromFirestore(productId);
    if (currentUser && target) {
      await logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'DELETE_PRODUCT', `Deleted product "${target.name}"`);
    }
  };

  // Expense CRUD with Firestore Sync
  const handleAddExpense = async (expense: Expense) => {
    const expWithUser: Expense = {
      ...expense,
      userId: currentUser?.id || 'user-admin'
    };
    await saveExpenseToFirestore(expWithUser);
    if (currentUser) {
      await logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'ADD_EXPENSE', `Logged expense "${expense.title}" of $${expense.amount}`);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpenseFromFirestore(expenseId);
  };

  // Customer CRUD with Firestore Sync
  const handleAddCustomer = async (customer: Customer) => {
    const custWithUser: Customer = {
      ...customer,
      userId: currentUser?.id || 'user-admin'
    };
    await saveCustomerToFirestore(custWithUser);
    if (currentUser) {
      await logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'ADD_CUSTOMER', `Registered customer "${customer.name}"`);
    }
  };

  // Order Status update (e.g. Mark Draft as Completed)
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    await updateOrderStatusInFirestore(orderId, status);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrderFromFirestore(orderId);
  };

  // Table Status
  const handleUpdateTableStatus = async (tableId: string, status: TableInfo['status']) => {
    const t = tables.find(item => item.id === tableId);
    if (t) {
      const updated = { ...t, status };
      await saveTableToFirestore(updated);
    }
  };

  const handleSelectTableForPOS = (tableName: string) => {
    setSelectedTable(tableName);
    setActiveView('pos');
  };

  // Settings update with Firestore sync
  const handleUpdateSettings = async (newSettings: ShopSettings) => {
    setSettings(newSettings);
    await saveSettingsToFirestore(newSettings);
  };

  // Reset to initial demo data
  const handleResetData = async () => {
    for (const p of INITIAL_PRODUCTS) {
      await saveProductToFirestore({ ...p, userId: currentUser?.id || 'user-admin' });
    }
    for (const o of INITIAL_ORDERS) {
      await saveOrderToFirestore({ ...o, userId: currentUser?.id || 'user-admin' });
    }
    for (const e of INITIAL_EXPENSES) {
      await saveExpenseToFirestore({ ...e, userId: currentUser?.id || 'user-admin' });
    }
    for (const c of INITIAL_CUSTOMERS) {
      await saveCustomerToFirestore({ ...c, userId: currentUser?.id || 'user-admin' });
    }
    await saveSettingsToFirestore(INITIAL_SETTINGS);
  };

  // If user is not logged in, display the dedicated Welcome / Auth page
  if (!currentUser) {
    return (
      <WelcomeAuthPage
        onLoginSuccess={handleLoginSuccess}
        language={language}
        setLanguage={setLanguage}
        users={users}
      />
    );
  }

  // If Admin is in dedicated Admin Console View
  if (activeView === 'admin_console' && currentUser.role === 'admin') {
    return (
      <>
        <AdminConsole
          currentUser={currentUser}
          users={users}
          activityLogs={activityLogs}
          language={language}
          onNavigateToPos={() => setActiveView('pos')}
          onLogout={handleLogout}
          onUpdateCurrentUser={handleUpdateCurrentUser}
        />
        {isProfileModalOpen && (
          <UserProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentUser={currentUser}
            onUpdateUser={handleUpdateCurrentUser}
            onUserUpdated={handleUpdateCurrentUser}
            language={language}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f5f6fa] flex text-slate-800 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* 1. Left Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 md:relative md:z-auto transition-all duration-200 ${
        mobileSidebarOpen 
          ? 'translate-x-0 opacity-100 visible pointer-events-auto' 
          : '-translate-x-full opacity-0 invisible md:opacity-100 md:visible md:translate-x-0 pointer-events-none md:pointer-events-auto'
      }`}>
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view);
            setMobileSidebarOpen(false);
          }}
          openBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          ordersCount={userOrders.length}
          productsCount={userProducts.length}
          language={language}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0 max-w-full h-screen overflow-y-auto overflow-x-hidden touch-scroll">
        {/* Top Header */}
        <Header
          products={userProducts}
          onSelectProduct={(p) => {
            handleAddToCart(p);
            setActiveView('pos');
          }}
          openBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          openNewProductModal={() => setActiveView('products')}
          language={language}
          setLanguage={setLanguage}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAdminConsole={() => setActiveView('admin_console')}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Body View Router */}
        <main className="p-3 sm:p-5 lg:p-6 flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {activeView === 'pos' && (
            <div className="flex-1 flex flex-col">
              {/* Top 4 Stat Cards */}
              <StatCards
                orders={userOrders}
                customers={userCustomers}
                expenses={userExpenses}
                language={language}
              />

              {/* POS Dual Panel Layout */}
              <div className="flex-1 flex flex-col xl:flex-row gap-6 items-start">
                {/* Center / Left Panel: Categories, Search, Products Grid */}
                <PosView
                  products={userProducts}
                  onAddToCart={handleAddToCart}
                  openBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
                  onNavigateToProducts={() => setActiveView('products')}
                  language={language}
                  khrRate={settings.khrExchangeRate}
                />

                {/* Right Panel: Current Order / Checkout Drawer */}
                <CartDrawer
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  tables={tables}
                  discount={discount}
                  discountType={discountType}
                  setDiscount={setDiscount}
                  setDiscountType={setDiscountType}
                  taxRate={settings.taxRate}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  orderNote={orderNote}
                  setOrderNote={setOrderNote}
                  onOpenPayment={() => setIsPaymentModalOpen(true)}
                  onSaveDraft={handleSaveDraft}
                  language={language}
                  khrRate={settings.khrExchangeRate}
                  isMobileOpen={isMobileCartOpen}
                  onCloseMobile={() => setIsMobileCartOpen(false)}
                  onOpenMobile={() => setIsMobileCartOpen(true)}
                />
              </div>
            </div>
          )}

          {activeView === 'products' && (
            <ProductsManager
              products={userProducts}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'income_reports' && (
            <IncomeReports
              orders={userOrders}
              expenses={userExpenses}
              products={userProducts}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'expenses' && (
            <ExpensesManager
              expenses={userExpenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'orders' && (
            <OrdersManager
              orders={userOrders}
              onViewReceipt={(ord) => setActiveReceiptOrder(ord)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'tables' && (
            <TablesManager
              tables={tables}
              onUpdateTableStatus={handleUpdateTableStatus}
              onSelectTableForPOS={handleSelectTableForPOS}
              language={language}
            />
          )}

          {activeView === 'customers' && (
            <CustomersManager
              customers={userCustomers}
              onAddCustomer={handleAddCustomer}
              language={language}
            />
          )}

          {activeView === 'settings' && (
            <SettingsManager
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetData={handleResetData}
              language={language}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Global Profile & Photo Modal */}
      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateCurrentUser}
          onUserUpdated={handleUpdateCurrentUser}
          language={language}
        />
      )}

      {/* Global Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        products={userProducts}
        onScanSuccess={handleBarcodeScanSuccess}
        language={language}
      />

      {/* Checkout / Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          cartItems={cartItems}
          subtotal={cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)}
          discount={discount}
          discountType={discountType}
          tax={Math.max(0, cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) - (discountType === 'percent' ? (cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * discount) / 100 : discount)) * settings.taxRate}
          taxRate={settings.taxRate}
          total={Math.max(0, cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) - (discountType === 'percent' ? (cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * discount) / 100 : discount)) + (Math.max(0, cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) - (discountType === 'percent' ? (cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * discount) / 100 : discount)) * settings.taxRate)}
          selectedTable={selectedTable}
          customerName={customerName}
          orderNote={orderNote}
          cashierName={currentUser?.fullName || cashierName}
          khrRate={settings.khrExchangeRate}
          language={language}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        order={activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
        settings={settings}
        language={language}
      />
    </div>
  );
}
