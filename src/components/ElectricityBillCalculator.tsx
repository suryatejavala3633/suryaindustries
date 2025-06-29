import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Edit, Save, X, Zap, Calendar, FileText, TrendingUp, AlertTriangle, Calculator, CreditCard, Clock } from 'lucide-react';
import { ElectricityReading, ElectricityBill } from '../types';
import { formatCurrency, formatDecimal } from '../utils/calculations';
import StatsCard from './StatsCard';

interface ElectricityBillCalculatorProps {
  onBack?: () => void;
}

const ElectricityBillCalculator: React.FC<ElectricityBillCalculatorProps> = ({ onBack }) => {
  const [electricityReadings, setElectricityReadings] = useState<ElectricityReading[]>([]);
  const [electricityBills, setElectricityBills] = useState<ElectricityBill[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [editingReading, setEditingReading] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [liveReadings, setLiveReadings] = useState({
    kwh: 0,
    kvah: 0,
    rmd: 0,
    lastUpdated: ''
  });

  const [readingForm, setReadingForm] = useState({
    readingDate: '',
    kwh: '',
    kvah: '',
    rmd: '',
    notes: ''
  });

  const [billForm, setBillForm] = useState({
    billMonth: '',
    billDate: '',
    dueDate: '',
    billNumber: '',
    previousKwh: '',
    currentKwh: '',
    previousKvah: '',
    currentKvah: '',
    rmd: '',
    contractDemand: '150',
    fixedCharges: '',
    energyCharges: '',
    fuelSurcharge: '',
    edDuty: '',
    customerCharges: '',
    additionalCharges: '',
    billAmount: '',
    paymentStatus: 'pending' as 'pending' | 'paid',
    paymentDate: '',
    paymentMethod: 'bank-transfer' as 'cash' | 'cheque' | 'bank-transfer' | 'upi',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    readingDate: '',
    kwh: '',
    kvah: '',
    rmd: '',
    notes: ''
  });

  const [editBillForm, setEditBillForm] = useState({
    billMonth: '',
    billDate: '',
    dueDate: '',
    billNumber: '',
    previousKwh: '',
    currentKwh: '',
    previousKvah: '',
    currentKvah: '',
    rmd: '',
    contractDemand: '',
    fixedCharges: '',
    energyCharges: '',
    fuelSurcharge: '',
    edDuty: '',
    customerCharges: '',
    additionalCharges: '',
    billAmount: '',
    paymentStatus: 'pending' as 'pending' | 'paid',
    paymentDate: '',
    paymentMethod: 'bank-transfer' as 'cash' | 'cheque' | 'bank-transfer' | 'upi',
    notes: ''
  });

  const [liveReadingForm, setLiveReadingForm] = useState({
    kwh: '',
    kvah: '',
    rmd: ''
  });

  // Calculate summary stats
  const totalBillAmount = useMemo(() => 
    electricityBills.reduce((sum, bill) => sum + bill.billAmount, 0), 
    [electricityBills]
  );
  
  const totalKwhConsumed = useMemo(() => 
    electricityBills.reduce((sum, bill) => sum + (parseFloat(bill.currentKwh) - parseFloat(bill.previousKwh)), 0), 
    [electricityBills]
  );
  
  const totalKvahConsumed = useMemo(() => 
    electricityBills.reduce((sum, bill) => sum + (parseFloat(bill.currentKvah) - parseFloat(bill.previousKvah)), 0), 
    [electricityBills]
  );
  
  const averagePowerFactor = useMemo(() => 
    totalKvahConsumed > 0 ? totalKwhConsumed / totalKvahConsumed : 0, 
    [totalKwhConsumed, totalKvahConsumed]
  );

  const averageCostPerUnit = useMemo(() => 
    totalKwhConsumed > 0 ? totalBillAmount / totalKwhConsumed : 0, 
    [totalBillAmount, totalKwhConsumed]
  );

  // Calculate live bill amount based on last bill's rate
  const liveBillEstimate = useMemo(() => {
    if (electricityBills.length === 0 || liveReadings.kwh === 0) return 0;
    
    const lastBill = electricityBills[electricityBills.length - 1];
    const kwhConsumed = parseFloat(lastBill.currentKwh) - parseFloat(lastBill.previousKwh);
    const ratePerUnit = lastBill.billAmount / kwhConsumed;
    
    // Assuming the last reading is the current reading in the last bill
    const estimatedConsumption = liveReadings.kwh - parseFloat(lastBill.currentKwh);
    
    return estimatedConsumption * ratePerUnit;
  }, [electricityBills, liveReadings.kwh]);

  // Calculate live power factor
  const livePowerFactor = useMemo(() => 
    liveReadings.kvah > 0 ? liveReadings.kwh / liveReadings.kvah : 0, 
    [liveReadings]
  );

  // Calculate bill amount based on TGSPDCL formula
  const calculateBillAmount = () => {
    // Parse input values
    const contractDemand = parseFloat(billForm.contractDemand);
    const rmd = parseFloat(billForm.rmd);
    const kwhConsumed = parseFloat(billForm.currentKwh) - parseFloat(billForm.previousKwh);
    const kvahConsumed = parseFloat(billForm.currentKvah) - parseFloat(billForm.previousKvah);
    const powerFactor = kwhConsumed / kvahConsumed;
    
    // Calculate billing demand (80% of Contract Demand or Recorded Maximum Demand, whichever is higher)
    const billingDemand = Math.max(contractDemand * 0.8, rmd);
    
    // Fixed charges - Rs. 475 per kVA on billing demand
    const fixedCharges = billingDemand * 475;
    
    // Energy charges - Rs. 6.70 per unit for HT-II(A) category
    const energyCharges = kwhConsumed * 6.70;
    
    // Fuel surcharge adjustment - Rs. 1.85 per unit (approximate, can vary)
    const fuelSurcharge = kwhConsumed * 1.85;
    
    // Electricity duty - 6% of (fixed charges + energy charges)
    const edDuty = (fixedCharges + energyCharges) * 0.06;
    
    // Customer charges - fixed Rs. 250 for HT consumers
    const customerCharges = 250;
    
    // Power factor penalty/incentive
    let pfAdjustment = 0;
    if (powerFactor < 0.95) {
      // 1% extra charge for every 0.01 fall in PF below 0.95
      pfAdjustment = (energyCharges + fixedCharges) * ((0.95 - powerFactor) * 100) * 0.01;
    } else if (powerFactor > 0.95) {
      // 0.5% rebate for every 0.01 improvement in PF above 0.95
      pfAdjustment = -1 * (energyCharges + fixedCharges) * ((powerFactor - 0.95) * 100) * 0.005;
    }
    
    // Total bill amount
    const totalBill = fixedCharges + energyCharges + fuelSurcharge + edDuty + customerCharges + pfAdjustment;
    
    // Update form with calculated values
    setBillForm({
      ...billForm,
      fixedCharges: fixedCharges.toFixed(2),
      energyCharges: energyCharges.toFixed(2),
      fuelSurcharge: fuelSurcharge.toFixed(2),
      edDuty: edDuty.toFixed(2),
      customerCharges: customerCharges.toFixed(2),
      additionalCharges: pfAdjustment.toFixed(2),
      billAmount: totalBill.toFixed(2)
    });
  };

  const handleReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReading: ElectricityReading = {
      id: Date.now().toString(),
      readingDate: readingForm.readingDate,
      kwh: parseFloat(readingForm.kwh),
      kvah: parseFloat(readingForm.kvah),
      rmd: parseFloat(readingForm.rmd),
      notes: readingForm.notes
    };
    
    setElectricityReadings([...electricityReadings, newReading]);
    setReadingForm({ readingDate: '', kwh: '', kvah: '', rmd: '', notes: '' });
    setShowAddForm(false);
  };

  const handleBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBill: ElectricityBill = {
      id: Date.now().toString(),
      billMonth: billForm.billMonth,
      billDate: billForm.billDate,
      dueDate: billForm.dueDate,
      billNumber: billForm.billNumber,
      previousKwh: parseFloat(billForm.previousKwh),
      currentKwh: parseFloat(billForm.currentKwh),
      previousKvah: parseFloat(billForm.previousKvah),
      currentKvah: parseFloat(billForm.currentKvah),
      rmd: parseFloat(billForm.rmd),
      contractDemand: parseFloat(billForm.contractDemand),
      fixedCharges: parseFloat(billForm.fixedCharges),
      energyCharges: parseFloat(billForm.energyCharges),
      fuelSurcharge: parseFloat(billForm.fuelSurcharge),
      edDuty: parseFloat(billForm.edDuty),
      customerCharges: parseFloat(billForm.customerCharges),
      additionalCharges: parseFloat(billForm.additionalCharges),
      billAmount: parseFloat(billForm.billAmount),
      paymentStatus: billForm.paymentStatus,
      paymentDate: billForm.paymentDate,
      paymentMethod: billForm.paymentMethod,
      notes: billForm.notes
    };
    
    setElectricityBills([...electricityBills, newBill]);
    setBillForm({
      billMonth: '',
      billDate: '',
      dueDate: '',
      billNumber: '',
      previousKwh: '',
      currentKwh: '',
      previousKvah: '',
      currentKvah: '',
      rmd: '',
      contractDemand: '150',
      fixedCharges: '',
      energyCharges: '',
      fuelSurcharge: '',
      edDuty: '',
      customerCharges: '',
      additionalCharges: '',
      billAmount: '',
      paymentStatus: 'pending',
      paymentDate: '',
      paymentMethod: 'bank-transfer',
      notes: ''
    });
    setShowBillForm(false);
  };

  const startEdit = (reading: ElectricityReading) => {
    setEditingReading(reading.id);
    setEditForm({
      readingDate: reading.readingDate,
      kwh: reading.kwh.toString(),
      kvah: reading.kvah.toString(),
      rmd: reading.rmd.toString(),
      notes: reading.notes || ''
    });
  };

  const startEditBill = (bill: ElectricityBill) => {
    setEditingBill(bill.id);
    setEditBillForm({
      billMonth: bill.billMonth,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      billNumber: bill.billNumber,
      previousKwh: bill.previousKwh.toString(),
      currentKwh: bill.currentKwh.toString(),
      previousKvah: bill.previousKvah.toString(),
      currentKvah: bill.currentKvah.toString(),
      rmd: bill.rmd.toString(),
      contractDemand: bill.contractDemand.toString(),
      fixedCharges: bill.fixedCharges.toString(),
      energyCharges: bill.energyCharges.toString(),
      fuelSurcharge: bill.fuelSurcharge.toString(),
      edDuty: bill.edDuty.toString(),
      customerCharges: bill.customerCharges.toString(),
      additionalCharges: bill.additionalCharges.toString(),
      billAmount: bill.billAmount.toString(),
      paymentStatus: bill.paymentStatus,
      paymentDate: bill.paymentDate || '',
      paymentMethod: bill.paymentMethod,
      notes: bill.notes || ''
    });
  };

  const saveEdit = (id: string) => {
    setElectricityReadings(electricityReadings.map(reading => 
      reading.id === id ? {
        ...reading,
        readingDate: editForm.readingDate,
        kwh: parseFloat(editForm.kwh),
        kvah: parseFloat(editForm.kvah),
        rmd: parseFloat(editForm.rmd),
        notes: editForm.notes
      } : reading
    ));
    setEditingReading(null);
  };

  const saveEditBill = (id: string) => {
    setElectricityBills(electricityBills.map(bill => 
      bill.id === id ? {
        ...bill,
        billMonth: editBillForm.billMonth,
        billDate: editBillForm.billDate,
        dueDate: editBillForm.dueDate,
        billNumber: editBillForm.billNumber,
        previousKwh: parseFloat(editBillForm.previousKwh),
        currentKwh: parseFloat(editBillForm.currentKwh),
        previousKvah: parseFloat(editBillForm.previousKvah),
        currentKvah: parseFloat(editBillForm.currentKvah),
        rmd: parseFloat(editBillForm.rmd),
        contractDemand: parseFloat(editBillForm.contractDemand),
        fixedCharges: parseFloat(editBillForm.fixedCharges),
        energyCharges: parseFloat(editBillForm.energyCharges),
        fuelSurcharge: parseFloat(editBillForm.fuelSurcharge),
        edDuty: parseFloat(editBillForm.edDuty),
        customerCharges: parseFloat(editBillForm.customerCharges),
        additionalCharges: parseFloat(editBillForm.additionalCharges),
        billAmount: parseFloat(editBillForm.billAmount),
        paymentStatus: editBillForm.paymentStatus,
        paymentDate: editBillForm.paymentDate,
        paymentMethod: editBillForm.paymentMethod,
        notes: editBillForm.notes
      } : bill
    ));
    setEditingBill(null);
  };

  const cancelEdit = () => {
    setEditingReading(null);
    setEditForm({ readingDate: '', kwh: '', kvah: '', rmd: '', notes: '' });
  };

  const cancelEditBill = () => {
    setEditingBill(null);
    setEditBillForm({
      billMonth: '',
      billDate: '',
      dueDate: '',
      billNumber: '',
      previousKwh: '',
      currentKwh: '',
      previousKvah: '',
      currentKvah: '',
      rmd: '',
      contractDemand: '',
      fixedCharges: '',
      energyCharges: '',
      fuelSurcharge: '',
      edDuty: '',
      customerCharges: '',
      additionalCharges: '',
      billAmount: '',
      paymentStatus: 'pending',
      paymentDate: '',
      paymentMethod: 'bank-transfer',
      notes: ''
    });
  };

  const updateLiveReadings = () => {
    const newLiveReadings = {
      kwh: parseFloat(liveReadingForm.kwh),
      kvah: parseFloat(liveReadingForm.kvah),
      rmd: parseFloat(liveReadingForm.rmd),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    setLiveReadings(newLiveReadings);
    setLiveReadingForm({ kwh: '', kvah: '', rmd: '' });
  };

  const exportElectricityData = () => {
    const csvContent = [
      ['Bill Month', 'Bill Number', 'Bill Date', 'Due Date', 'Previous KWH', 'Current KWH', 'KWH Consumed', 'Previous KVAH', 'Current KVAH', 'KVAH Consumed', 'Power Factor', 'RMD (kW)', 'Fixed Charges', 'Energy Charges', 'Fuel Surcharge', 'ED Duty', 'Customer Charges', 'Additional Charges', 'Bill Amount', 'Payment Status', 'Payment Date', 'Payment Method', 'Notes'],
      ...electricityBills.map(bill => [
        bill.billMonth,
        bill.billNumber,
        bill.billDate,
        bill.dueDate,
        bill.previousKwh,
        bill.currentKwh,
        (bill.currentKwh - bill.previousKwh).toFixed(2),
        bill.previousKvah,
        bill.currentKvah,
        (bill.currentKvah - bill.previousKvah).toFixed(2),
        ((bill.currentKwh - bill.previousKwh) / (bill.currentKvah - bill.previousKvah)).toFixed(2),
        bill.rmd,
        bill.fixedCharges,
        bill.energyCharges,
        bill.fuelSurcharge,
        bill.edDuty,
        bill.customerCharges,
        bill.additionalCharges,
        bill.billAmount,
        bill.paymentStatus,
        bill.paymentDate || '',
        bill.paymentMethod,
        bill.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'electricity-bill-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate electricity cost per ACK (assuming 290 quintals per ACK)
  const calculateElectricityCostPerAck = () => {
    if (totalKwhConsumed === 0) return 0;
    
    // Assuming an average of 65 units (KWH) per ACK of rice production
    const estimatedAcks = totalKwhConsumed / 65;
    return estimatedAcks > 0 ? totalBillAmount / estimatedAcks : 0;
  };

  // Update bill calculation when form values change
  useEffect(() => {
    if (
      billForm.currentKwh && 
      billForm.previousKwh && 
      billForm.currentKvah && 
      billForm.previousKvah && 
      billForm.rmd && 
      billForm.contractDemand
    ) {
      calculateBillAmount();
    }
  }, [
    billForm.currentKwh, 
    billForm.previousKwh, 
    billForm.currentKvah, 
    billForm.previousKvah, 
    billForm.rmd, 
    billForm.contractDemand
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Electricity Bill Management</h1>
            <p className="text-gray-600 mt-2">Monitor electricity usage, calculate power factor and track bill amounts</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportElectricityData}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            <button
              onClick={() => setShowBillForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Consumption"
            value={`${formatDecimal(totalKwhConsumed)} KWH`}
            subtitle={`${formatDecimal(totalKvahConsumed)} KVAH`}
            icon={<Zap className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Power Factor"
            value={formatDecimal(averagePowerFactor, 2)}
            subtitle="Average PF"
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Total Bill Amount"
            value={formatCurrency(totalBillAmount)}
            icon={<FileText className="h-6 w-6" />}
            color="from-red-500 to-red-600"
          />
          <StatsCard
            title="Cost Per Unit"
            value={formatCurrency(averageCostPerUnit)}
            subtitle="Per KWH"
            icon={<Calendar className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Cost Per ACK"
            value={formatCurrency(calculateElectricityCostPerAck())}
            subtitle="Electricity cost"
            icon={<AlertTriangle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Live Readings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Electricity Monitoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Current Readings</h4>
                <div className="space-y-2">
                  {liveReadings.lastUpdated ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">KWH Reading:</span>
                        <span className="font-semibold">{formatDecimal(liveReadings.kwh)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">KVAH Reading:</span>
                        <span className="font-semibold">{formatDecimal(liveReadings.kvah)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">RMD (kW):</span>
                        <span className="font-semibold">{formatDecimal(liveReadings.rmd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Power Factor:</span>
                        <span className={`font-semibold ${livePowerFactor < 0.95 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDecimal(livePowerFactor, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-semibold">{liveReadings.lastUpdated}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No live readings available. Update readings to see data.</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Update Live Readings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KWH Reading</label>
                    <input
                      type="number"
                      step="0.01"
                      value={liveReadingForm.kwh}
                      onChange={(e) => setLiveReadingForm({ ...liveReadingForm, kwh: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current KWH reading"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KVAH Reading</label>
                    <input
                      type="number"
                      step="0.01"
                      value={liveReadingForm.kvah}
                      onChange={(e) => setLiveReadingForm({ ...liveReadingForm, kvah: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current KVAH reading"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RMD (kW)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={liveReadingForm.rmd}
                      onChange={(e) => setLiveReadingForm({ ...liveReadingForm, rmd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current RMD"
                    />
                  </div>
                  <button
                    onClick={updateLiveReadings}
                    disabled={!liveReadingForm.kwh || !liveReadingForm.kvah}
                    className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Update Readings
                  </button>
                </div>
              </div>
            </div>

            {liveReadings.lastUpdated && electricityBills.length > 0 && (
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-700 mb-2">Live Bill Estimation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-sm text-gray-600">Estimated Bill Amount</div>
                    <div className="text-xl font-bold text-blue-700">{formatCurrency(liveBillEstimate)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-sm text-gray-600">Current Power Factor</div>
                    <div className={`text-xl font-bold ${livePowerFactor < 0.95 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatDecimal(livePowerFactor, 2)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-sm text-gray-600">PF Status</div>
                    <div className={`text-xl font-bold ${livePowerFactor < 0.95 ? 'text-red-600' : 'text-green-600'}`}>
                      {livePowerFactor < 0.95 ? 'Penalty Applicable' : 'Good'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Electricity Bills Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Electricity Bill Records</h3>
            {electricityBills.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No electricity bill records yet. Add your first bill.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KWH Consumed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Power Factor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RMD (kW)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {electricityBills.map((bill) => {
                      const kwhConsumed = bill.currentKwh - bill.previousKwh;
                      const kvahConsumed = bill.currentKvah - bill.previousKvah;
                      const powerFactor = kvahConsumed > 0 ? kwhConsumed / kvahConsumed : 0;
                      
                      return (
                        <tr key={bill.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingBill === bill.id ? (
                              <input
                                type="text"
                                value={editBillForm.billMonth}
                                onChange={(e) => setEditBillForm({ ...editBillForm, billMonth: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              bill.billMonth
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingBill === bill.id ? (
                              <input
                                type="text"
                                value={editBillForm.billNumber}
                                onChange={(e) => setEditBillForm({ ...editBillForm, billNumber: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              bill.billNumber
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatDecimal(kwhConsumed)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              powerFactor < 0.95 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {formatDecimal(powerFactor, 2)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingBill === bill.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editBillForm.rmd}
                                onChange={(e) => setEditBillForm({ ...editBillForm, rmd: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              formatDecimal(bill.rmd)
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {editingBill === bill.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editBillForm.billAmount}
                                onChange={(e) => setEditBillForm({ ...editBillForm, billAmount: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              formatCurrency(bill.billAmount)
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {editingBill === bill.id ? (
                              <select
                                value={editBillForm.paymentStatus}
                                onChange={(e) => setEditBillForm({ ...editBillForm, paymentStatus: e.target.value as 'pending' | 'paid' })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {bill.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingBill === bill.id ? (
                              <input
                                type="date"
                                value={editBillForm.dueDate}
                                onChange={(e) => setEditBillForm({ ...editBillForm, dueDate: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              new Date(bill.dueDate).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {editingBill === bill.id ? (
                                <>
                                  <button
                                    onClick={() => saveEditBill(bill.id)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditBill}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startEditBill(bill)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Meter Readings Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Meter Readings</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Reading
              </button>
            </div>
            
            {electricityReadings.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No meter readings recorded yet. Add your first reading.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KWH</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KVAH</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Power Factor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RMD (kW)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {electricityReadings.map((reading, index) => {
                      // Calculate power factor between consecutive readings
                      let powerFactor = 0;
                      if (index > 0) {
                        const kwhDiff = reading.kwh - electricityReadings[index - 1].kwh;
                        const kvahDiff = reading.kvah - electricityReadings[index - 1].kvah;
                        powerFactor = kvahDiff > 0 ? kwhDiff / kvahDiff : 0;
                      } else {
                        powerFactor = reading.kvah > 0 ? reading.kwh / reading.kvah : 0;
                      }
                      
                      return (
                        <tr key={reading.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingReading === reading.id ? (
                              <input
                                type="date"
                                value={editForm.readingDate}
                                onChange={(e) => setEditForm({ ...editForm, readingDate: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              new Date(reading.readingDate).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {editingReading === reading.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.kwh}
                                onChange={(e) => setEditForm({ ...editForm, kwh: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              formatDecimal(reading.kwh)
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingReading === reading.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.kvah}
                                onChange={(e) => setEditForm({ ...editForm, kvah: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              formatDecimal(reading.kvah)
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              powerFactor < 0.95 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {formatDecimal(powerFactor, 2)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingReading === reading.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.rmd}
                                onChange={(e) => setEditForm({ ...editForm, rmd: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              formatDecimal(reading.rmd)
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                            {editingReading === reading.id ? (
                              <textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                            ) : (
                              <div className="truncate" title={reading.notes}>
                                {reading.notes || '-'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {editingReading === reading.id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(reading.id)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startEdit(reading)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Reading Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Meter Reading</h3>
                <form onSubmit={handleReadingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reading Date
                    </label>
                    <input
                      type="date"
                      value={readingForm.readingDate}
                      onChange={(e) => setReadingForm({ ...readingForm, readingDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KWH Reading
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={readingForm.kwh}
                        onChange={(e) => setReadingForm({ ...readingForm, kwh: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KVAH Reading
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={readingForm.kvah}
                        onChange={(e) => setReadingForm({ ...readingForm, kvah: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RMD (kW)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={readingForm.rmd}
                      onChange={(e) => setReadingForm({ ...readingForm, rmd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {readingForm.kwh && readingForm.kvah && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Power Factor: <span className={`font-semibold ${parseFloat(readingForm.kwh) / parseFloat(readingForm.kvah) < 0.95 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDecimal(parseFloat(readingForm.kwh) / parseFloat(readingForm.kvah), 2)}
                        </span>
                        {parseFloat(readingForm.kwh) / parseFloat(readingForm.kvah) < 0.95 && (
                          <span className="text-red-600 text-xs ml-2">(Penalty may apply)</span>
                        )}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={readingForm.notes}
                      onChange={(e) => setReadingForm({ ...readingForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any notes about this reading..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Reading
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Bill Form */}
        {showBillForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Electricity Bill</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">TGSPDCL Format</span>
                    <Calculator className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                
                <form onSubmit={handleBillSubmit} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-3">Bill Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bill Month
                        </label>
                        <input
                          type="text"
                          value={billForm.billMonth}
                          onChange={(e) => setBillForm({ ...billForm, billMonth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., June 2025"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bill Number
                        </label>
                        <input
                          type="text"
                          value={billForm.billNumber}
                          onChange={(e) => setBillForm({ ...billForm, billNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., SGR1469-06-2025"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contract Demand (kVA)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.contractDemand}
                          onChange={(e) => setBillForm({ ...billForm, contractDemand: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bill Date
                        </label>
                        <input
                          type="date"
                          value={billForm.billDate}
                          onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={billForm.dueDate}
                          onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RMD (kW)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.rmd}
                          onChange={(e) => setBillForm({ ...billForm, rmd: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">Meter Readings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Previous KWH
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.previousKwh}
                          onChange={(e) => setBillForm({ ...billForm, previousKwh: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current KWH
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.currentKwh}
                          onChange={(e) => setBillForm({ ...billForm, currentKwh: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Previous KVAH
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.previousKvah}
                          onChange={(e) => setBillForm({ ...billForm, previousKvah: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current KVAH
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.currentKvah}
                          onChange={(e) => setBillForm({ ...billForm, currentKvah: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    {billForm.currentKwh && billForm.previousKwh && billForm.currentKvah && billForm.previousKvah && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3 rounded-lg border border-gray-200">
                        <div>
                          <span className="text-sm text-gray-600">KWH Consumed:</span>
                          <span className="ml-2 font-semibold">
                            {formatDecimal(parseFloat(billForm.currentKwh) - parseFloat(billForm.previousKwh))}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">KVAH Consumed:</span>
                          <span className="ml-2 font-semibold">
                            {formatDecimal(parseFloat(billForm.currentKvah) - parseFloat(billForm.previousKvah))}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Power Factor:</span>
                          <span className={`ml-2 font-semibold ${
                            (parseFloat(billForm.currentKwh) - parseFloat(billForm.previousKwh)) / 
                            (parseFloat(billForm.currentKvah) - parseFloat(billForm.previousKvah)) < 0.95 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {formatDecimal(
                              (parseFloat(billForm.currentKwh) - parseFloat(billForm.previousKwh)) / 
                              (parseFloat(billForm.currentKvah) - parseFloat(billForm.previousKvah)),
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">Bill Calculation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fixed Charges (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.fixedCharges}
                          onChange={(e) => setBillForm({ ...billForm, fixedCharges: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Energy Charges (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.energyCharges}
                          onChange={(e) => setBillForm({ ...billForm, energyCharges: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fuel Surcharge (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.fuelSurcharge}
                          onChange={(e) => setBillForm({ ...billForm, fuelSurcharge: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Electricity Duty (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.edDuty}
                          onChange={(e) => setBillForm({ ...billForm, edDuty: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Charges (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.customerCharges}
                          onChange={(e) => setBillForm({ ...billForm, customerCharges: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PF Adjustment (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.additionalCharges}
                          onChange={(e) => setBillForm({ ...billForm, additionalCharges: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">Total Bill Amount (₹)</span>
                        <input
                          type="number"
                          step="0.01"
                          value={billForm.billAmount}
                          onChange={(e) => setBillForm({ ...billForm, billAmount: e.target.value })}
                          className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">Payment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={billForm.paymentStatus}
                          onChange={(e) => setBillForm({ ...billForm, paymentStatus: e.target.value as 'pending' | 'paid' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      {billForm.paymentStatus === 'paid' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Date
                            </label>
                            <input
                              type="date"
                              value={billForm.paymentDate}
                              onChange={(e) => setBillForm({ ...billForm, paymentDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={billForm.paymentStatus === 'paid'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Method
                            </label>
                            <select
                              value={billForm.paymentMethod}
                              onChange={(e) => setBillForm({ ...billForm, paymentMethod: e.target.value as 'cash' | 'cheque' | 'bank-transfer' | 'upi' })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="cash">Cash</option>
                              <option value="cheque">Cheque</option>
                              <option value="bank-transfer">Bank Transfer</option>
                              <option value="upi">UPI</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={billForm.notes}
                      onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any notes about this bill..."
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBillForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectricityBillCalculator;