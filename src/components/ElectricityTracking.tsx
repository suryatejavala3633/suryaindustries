import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Edit, Save, X, Zap, Calendar, FileText, TrendingUp, AlertTriangle, Trash2, Upload } from 'lucide-react';
import { ElectricityReading } from '../types';
import { formatCurrency, formatDecimal } from '../utils/calculations';
import StatsCard from './StatsCard';

interface ElectricityTrackingProps {
  onBack?: () => void;
}

const ElectricityTracking: React.FC<ElectricityTrackingProps> = ({ onBack }) => {
  const [electricityReadings, setElectricityReadings] = useState<ElectricityReading[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReading, setEditingReading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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
    billAmount: '',
    billPeriod: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    readingDate: '',
    kwh: '',
    kvah: '',
    rmd: '',
    billAmount: '',
    billPeriod: '',
    notes: ''
  });

  const [liveReadingForm, setLiveReadingForm] = useState({
    kwh: '',
    kvah: '',
    rmd: ''
  });

  // HT Bill specific data for Service No. SGR1469
  const [htBillData, setHtBillData] = useState({
    serviceNumber: 'SGR1469',
    contractDemand: 100, // kW
    fixedCharges: 0,
    energyCharges: 0,
    demandCharges: 0,
    fuelSurcharge: 0,
    electricityDuty: 0,
    additionalCharges: 0,
    totalAmount: 0
  });

  // Load data on component mount
  useEffect(() => {
    // Load from localStorage if available
    const savedReadings = localStorage.getItem('electricity_readings');
    const savedLiveReadings = localStorage.getItem('live_electricity_readings');
    
    if (savedReadings) {
      setElectricityReadings(JSON.parse(savedReadings));
    }
    
    if (savedLiveReadings) {
      setLiveReadings(JSON.parse(savedLiveReadings));
    }
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (electricityReadings.length > 0) {
      localStorage.setItem('electricity_readings', JSON.stringify(electricityReadings));
    }
  }, [electricityReadings]);

  useEffect(() => {
    if (liveReadings.lastUpdated) {
      localStorage.setItem('live_electricity_readings', JSON.stringify(liveReadings));
    }
  }, [liveReadings]);

  // Calculate summary stats
  const totalBillAmount = useMemo(() => 
    electricityReadings.reduce((sum, reading) => sum + reading.billAmount, 0), 
    [electricityReadings]
  );
  
  const totalKwh = useMemo(() => 
    electricityReadings.reduce((sum, reading) => sum + reading.kwh, 0), 
    [electricityReadings]
  );
  
  const totalKvah = useMemo(() => 
    electricityReadings.reduce((sum, reading) => sum + reading.kvah, 0), 
    [electricityReadings]
  );
  
  const averagePowerFactor = useMemo(() => 
    totalKvah > 0 ? totalKwh / totalKvah : 0, 
    [totalKwh, totalKvah]
  );

  const averageCostPerUnit = useMemo(() => 
    totalKwh > 0 ? totalBillAmount / totalKwh : 0, 
    [totalBillAmount, totalKwh]
  );

  // Calculate live bill amount based on last bill's rate
  const liveBillAmount = useMemo(() => {
    if (electricityReadings.length === 0 || liveReadings.kwh === 0) return 0;
    
    const lastReading = electricityReadings[electricityReadings.length - 1];
    const ratePerUnit = lastReading.billAmount / lastReading.kwh;
    
    return liveReadings.kwh * ratePerUnit;
  }, [electricityReadings, liveReadings.kwh]);

  // Calculate live power factor
  const livePowerFactor = useMemo(() => 
    liveReadings.kvah > 0 ? liveReadings.kwh / liveReadings.kvah : 0, 
    [liveReadings]
  );

  // Calculate current month charges based on live readings
  const calculateCurrentCharges = useMemo(() => {
    if (!liveReadings.kwh || !liveReadings.kvah) return htBillData;

    // Basic HT tariff calculation for Telangana (approximate)
    const demandCharges = liveReadings.rmd * 400; // ₹400 per kW
    const energyCharges = liveReadings.kwh * 6.5; // ₹6.5 per unit
    const fixedCharges = 1500; // Monthly fixed charges
    const fuelSurcharge = liveReadings.kwh * 0.5; // Fuel surcharge
    const electricityDuty = (energyCharges + demandCharges) * 0.16; // 16% duty
    const additionalCharges = 200; // Meter rent, etc.
    
    const totalAmount = demandCharges + energyCharges + fixedCharges + fuelSurcharge + electricityDuty + additionalCharges;

    return {
      ...htBillData,
      fixedCharges,
      energyCharges,
      demandCharges,
      fuelSurcharge,
      electricityDuty,
      additionalCharges,
      totalAmount
    };
  }, [liveReadings, htBillData]);

  const handleReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReading: ElectricityReading = {
      id: Date.now().toString(),
      readingDate: readingForm.readingDate,
      kwh: parseFloat(readingForm.kwh),
      kvah: parseFloat(readingForm.kvah),
      rmd: parseFloat(readingForm.rmd),
      billAmount: parseFloat(readingForm.billAmount),
      billPeriod: readingForm.billPeriod,
      notes: readingForm.notes
    };
    
    setElectricityReadings([...electricityReadings, newReading]);
    setReadingForm({ readingDate: '', kwh: '', kvah: '', rmd: '', billAmount: '', billPeriod: '', notes: '' });
    setShowAddForm(false);
  };

  const startEdit = (reading: ElectricityReading) => {
    setEditingReading(reading.id);
    setEditForm({
      readingDate: reading.readingDate,
      kwh: reading.kwh.toString(),
      kvah: reading.kvah.toString(),
      rmd: reading.rmd.toString(),
      billAmount: reading.billAmount.toString(),
      billPeriod: reading.billPeriod,
      notes: reading.notes || ''
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
        billAmount: parseFloat(editForm.billAmount),
        billPeriod: editForm.billPeriod,
        notes: editForm.notes
      } : reading
    ));
    setEditingReading(null);
  };

  const cancelEdit = () => {
    setEditingReading(null);
    setEditForm({ readingDate: '', kwh: '', kvah: '', rmd: '', billAmount: '', billPeriod: '', notes: '' });
  };

  const deleteReading = (id: string) => {
    setElectricityReadings(electricityReadings.filter(reading => reading.id !== id));
    setShowDeleteConfirm(null);
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

  const handleHTMLBillUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const htmlContent = e.target?.result as string;
        parseHTMLBill(htmlContent);
      };
      reader.readAsText(file);
    }
  };

  const parseHTMLBill = (htmlContent: string) => {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract bill data (this will need to be customized based on actual HTML structure)
    try {
      // Look for common patterns in electricity bills
      const serviceNumberElement = doc.querySelector('[data-service], .service-number, #service-number');
      const kwhElement = doc.querySelector('[data-kwh], .kwh-reading, #kwh');
      const kvahElement = doc.querySelector('[data-kvah], .kvah-reading, #kvah');
      const rmdElement = doc.querySelector('[data-rmd], .rmd-reading, #rmd');
      const billAmountElement = doc.querySelector('[data-amount], .bill-amount, #total-amount');
      
      // Extract values and populate form
      if (kwhElement) {
        const kwhValue = extractNumber(kwhElement.textContent || '');
        if (kwhValue) setLiveReadingForm(prev => ({ ...prev, kwh: kwhValue.toString() }));
      }
      
      if (kvahElement) {
        const kvahValue = extractNumber(kvahElement.textContent || '');
        if (kvahValue) setLiveReadingForm(prev => ({ ...prev, kvah: kvahValue.toString() }));
      }
      
      if (rmdElement) {
        const rmdValue = extractNumber(rmdElement.textContent || '');
        if (rmdValue) setLiveReadingForm(prev => ({ ...prev, rmd: rmdValue.toString() }));
      }
      
      // Auto-populate reading form with extracted data
      if (billAmountElement) {
        const billAmount = extractNumber(billAmountElement.textContent || '');
        if (billAmount) {
          setReadingForm(prev => ({
            ...prev,
            billAmount: billAmount.toString(),
            readingDate: new Date().toISOString().split('T')[0],
            billPeriod: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          }));
        }
      }
      
      alert('HTML bill data parsed successfully! Please review and update the readings.');
    } catch (error) {
      console.error('Error parsing HTML bill:', error);
      alert('Error parsing HTML bill. Please check the file format.');
    }
  };

  const extractNumber = (text: string): number | null => {
    const match = text.replace(/[^\d.-]/g, '');
    const number = parseFloat(match);
    return isNaN(number) ? null : number;
  };

  const exportElectricityData = () => {
    const csvContent = [
      ['Date', 'KWH', 'KVAH', 'RMD (kW)', 'Power Factor', 'Bill Amount', 'Bill Period', 'Notes'],
      ...electricityReadings.map(reading => [
        reading.readingDate,
        reading.kwh,
        reading.kvah,
        reading.rmd,
        (reading.kwh / reading.kvah).toFixed(2),
        reading.billAmount,
        reading.billPeriod,
        reading.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'electricity-consumption-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate electricity cost per ACK (assuming 290 quintals per ACK)
  const calculateElectricityCostPerAck = () => {
    if (totalKwh === 0) return 0;
    
    // Assuming an average of 65 units (KWH) per ACK of rice production
    const estimatedAcks = totalKwh / 65;
    return estimatedAcks > 0 ? totalBillAmount / estimatedAcks : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Electricity Consumption Tracking</h1>
            <p className="text-gray-600 mt-2">Monitor electricity usage for Service No. SGR1469, calculate power factor and track bill amounts</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload HTML Bill
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleHTMLBillUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={exportElectricityData}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bill Reading
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Consumption"
            value={`${formatDecimal(totalKwh)} KWH`}
            subtitle={`${formatDecimal(totalKvah)} KVAH`}
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

        {/* Live Readings and Current Bill Estimation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Electricity Monitoring - Service No. SGR1469</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <span className={`font-semibold ${livePowerFactor < 0.9 ? 'text-red-600' : 'text-green-600'}`}>
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

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-700 mb-3">Current Month Charges (Estimated)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fixed Charges:</span>
                    <span className="font-semibold">{formatCurrency(calculateCurrentCharges.fixedCharges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Energy Charges:</span>
                    <span className="font-semibold">{formatCurrency(calculateCurrentCharges.energyCharges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Demand Charges:</span>
                    <span className="font-semibold">{formatCurrency(calculateCurrentCharges.demandCharges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel Surcharge:</span>
                    <span className="font-semibold">{formatCurrency(calculateCurrentCharges.fuelSurcharge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Electricity Duty:</span>
                    <span className="font-semibold">{formatCurrency(calculateCurrentCharges.electricityDuty)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-700">Total Estimated:</span>
                      <span className="font-bold text-blue-700">{formatCurrency(calculateCurrentCharges.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    *Based on Telangana HT tariff rates
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Electricity Readings Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Electricity Bill Records</h3>
            {electricityReadings.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No electricity bill records yet. Add your first bill reading.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Period</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KWH</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KVAH</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Power Factor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RMD (kW)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {electricityReadings.map((reading) => (
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {editingReading === reading.id ? (
                            <input
                              type="text"
                              value={editForm.billPeriod}
                              onChange={(e) => setEditForm({ ...editForm, billPeriod: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="e.g., June 2025"
                            />
                          ) : (
                            reading.billPeriod
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
                            reading.kwh / reading.kvah < 0.9 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {formatDecimal(reading.kwh / reading.kvah, 2)}
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {editingReading === reading.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.billAmount}
                              onChange={(e) => setEditForm({ ...editForm, billAmount: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            formatCurrency(reading.billAmount)
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
                                  title="Save changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-red-600 hover:text-red-800"
                                  title="Cancel editing"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(reading)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit reading"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(reading.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete reading"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Electricity Bill Reading</h3>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill Period
                    </label>
                    <input
                      type="text"
                      value={readingForm.billPeriod}
                      onChange={(e) => setReadingForm({ ...readingForm, billPeriod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., June 2025"
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={readingForm.billAmount}
                        onChange={(e) => setReadingForm({ ...readingForm, billAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  {readingForm.kwh && readingForm.kvah && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Power Factor: <span className={`font-semibold ${parseFloat(readingForm.kwh) / parseFloat(readingForm.kvah) < 0.9 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDecimal(parseFloat(readingForm.kwh) / parseFloat(readingForm.kvah), 2)}
                        </span>
                        {parseFloat(readingForm.kwh) / parseFloat(readingForm.kvah) < 0.9 && (
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
                      placeholder="Add any notes about this bill..."
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this electricity reading? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => deleteReading(showDeleteConfirm)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectricityTracking;