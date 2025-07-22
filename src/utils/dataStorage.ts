// Data Storage Utility - Handles both Supabase and Local Storage
import { 
  PaddyRecord, 
  ByProduct, 
  Customer, 
  Product, 
  SaleInvoice, 
  Payment, 
  Expense, 
  HamaliWork, 
  LabourWage,
  SupervisorSalary,
  ElectricityBill,
  FCIConsignment,
  LorryFreight,
  RiceProduction,
  GunnyStock,
  FRKStock,
  GunnyUsage,
  FRKUsage,
  RexinSticker,
  ReconciliationRecord,
  OldGunnyDispatch,
  Purchase,
  PurchasePayment,
  SalesRecord,
  SalesPayment,
  Vendor,
  ByProductProduction,
  ByProductSale,
  ByProductPayment
} from '../types';

// Local Storage Keys
const STORAGE_KEYS = {
  BY_PRODUCTS: 'cmr_by_products',
  BY_PRODUCT_PRODUCTIONS: 'cmr_by_product_productions',
  BY_PRODUCT_SALES: 'cmr_by_product_sales',
  BY_PRODUCT_PAYMENTS: 'cmr_by_product_payments',
  CUSTOMERS: 'cmr_customers',
  PRODUCTS: 'cmr_products',
  SALES: 'cmr_sales',
  PAYMENTS: 'cmr_payments',
  EXPENSES: 'cmr_expenses',
  HAMALI_WORK: 'cmr_hamali_work',
  LABOUR_WAGES: 'cmr_labour_wages',
  SUPERVISOR_SALARIES: 'cmr_supervisor_salaries',
  ELECTRICITY_BILLS: 'cmr_electricity_bills',
  FCI_CONSIGNMENTS: 'cmr_fci_consignments',
  LORRY_FREIGHTS: 'cmr_lorry_freights',
  RICE_PRODUCTIONS: 'cmr_rice_productions',
  GUNNY_STOCKS: 'cmr_gunny_stocks',
  FRK_STOCKS: 'cmr_frk_stocks',
  REXIN_STICKERS: 'cmr_rexin_stickers',
  RECONCILIATIONS: 'cmr_reconciliations',
  GUNNY_DISPATCHES: 'cmr_gunny_dispatches',
  GUNNY_USAGE: 'cmr_gunny_usage',
  FRK_USAGE: 'cmr_frk_usage',
  PURCHASES: 'cmr_purchases',
  PURCHASE_PAYMENTS: 'cmr_purchase_payments',
  SALES_RECORDS: 'cmr_sales_records',
  SALES_PAYMENTS: 'cmr_sales_payments',
  VENDORS: 'cmr_vendors',
  LAST_SYNC: 'cmr_last_sync'
};

// Generic Local Storage Functions
export const saveToLocalStorage = <T>(key: string, data: T[]): void => {
  try {
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    console.log(`Saved ${data.length} items to ${key}`);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      console.log(`No data found for key: ${key}`);
      return [];
    }
    const parsed = JSON.parse(data);
    console.log(`Loaded ${parsed.length} items from ${key}`);
    return parsed;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
};

// Specific Data Storage Functions
export const saveByProducts = (data: ByProduct[]) => {
  console.log('Saving by-products:', data);
  saveToLocalStorage(STORAGE_KEYS.BY_PRODUCTS, data);
};

export const loadByProducts = (): ByProduct[] => {
  const data = loadFromLocalStorage<ByProduct>(STORAGE_KEYS.BY_PRODUCTS);
  console.log('Loaded by-products:', data);
  return data;
};

export const saveByProductProductions = (data: ByProductProduction[]) => {
  console.log('Saving by-product productions:', data);
  saveToLocalStorage(STORAGE_KEYS.BY_PRODUCT_PRODUCTIONS, data);
};

export const loadByProductProductions = (): ByProductProduction[] => {
  const data = loadFromLocalStorage<ByProductProduction>(STORAGE_KEYS.BY_PRODUCT_PRODUCTIONS);
  console.log('Loaded by-product productions:', data);
  return data;
};

export const saveByProductSales = (data: ByProductSale[]) => {
  console.log('Saving by-product sales:', data);
  saveToLocalStorage(STORAGE_KEYS.BY_PRODUCT_SALES, data);
};

export const loadByProductSales = (): ByProductSale[] => {
  const data = loadFromLocalStorage<ByProductSale>(STORAGE_KEYS.BY_PRODUCT_SALES);
  console.log('Loaded by-product sales:', data);
  return data;
};

