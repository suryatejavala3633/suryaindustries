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
  RexinSticker,
  ReconciliationRecord,
  OldGunnyDispatch
} from '../types';

// Local Storage Keys
const STORAGE_KEYS = {
  BY_PRODUCTS: 'cmr_by_products',
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
  LAST_SYNC: 'cmr_last_sync'
};

// Generic Local Storage Functions
export const saveToLocalStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
};

// Specific Data Storage Functions
export const saveByProducts = (data: ByProduct[]) => saveToLocalStorage(STORAGE_KEYS.BY_PRODUCTS, data);
export const loadByProducts = (): ByProduct[] => loadFromLocalStorage(STORAGE_KEYS.BY_PRODUCTS);

export const saveCustomers = (data: Customer[]) => saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, data);
export const loadCustomers = (): Customer[] => loadFromLocalStorage(STORAGE_KEYS.CUSTOMERS);

export const saveProducts = (data: Product[]) => saveToLocalStorage(STORAGE_KEYS.PRODUCTS, data);
export const loadProducts = (): Product[] => loadFromLocalStorage(STORAGE_KEYS.PRODUCTS);

export const saveSales = (data: SaleInvoice[]) => saveToLocalStorage(STORAGE_KEYS.SALES, data);
export const loadSales = (): SaleInvoice[] => loadFromLocalStorage(STORAGE_KEYS.SALES);

export const savePayments = (data: Payment[]) => saveToLocalStorage(STORAGE_KEYS.PAYMENTS, data);
export const loadPayments = (): Payment[] => loadFromLocalStorage(STORAGE_KEYS.PAYMENTS);

export const saveExpenses = (data: Expense[]) => saveToLocalStorage(STORAGE_KEYS.EXPENSES, data);
export const loadExpenses = (): Expense[] => loadFromLocalStorage(STORAGE_KEYS.EXPENSES);

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

export const saveFRKStocks = (data: FRKStock[]) => saveToLocalStorage(STORAGE_KEYS.FRK_STOCKS, data);
export const loadFRKStocks = (): FRKStock[] => loadFromLocalStorage(STORAGE_KEYS.FRK_STOCKS);

export const saveRexinStickers = (data: RexinSticker[]) => saveToLocalStorage(STORAGE_KEYS.REXIN_STICKERS, data);
export const loadRexinStickers = (): RexinSticker[] => loadFromLocalStorage(STORAGE_KEYS.REXIN_STICKERS);

export const saveReconciliations = (data: ReconciliationRecord[]) => saveToLocalStorage(STORAGE_KEYS.RECONCILIATIONS, data);
export const loadReconciliations = (): ReconciliationRecord[] => loadFromLocalStorage(STORAGE_KEYS.RECONCILIATIONS);

export const saveGunnyDispatches = (data: OldGunnyDispatch[]) => saveToLocalStorage(STORAGE_KEYS.GUNNY_DISPATCHES, data);
export const loadGunnyDispatches = (): OldGunnyDispatch[] => loadFromLocalStorage(STORAGE_KEYS.GUNNY_DISPATCHES);

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
    gunnyDispatches: loadGunnyDispatches()
  };
};