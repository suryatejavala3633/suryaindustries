import { PaddyRecord, SummaryStats } from '../types';

export const calculateSummaryStats = (data: PaddyRecord[]): SummaryStats => {
  const totalRecords = data.length;
  const totalNewBags = data.reduce((sum, record) => sum + record.newBags, 0);
  const totalOldBags = data.reduce((sum, record) => sum + record.oldBags, 0);
  const totalBags = data.reduce((sum, record) => sum + record.totalBags, 0);
  const totalQuintals = data.reduce((sum, record) => sum + record.totalQuintals, 0);
  
  const uniqueCenters = new Set(data.map(record => record.centerName)).size;
  const uniqueDistricts = new Set(data.map(record => record.district)).size;

  return {
    totalRecords,
    totalNewBags,
    totalOldBags,
    totalBags,
    totalQuintals,
    uniqueCenters,
    uniqueDistricts
  };
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatDecimal = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const calculateDaysDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getGSTRate = (gstSlab: string): number => {
  const rates: Record<string, number> = {
    'exempt': 0,
    '0%': 0,
    '5%': 5,
    '12%': 12,
    '18%': 18,
    '28%': 28
  };
  return rates[gstSlab] || 0;
};