export const saveByProductPayments = (data: ByProductPayment[]) => {
  console.log('Saving by-product payments:', data);
  saveToLocalStorage(STORAGE_KEYS.BY_PRODUCT_PAYMENTS, data);
};

export const loadByProductPayments = (): ByProductPayment[] => {
  const data = loadFromLocalStorage<ByProductPayment>(STORAGE_KEYS.BY_PRODUCT_PAYMENTS);
  console.log('Loaded by-product payments:', data);
  return data;
};

export const saveCustomers = (data: Customer[]) => {
  console.log('Saving customers:', data);
  saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, data);
};

export const loadCustomers = (): Customer[] => {
  const data = loadFromLocalStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
  console.log('Loaded customers:', data);
  return data;
};

export const saveProducts = (data: Product[]) => {
  console.log('Saving products:', data);
  saveToLocalStorage(STORAGE_KEYS.PRODUCTS, data);
};

export const loadProducts = (): Product[] => {
  const data = loadFromLocalStorage<Product>(STORAGE_KEYS.PRODUCTS);
  console.log('Loaded products:', data);
  return data;
};

export const saveSales = (data: SaleInvoice[]) => saveToLocalStorage(STORAGE_KEYS.SALES, data);
export const loadSales = (): SaleInvoice[] => loadFromLocalStorage(STORAGE_KEYS.SALES);

export const savePayments = (data: Payment[]) => saveToLocalStorage(STORAGE_KEYS.PAYMENTS, data);
export const loadPayments = (): Payment[] => loadFromLocalStorage(STORAGE_KEYS.PAYMENTS);

export const saveExpenses = (data: Expense[]) => {
  console.log('Saving expenses:', data);
  saveToLocalStorage(STORAGE_KEYS.EXPENSES, data);
};

export const loadExpenses = (): Expense[] => {
  const data = loadFromLocalStorage<Expense>(STORAGE_KEYS.EXPENSES);
  console.log('Loaded expenses:', data);
  return data;
};

export const saveHamaliWork = (data: HamaliWork[]) => saveToLocalStorage(STORAGE_KEYS.HAMALI_WORK, data);
export const loadHamaliWork = (): HamaliWork[] => loadFromLocalStorage(STORAGE_KEYS.HAMALI_WORK);

export const saveLabourWages = (data: LabourWage[]) => saveToLocalStorage(STORAGE_KEYS.LABOUR_WAGES, data);
export const loadLabourWages = (): LabourWage[] => loadFromLocalStorage(STORAGE_KEYS.LABOUR_WAGES);

export const saveSupervisorSalaries = (data: SupervisorSalary[]) => saveToLocalStorage(STORAGE_KEYS.SUPERVISOR_SALARIES, data);
export const loadSupervisorSalaries = (): SupervisorSalary[] => loadFromLocalStorage(STORAGE_KEYS.SUPERVISOR_SALARIES);

export const saveElectricityBills = (data: ElectricityBill[]) => saveToLocalStorage(STORAGE_KEYS.ELECTRICITY_BILLS, data);
export const loadElectricityBills = (): ElectricityBill[] => loadFromLocalStorage(STORAGE_KEYS.ELECTRICITY_BILLS);

export const saveFCIConsignments = (data: FCIConsignment[]) => saveToLocalStorage(STORAGE_KEYS.FCI_CONSIGNMENTS, data);
export const loadFCIConsignments = (): FCIConsignment[] => loadFromLocalStorage(STORAGE_KEYS.FCI_CONSIGNMENTS);

export const saveLorryFreights = (data: LorryFreight[]) => saveToLocalStorage(STORAGE_KEYS.LORRY_FREIGHTS, data);
export const loadLorryFreights = (): LorryFreight[] => loadFromLocalStorage(STORAGE_KEYS.LORRY_FREIGHTS);

export const saveRiceProductions = (data: RiceProduction[]) => saveToLocalStorage(STORAGE_KEYS.RICE_PRODUCTIONS, data);
export const loadRiceProductions = (): RiceProduction[] => loadFromLocalStorage(STORAGE_KEYS.RICE_PRODUCTIONS);

export const saveGunnyStocks = (data: GunnyStock[]) => saveToLocalStorage(STORAGE_KEYS.GUNNY_STOCKS, data);
export const loadGunnyStocks = (): GunnyStock[] => loadFromLocalStorage(STORAGE_KEYS.GUNNY_STOCKS);

export const saveGunnyUsage = (data: GunnyUsage[]) => saveToLocalStorage(STORAGE_KEYS.GUNNY_USAGE, data);
export const loadGunnyUsage = (): GunnyUsage[] => loadFromLocalStorage(STORAGE_KEYS.GUNNY_USAGE);

export const saveFRKStocks = (data: FRKStock[]) => saveToLocalStorage(STORAGE_KEYS.FRK_STOCKS, data);
export const loadFRKStocks = (): FRKStock[] => loadFromLocalStorage(STORAGE_KEYS.FRK_STOCKS);

export const saveFRKUsage = (data: FRKUsage[]) => saveToLocalStorage(STORAGE_KEYS.FRK_USAGE, data);
export const loadFRKUsage = (): FRKUsage[] => loadFromLocalStorage(STORAGE_KEYS.FRK_USAGE);
export const saveRexinStickers = (data: RexinSticker[]) => saveToLocalStorage(STORAGE_KEYS.REXIN_STICKERS, data);
export const loadRexinStickers = (): RexinSticker[] => loadFromLocalStorage(STORAGE_KEYS.REXIN_STICKERS);

export const saveReconciliations = (data: ReconciliationRecord[]) => {
  console.log('Saving reconciliations:', data);
  saveToLocalStorage(STORAGE_KEYS.RECONCILIATIONS, data);
};

export const loadReconciliations = (): ReconciliationRecord[] => {
  const data = loadFromLocalStorage<ReconciliationRecord>(STORAGE_KEYS.RECONCILIATIONS);
  console.log('Loaded reconciliations:', data);
  return data;
};

export const saveGunnyDispatches = (data: OldGunnyDispatch[]) => {
  console.log('Saving gunny dispatches:', data);
  saveToLocalStorage(STORAGE_KEYS.GUNNY_DISPATCHES, data);
};

export const loadGunnyDispatches = (): OldGunnyDispatch[] => {
  const data = loadFromLocalStorage<OldGunnyDispatch>(STORAGE_KEYS.GUNNY_DISPATCHES);
  console.log('Loaded gunny dispatches:', data);
  return data;
};

// New Payables and Receivables Storage Functions
export const savePurchases = (data: Purchase[]) => {
  console.log('Saving purchases:', data);
  saveToLocalStorage(STORAGE_KEYS.PURCHASES, data);
};

export const loadPurchases = (): Purchase[] => {
  const data = loadFromLocalStorage<Purchase>(STORAGE_KEYS.PURCHASES);
  console.log('Loaded purchases:', data);
  return data;
};

export const savePurchasePayments = (data: PurchasePayment[]) => {
  console.log('Saving purchase payments:', data);
  saveToLocalStorage(STORAGE_KEYS.PURCHASE_PAYMENTS, data);
};

export const loadPurchasePayments = (): PurchasePayment[] => {
  const data = loadFromLocalStorage<PurchasePayment>(STORAGE_KEYS.PURCHASE_PAYMENTS);
  console.log('Loaded purchase payments:', data);
  return data;
};

export const saveSalesRecords = (data: SalesRecord[]) => {
  console.log('Saving sales records:', data);
  saveToLocalStorage(STORAGE_KEYS.SALES_RECORDS, data);
};

export const loadSalesRecords = (): SalesRecord[] => {
  const data = loadFromLocalStorage<SalesRecord>(STORAGE_KEYS.SALES_RECORDS);
  console.log('Loaded sales records:', data);
  return data;
};

export const saveSalesPayments = (data: SalesPayment[]) => {
  console.log('Saving sales payments:', data);
  saveToLocalStorage(STORAGE_KEYS.SALES_PAYMENTS, data);
};

export const loadSalesPayments = (): SalesPayment[] => {
  const data = loadFromLocalStorage<SalesPayment>(STORAGE_KEYS.SALES_PAYMENTS);
  console.log('Loaded sales payments:', data);
  return data;
};

export const saveVendors = (data: Vendor[]) => {
  console.log('Saving vendors:', data);
  saveToLocalStorage(STORAGE_KEYS.VENDORS, data);
};

export const loadVendors = (): Vendor[] => {
  const data = loadFromLocalStorage<Vendor>(STORAGE_KEYS.VENDORS);
  console.log('Loaded vendors:', data);
  return data;
};

// Backup and Restore Functions
export const exportAllData = () => {
  const allData = {
    byProducts: loadByProducts(),
    customers: loadCustomers(),
    products: loadProducts(),
    sales: loadSales(),
    payments: loadPayments(),
    expenses: loadExpenses(),
    hamaliWork: loadHamaliWork(),
    labourWages: loadLabourWages(),
    supervisorSalaries: loadSupervisorSalaries(),
    electricityBills: loadElectricityBills(),
    fciConsignments: loadFCIConsignments(),
    lorryFreights: loadLorryFreights(),
    riceProductions: loadRiceProductions(),
    gunnyStocks: loadGunnyStocks(),
    frkStocks: loadFRKStocks(),
    rexinStickers: loadRexinStickers(),
    reconciliations: loadReconciliations(),
    gunnyDispatches: loadGunnyDispatches(),
    purchases: loadPurchases(),
    purchasePayments: loadPurchasePayments(),
    salesRecords: loadSalesRecords(),
    salesPayments: loadSalesPayments(),
    vendors: loadVendors(),
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `cmr-paddy-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importAllData = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.version || !data.exportDate) {
          throw new Error('Invalid backup file format');
        }

        // Import all data
        if (data.byProducts) saveByProducts(data.byProducts);
        if (data.byProductProductions) saveByProductProductions(data.byProductProductions);
        if (data.byProductSales) saveByProductSales(data.byProductSales);
        if (data.byProductPayments) saveByProductPayments(data.byProductPayments);
        if (data.customers) saveCustomers(data.customers);
        if (data.products) saveProducts(data.products);
        if (data.sales) saveSales(data.sales);
        if (data.payments) savePayments(data.payments);
        if (data.expenses) saveExpenses(data.expenses);
        if (data.hamaliWork) saveHamaliWork(data.hamaliWork);
        if (data.labourWages) saveLabourWages(data.labourWages);
        if (data.supervisorSalaries) saveSupervisorSalaries(data.supervisorSalaries);
        if (data.electricityBills) saveElectricityBills(data.electricityBills);
        if (data.fciConsignments) saveFCIConsignments(data.fciConsignments);
        if (data.lorryFreights) saveLorryFreights(data.lorryFreights);
        if (data.riceProductions) saveRiceProductions(data.riceProductions);
        if (data.gunnyStocks) saveGunnyStocks(data.gunnyStocks);
        if (data.frkStocks) saveFRKStocks(data.frkStocks);
        if (data.rexinStickers) saveRexinStickers(data.rexinStickers);
        if (data.reconciliations) saveReconciliations(data.reconciliations);
        if (data.gunnyDispatches) saveGunnyDispatches(data.gunnyDispatches);
        if (data.purchases) savePurchases(data.purchases);
        if (data.purchasePayments) savePurchasePayments(data.purchasePayments);
        if (data.salesRecords) saveSalesRecords(data.salesRecords);
        if (data.salesPayments) saveSalesPayments(data.salesPayments);
        if (data.vendors) saveVendors(data.vendors);

        resolve(true);
      } catch (error) {
        console.error('Error importing data:', error);
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Clear all local data
export const clearAllLocalData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('All local data cleared');
};

// Get storage info
export const getStorageInfo = () => {
  const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  const totalItems = Object.values(STORAGE_KEYS).reduce((count, key) => {
    if (key === STORAGE_KEYS.LAST_SYNC) return count;
    const data = loadFromLocalStorage(key);
    return count + data.length;
  }, 0);

  return {
    lastSync: lastSync ? new Date(lastSync) : null,
    totalItems,
    storageUsed: new Blob([JSON.stringify(getAllLocalData())]).size
  };
};

const getAllLocalData = () => {
  return {
    byProducts: loadByProducts(),
    byProductProductions: loadByProductProductions(),
    byProductSales: loadByProductSales(),
    byProductPayments: loadByProductPayments(),
    byProductProductions: loadByProductProductions(),
    byProductSales: loadByProductSales(),
    byProductPayments: loadByProductPayments(),
    customers: loadCustomers(),
    products: loadProducts(),
    sales: loadSales(),
    payments: loadPayments(),
    expenses: loadExpenses(),
    hamaliWork: loadHamaliWork(),
    labourWages: loadLabourWages(),
    supervisorSalaries: loadSupervisorSalaries(),
    electricityBills: loadElectricityBills(),
    fciConsignments: loadFCIConsignments(),
    lorryFreights: loadLorryFreights(),
    riceProductions: loadRiceProductions(),
    gunnyStocks: loadGunnyStocks(),
    gunnyUsage: loadGunnyUsage(),
    frkStocks: loadFRKStocks(),
    frkUsage: loadFRKUsage(),
    rexinStickers: loadRexinStickers(),
    reconciliations: loadReconciliations(),
    gunnyDispatches: loadGunnyDispatches(),
    purchases: loadPurchases(),
    purchasePayments: loadPurchasePayments(),
    salesRecords: loadSalesRecords(),
    salesPayments: loadSalesPayments(),
    vendors: loadVendors()
  };
};