export interface PaddyRecord {
  sNo: number;
  date: string;
  vehicleNo: string;
  wSlipNo: number;
  truckchitNo: number;
  centerName: string;
  district: string;
  newBags: number;
  oldBags: number;
  totalBags: number;
  totalQuintals: number;
  moisture: number | null;
  unloadingPoint: string;
}

export interface SummaryStats {
  totalRecords: number;
  totalNewBags: number;
  totalOldBags: number;
  totalBags: number;
  totalQuintals: number;
  uniqueCenters: number;
  uniqueDistricts: number;
}

export interface ReconciliationRecord {
  id: string;
  centerName: string;
  district: string;
  totalPaddyReceived: number;
  totalQuintals: number;
  reconciledQuintals: number;
  balanceQuintals: number;
  reconciliationStatus: 'pending' | 'completed' | 'in-progress';
  reconciliationDate?: string;
  reconciliationDocument?: string;
  notes?: string;
}

export interface OldGunnyDispatch {
  id: string;
  centerName: string;
  district: string;
  gunniesDispatched: number;
  dispatchDate: string;
  acknowledgmentReceived: boolean;
  acknowledgmentDate?: string;
  acknowledgmentPhoto?: string;
  comments?: string;
  status: 'dispatched' | 'acknowledged';
}

export interface GunnyReturn {
  id: string;
  centerName: string;
  district: string;
  totalGunniesReturned: number;
  returnDate: string;
  acknowledgementPhoto?: string;
  status: 'prepared' | 'dispatched' | 'acknowledged';
  notes?: string;
}

export interface GunnyStock {
  id: string;
  type: '2024-25-new' | '2023-24-leftover';
  quantity: number;
  source: 'new-bales' | 'received-with-paddy';
  dateReceived: string;
  notes?: string;
}

export interface FRKStock {
  id: string;
  quantity: number; // in kg
  supplier: string;
  bags: number; // Each bag is 20 kg
  batchNumber: string;
  certificateNumber: string;
  premixCertificateNumber: string;
  dateReceived: string;
  expiryDate?: string;
  frkTestCertificate?: string;
  premixTestCertificate?: string;
  notes?: string;
}

export interface RiceProduction {
  id: string;
  ackNumber: string;
  riceType: 'boiled' | 'raw';
  paddyUsed: number; // in quintals
  riceProduced: number; // in quintals (287.1 Qtl per ACK)
  millersDue: number; // Removed but kept for compatibility
  productionDate: string;
  millName?: string;
  notes?: string;
}

export interface FCIConsignment {
  id: string;
  ackNumber: string;
  riceQuantity: number; // 287.1 quintals
  frkQuantity: number; // 290 kg
  totalBags: number; // 580 bags
  gunnyType: '2024-25-new' | '2023-24-leftover';
  stickersUsed: number; // 580 stickers
  consignmentDate: string;
  status: 'in-transit' | 'dumping-done' | 'qc-passed' | 'rejected' | 'dispatched';
  lorryNumber?: string;
  transporterName?: string;
  eWayBill?: string;
  fciWeight?: number;
  fciMoisture?: number;
  fciUnloadingHamali?: string;
  fciPassingFee?: string;
  passingFeePaid?: boolean;
  notes?: string;
}

export interface LorryFreight {
  id: string;
  consignmentId: string;
  ackNumber: string;
  lorryNumber: string;
  transporterName: string;
  quantityMT: number; // Quantity in Metric Tons (29 MT for 290 Qtl)
  freightPerMT: number; // Rate per MT
  grossFreightAmount: number; // Total before deductions
  deductions: { id: string; description: string; amount: number }[]; // Manual deductions
  netFreightAmount: number; // After all deductions
  advancePaid: number;
  balanceAmount: number;
  dispatchDate: string;
  paymentStatus: 'pending' | 'advance-paid' | 'fully-paid';
  notes?: string;
  isBranConsignment?: boolean;
}

export interface Transporter {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  lorryNumbers: string[]; // Associated lorry numbers
  defaultRate?: number; // Default rate per MT
  notes?: string;
}

export interface RexinSticker {
  id: string;
  quantity: number;
  dateReceived: string;
  usedQuantity: number;
  remainingQuantity: number;
}

export interface ByProduct {
  id: string;
  name: string;
  type: 'bran-boiled' | 'bran-raw' | 'broken-rice' | 'param' | 'rejection-rice' | 'other';
  quantity: number; // in quintals
  productionDate: string;
  riceProductionId?: string; // Link to rice production batch
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  creditLimit: number;
  paymentTerms: number; // days
  createdDate: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'rice' | 'bran' | 'broken-rice' | 'param' | 'rejection-rice' | 'service' | 'other';
  unit: 'qtl' | 'kg' | 'bag' | 'hour' | 'day' | 'trip' | 'piece';
  baseRate: number;
  gstSlab: 'exempt' | '0%' | '5%' | '12%' | '18%' | '28%';
  description?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  items: SaleInvoiceItem[];
  subtotal: number;
  gstAmount: number;
  additionalCharges: AdditionalCharge[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface SaleInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  gstRate: number;
  amount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface AdditionalCharge {
  id: string;
  description: string;
  amount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'upi' | 'other';
  referenceNumber?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: 'electricity' | 'freight' | 'salary' | 'repairs' | 'spares' | 'fuel' | 'other';
  description: string;
  amount: number;
  expenseDate: string;
  vendorName?: string;
  billNumber?: string;
  gstAmount?: number;
  paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'upi' | 'other';
  notes?: string;
}

// Hamali Management Types
export interface HamaliWork {
  id: string;
  workerName: string;
  workType: 'unloading-paddy' | 'loading-rice' | 'cleaning' | 'bagging' | 'gunny-repair' | 'other';
  workDescription: string;
  quantity: number;
  unit: 'bags' | 'qtl' | 'ton' | 'ack' | 'bale' | 'hours' | 'days' | 'pieces';
  ratePerUnit: number;
  totalAmount: number;
  workDate: string;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
}

export interface HamaliPayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank-transfer' | 'upi';
  workPeriod: string; // e.g., "15-30 June 2025"
  notes?: string;
}

export interface SupervisorSalary {
  id: string;
  supervisorName: string;
  designation: string;
  monthlySalary: string;
  month: string; // YYYY-MM format
  paidAmount: string;
  paymentDate?: string;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
}

export interface LabourWage {
  id: string;
  workerName: string;
  workDescription: string;
  daysWorked: string;
  ratePerDay: string;
  totalAmount: number;
  workDate: string;
  advancePaid: string;
  remainingAmount: number;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
}

// Electricity Tracking
export interface ElectricityReading {
  id: string;
  readingDate: string;
  kwh: number;
  kvah: number;
  rmd: number; // Recorded Maximum Demand in kW
  billAmount: number;
  billPeriod: string;
  notes?: string;
}

export interface ElectricityBill {
  id: string;
  billMonth: string;
  billDate: string;
  dueDate: string;
  billNumber: string;
  previousKwh: number;
  currentKwh: number;
  previousKvah: number;
  currentKvah: number;
  rmd: number;
  contractDemand: number;
  fixedCharges: number;
  energyCharges: number;
  fuelSurcharge: number;
  edDuty: number;
  customerCharges: number;
  additionalCharges: number;
  billAmount: number;
  paymentStatus: 'pending' | 'paid';
  paymentDate?: string;
  paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'upi';
  notes?: string;
}