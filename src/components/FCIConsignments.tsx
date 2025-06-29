import React, { useState, useMemo } from 'react';
import { Plus, Truck, Package, FileCheck, AlertCircle, CheckCircle, Clock, X, Edit, Save, Download, Users, CreditCard } from 'lucide-react';
import { FCIConsignment, LorryFreight, Transporter } from '../types';
import { formatNumber, formatCurrency, formatDecimal } from '../utils/calculations';
import StatsCard from './StatsCard';

const FCIConsignments: React.FC = () => {
  const [consignments, setConsignments] = useState<FCIConsignment[]>([]);
  const [lorryFreights, setLorryFreights] = useState<LorryFreight[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFreightForm, setShowFreightForm] = useState(false);
  const [showTransporterForm, setShowTransporterForm] = useState(false);
  const [editingConsignment, setEditingConsignment] = useState<string | null>(null);
  const [editingFreight, setEditingFreight] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'consignments' | 'freights' | 'transporters'>('consignments');

  // Form states
  const [consignmentForm, setConsignmentForm] = useState({
    ackNumber: '',
    riceQuantity: '290',
    frkQuantity: '290',
    totalBags: '580',
    gunnyType: '2024-25-new' as '2024-25-new' | '2023-24-leftover',
    stickersUsed: '580',
    consignmentDate: '',
    status: 'in-transit' as FCIConsignment['status'],
    fciWeight: '',
    fciMoisture: '',
    fciUnloadingHamali: '5500',
    fciPassingFee: '7000',
    passingFeePaid: false,
    notes: ''
  });

  const [freightForm, setFreightForm] = useState({
    consignmentId: '',
    ackNumber: '',
    lorryNumber: '',
    transporterName: '',
    quantityMT: '29',
    freightPerMT: '',
    grossFreightAmount: '',
    deductions: [] as { id: string; description: string; amount: number }[],
    netFreightAmount: '',
    advancePaid: '0',
    balanceAmount: '',
    dispatchDate: '',
    paymentStatus: 'pending' as 'pending' | 'advance-paid' | 'fully-paid',
    notes: '',
    isBranConsignment: false
  });

  const [transporterForm, setTransporterForm] = useState({
    name: '',
    phone: '',
    address: '',
    lorryNumbers: '',
    defaultRate: '',
    notes: ''
  });

  const [editConsignmentForm, setEditConsignmentForm] = useState({
    ackNumber: '',
    riceQuantity: '',
    frkQuantity: '',
    totalBags: '',
    gunnyType: '' as '2024-25-new' | '2023-24-leftover',
    stickersUsed: '',
    consignmentDate: '',
    status: '' as FCIConsignment['status'],
    fciWeight: '',
    fciMoisture: '',
    fciUnloadingHamali: '',
    fciPassingFee: '',
    passingFeePaid: false,
    notes: ''
  });

  const [editFreightForm, setEditFreightForm] = useState({
    consignmentId: '',
    ackNumber: '',
    lorryNumber: '',
    transporterName: '',
    quantityMT: '',
    freightPerMT: '',
    grossFreightAmount: '',
    deductions: [] as { id: string; description: string; amount: number }[],
    netFreightAmount: '',
    advancePaid: '',
    balanceAmount: '',
    dispatchDate: '',
    paymentStatus: '' as 'pending' | 'advance-paid' | 'fully-paid',
    notes: '',
    isBranConsignment: false
  });

  const [deductionForm, setDeductionForm] = useState({
    description: '',
    amount: ''
  });

  // Calculate summary stats
  const totalConsignments = useMemo(() => consignments.length, [consignments]);
  const totalRiceQuantity = useMemo(() => consignments.reduce((sum, consignment) => sum + consignment.riceQuantity, 0), [consignments]);
  const totalBags = useMemo(() => consignments.reduce((sum, consignment) => sum + consignment.totalBags, 0), [consignments]);
  
  const inTransitCount = useMemo(() => consignments.filter(c => c.status === 'in-transit').length, [consignments]);
  const dumpingDoneCount = useMemo(() => consignments.filter(c => c.status === 'dumping-done').length, [consignments]);
  const qcPassedCount = useMemo(() => consignments.filter(c => c.status === 'qc-passed').length, [consignments]);
  const dispatchedCount = useMemo(() => consignments.filter(c => c.status === 'dispatched').length, [consignments]);
  const rejectedCount = useMemo(() => consignments.filter(c => c.status === 'rejected').length, [consignments]);

  const totalFreightAmount = useMemo(() => lorryFreights.reduce((sum, freight) => sum + freight.grossFreightAmount, 0), [lorryFreights]);
  const totalAdvancePaid = useMemo(() => lorryFreights.reduce((sum, freight) => sum + freight.advancePaid, 0), [lorryFreights]);
  const totalBalanceAmount = useMemo(() => lorryFreights.reduce((sum, freight) => sum + freight.balanceAmount, 0), [lorryFreights]);
  
  const totalUnloadingHamali = useMemo(() => 
    consignments.reduce((sum, consignment) => sum + parseFloat(consignment.fciUnloadingHamali || '0'), 0), 
    [consignments]
  );
  
  const totalPassingFees = useMemo(() => 
    consignments.reduce((sum, consignment) => sum + parseFloat(consignment.fciPassingFee || '0'), 0), 
    [consignments]
  );
  
  const pendingPassingFees = useMemo(() => 
    consignments
      .filter(consignment => !consignment.passingFeePaid)
      .reduce((sum, consignment) => sum + parseFloat(consignment.fciPassingFee || '0'), 0), 
    [consignments]
  );

  const handleConsignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newConsignment: FCIConsignment = {
      id: Date.now().toString(),
      ackNumber: consignmentForm.ackNumber,
      riceQuantity: parseFloat(consignmentForm.riceQuantity),
      frkQuantity: parseFloat(consignmentForm.frkQuantity),
      totalBags: parseInt(consignmentForm.totalBags),
      gunnyType: consignmentForm.gunnyType,
      stickersUsed: parseInt(consignmentForm.stickersUsed),
      consignmentDate: consignmentForm.consignmentDate,
      status: consignmentForm.status,
      fciWeight: consignmentForm.fciWeight ? parseFloat(consignmentForm.fciWeight) : undefined,
      fciMoisture: consignmentForm.fciMoisture ? parseFloat(consignmentForm.fciMoisture) : undefined,
      fciUnloadingHamali: consignmentForm.fciUnloadingHamali,
      fciPassingFee: consignmentForm.fciPassingFee,
      passingFeePaid: consignmentForm.passingFeePaid,
      notes: consignmentForm.notes
    };
    
    setConsignments([...consignments, newConsignment]);
    setConsignmentForm({
      ackNumber: '',
      riceQuantity: '290',
      frkQuantity: '290',
      totalBags: '580',
      gunnyType: '2024-25-new',
      stickersUsed: '580',
      consignmentDate: '',
      status: 'in-transit',
      fciWeight: '',
      fciMoisture: '',
      fciUnloadingHamali: '5500',
      fciPassingFee: '7000',
      passingFeePaid: false,
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleFreightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityMT = parseFloat(freightForm.quantityMT);
    const freightPerMT = parseFloat(freightForm.freightPerMT);
    const grossFreightAmount = quantityMT * freightPerMT;
    const totalDeductions = freightForm.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    const netFreightAmount = grossFreightAmount - totalDeductions;
    const advancePaid = parseFloat(freightForm.advancePaid) || 0;
    const balanceAmount = netFreightAmount - advancePaid;
    
    const newFreight: LorryFreight = {
      id: Date.now().toString(),
      consignmentId: freightForm.consignmentId,
      ackNumber: freightForm.ackNumber,
      lorryNumber: freightForm.lorryNumber,
      transporterName: freightForm.transporterName,
      quantityMT,
      freightPerMT,
      grossFreightAmount,
      deductions: freightForm.deductions,
      netFreightAmount,
      advancePaid,
      balanceAmount,
      dispatchDate: freightForm.dispatchDate,
      paymentStatus: freightForm.paymentStatus,
      notes: freightForm.notes,
      isBranConsignment: freightForm.isBranConsignment
    };
    
    setLorryFreights([...lorryFreights, newFreight]);
    setFreightForm({
      consignmentId: '',
      ackNumber: '',
      lorryNumber: '',
      transporterName: '',
      quantityMT: '29',
      freightPerMT: '',
      grossFreightAmount: '',
      deductions: [],
      netFreightAmount: '',
      advancePaid: '0',
      balanceAmount: '',
      dispatchDate: '',
      paymentStatus: 'pending',
      notes: '',
      isBranConsignment: false
    });
    setShowFreightForm(false);
  };

  const handleTransporterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lorryNumbersArray = transporterForm.lorryNumbers.split(',').map(num => num.trim());
    
    const newTransporter: Transporter = {
      id: Date.now().toString(),
      name: transporterForm.name,
      phone: transporterForm.phone,
      address: transporterForm.address,
      lorryNumbers: lorryNumbersArray,
      defaultRate: transporterForm.defaultRate ? parseFloat(transporterForm.defaultRate) : undefined,
      notes: transporterForm.notes
    };
    
    setTransporters([...transporters, newTransporter]);
    setTransporterForm({
      name: '',
      phone: '',
      address: '',
      lorryNumbers: '',
      defaultRate: '',
      notes: ''
    });
    setShowTransporterForm(false);
  };

  const startEditConsignment = (consignment: FCIConsignment) => {
    setEditingConsignment(consignment.id);
    setEditConsignmentForm({
      ackNumber: consignment.ackNumber,
      riceQuantity: consignment.riceQuantity.toString(),
      frkQuantity: consignment.frkQuantity.toString(),
      totalBags: consignment.totalBags.toString(),
      gunnyType: consignment.gunnyType,
      stickersUsed: consignment.stickersUsed.toString(),
      consignmentDate: consignment.consignmentDate,
      status: consignment.status,
      fciWeight: consignment.fciWeight?.toString() || '',
      fciMoisture: consignment.fciMoisture?.toString() || '',
      fciUnloadingHamali: consignment.fciUnloadingHamali || '5500',
      fciPassingFee: consignment.fciPassingFee || '7000',
      passingFeePaid: consignment.passingFeePaid || false,
      notes: consignment.notes || ''
    });
  };

  const startEditFreight = (freight: LorryFreight) => {
    setEditingFreight(freight.id);
    setEditFreightForm({
      consignmentId: freight.consignmentId,
      ackNumber: freight.ackNumber,
      lorryNumber: freight.lorryNumber,
      transporterName: freight.transporterName,
      quantityMT: freight.quantityMT.toString(),
      freightPerMT: freight.freightPerMT.toString(),
      grossFreightAmount: freight.grossFreightAmount.toString(),
      deductions: [...freight.deductions],
      netFreightAmount: freight.netFreightAmount.toString(),
      advancePaid: freight.advancePaid.toString(),
      balanceAmount: freight.balanceAmount.toString(),
      dispatchDate: freight.dispatchDate,
      paymentStatus: freight.paymentStatus,
      notes: freight.notes || '',
      isBranConsignment: freight.isBranConsignment || false
    });
  };

  const saveEditConsignment = (id: string) => {
    setConsignments(consignments.map(consignment => 
      consignment.id === id ? {
        ...consignment,
        ackNumber: editConsignmentForm.ackNumber,
        riceQuantity: parseFloat(editConsignmentForm.riceQuantity),
        frkQuantity: parseFloat(editConsignmentForm.frkQuantity),
        totalBags: parseInt(editConsignmentForm.totalBags),
        gunnyType: editConsignmentForm.gunnyType,
        stickersUsed: parseInt(editConsignmentForm.stickersUsed),
        consignmentDate: editConsignmentForm.consignmentDate,
        status: editConsignmentForm.status,
        fciWeight: editConsignmentForm.fciWeight ? parseFloat(editConsignmentForm.fciWeight) : undefined,
        fciMoisture: editConsignmentForm.fciMoisture ? parseFloat(editConsignmentForm.fciMoisture) : undefined,
        fciUnloadingHamali: editConsignmentForm.fciUnloadingHamali,
        fciPassingFee: editConsignmentForm.fciPassingFee,
        passingFeePaid: editConsignmentForm.passingFeePaid,
        notes: editConsignmentForm.notes
      } : consignment
    ));
    setEditingConsignment(null);
  };

  const saveEditFreight = (id: string) => {
    const quantityMT = parseFloat(editFreightForm.quantityMT);
    const freightPerMT = parseFloat(editFreightForm.freightPerMT);
    const grossFreightAmount = quantityMT * freightPerMT;
    const totalDeductions = editFreightForm.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    const netFreightAmount = grossFreightAmount - totalDeductions;
    const advancePaid = parseFloat(editFreightForm.advancePaid) || 0;
    const balanceAmount = netFreightAmount - advancePaid;
    
    setLorryFreights(lorryFreights.map(freight => 
      freight.id === id ? {
        ...freight,
        consignmentId: editFreightForm.consignmentId,
        ackNumber: editFreightForm.ackNumber,
        lorryNumber: editFreightForm.lorryNumber,
        transporterName: editFreightForm.transporterName,
        quantityMT,
        freightPerMT,
        grossFreightAmount,
        deductions: editFreightForm.deductions,
        netFreightAmount,
        advancePaid,
        balanceAmount,
        dispatchDate: editFreightForm.dispatchDate,
        paymentStatus: editFreightForm.paymentStatus,
        notes: editFreightForm.notes,
        isBranConsignment: editFreightForm.isBranConsignment
      } : freight
    ));
    setEditingFreight(null);
  };

  const cancelEdit = () => {
    setEditingConsignment(null);
    setEditingFreight(null);
  };

  const addDeduction = () => {
    if (deductionForm.description && deductionForm.amount) {
      const newDeduction = {
        id: Date.now().toString(),
        description: deductionForm.description,
        amount: parseFloat(deductionForm.amount)
      };
      
      setFreightForm({
        ...freightForm,
        deductions: [...freightForm.deductions, newDeduction]
      });
      
      setDeductionForm({ description: '', amount: '' });
    }
  };

  const addDeductionToEdit = () => {
    if (deductionForm.description && deductionForm.amount) {
      const newDeduction = {
        id: Date.now().toString(),
        description: deductionForm.description,
        amount: parseFloat(deductionForm.amount)
      };
      
      setEditFreightForm({
        ...editFreightForm,
        deductions: [...editFreightForm.deductions, newDeduction]
      });
      
      setDeductionForm({ description: '', amount: '' });
    }
  };

  const removeDeduction = (id: string) => {
    setFreightForm({
      ...freightForm,
      deductions: freightForm.deductions.filter(d => d.id !== id)
    });
  };

  const removeDeductionFromEdit = (id: string) => {
    setEditFreightForm({
      ...editFreightForm,
      deductions: editFreightForm.deductions.filter(d => d.id !== id)
    });
  };

  const calculateFreightAmounts = () => {
    const quantityMT = parseFloat(freightForm.quantityMT);
    const freightPerMT = parseFloat(freightForm.freightPerMT);
    
    if (!isNaN(quantityMT) && !isNaN(freightPerMT)) {
      const grossAmount = quantityMT * freightPerMT;
      const totalDeductions = freightForm.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      const netAmount = grossAmount - totalDeductions;
      const advancePaid = parseFloat(freightForm.advancePaid) || 0;
      const balanceAmount = netAmount - advancePaid;
      
      setFreightForm({
        ...freightForm,
        grossFreightAmount: grossAmount.toString(),
        netFreightAmount: netAmount.toString(),
        balanceAmount: balanceAmount.toString()
      });
    }
  };

  const calculateEditFreightAmounts = () => {
    const quantityMT = parseFloat(editFreightForm.quantityMT);
    const freightPerMT = parseFloat(editFreightForm.freightPerMT);
    
    if (!isNaN(quantityMT) && !isNaN(freightPerMT)) {
      const grossAmount = quantityMT * freightPerMT;
      const totalDeductions = editFreightForm.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      const netAmount = grossAmount - totalDeductions;
      const advancePaid = parseFloat(editFreightForm.advancePaid) || 0;
      const balanceAmount = netAmount - advancePaid;
      
      setEditFreightForm({
        ...editFreightForm,
        grossFreightAmount: grossAmount.toString(),
        netFreightAmount: netAmount.toString(),
        balanceAmount: balanceAmount.toString()
      });
    }
  };

  const togglePassingFeePaid = (id: string) => {
    setConsignments(consignments.map(consignment => 
      consignment.id === id ? {
        ...consignment,
        passingFeePaid: !consignment.passingFeePaid
      } : consignment
    ));
  };

  const updateFreightPaymentStatus = (id: string, status: 'pending' | 'advance-paid' | 'fully-paid') => {
    setLorryFreights(lorryFreights.map(freight => 
      freight.id === id ? {
        ...freight,
        paymentStatus: status
      } : freight
    ));
  };

  const exportData = (type: 'consignments' | 'freights' | 'transporters') => {
    let csvContent = '';
    
    if (type === 'consignments') {
      csvContent = [
        ['ACK Number', 'Rice Quantity', 'FRK Quantity', 'Total Bags', 'Gunny Type', 'Stickers Used', 'Consignment Date', 'Status', 'FCI Weight', 'FCI Moisture', 'Unloading Hamali', 'Passing Fee', 'Passing Fee Paid', 'Notes'],
        ...consignments.map(consignment => [
          consignment.ackNumber,
          consignment.riceQuantity,
          consignment.frkQuantity,
          consignment.totalBags,
          consignment.gunnyType,
          consignment.stickersUsed,
          consignment.consignmentDate,
          consignment.status,
          consignment.fciWeight || '',
          consignment.fciMoisture || '',
          consignment.fciUnloadingHamali || '',
          consignment.fciPassingFee || '',
          consignment.passingFeePaid ? 'Yes' : 'No',
          consignment.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
    } else if (type === 'freights') {
      csvContent = [
        ['ACK Number', 'Lorry Number', 'Transporter', 'Quantity (MT)', 'Rate per MT', 'Gross Amount', 'Deductions', 'Net Amount', 'Advance Paid', 'Balance', 'Dispatch Date', 'Payment Status', 'Bran Consignment', 'Notes'],
        ...lorryFreights.map(freight => [
          freight.ackNumber,
          freight.lorryNumber,
          freight.transporterName,
          freight.quantityMT,
          freight.freightPerMT,
          freight.grossFreightAmount,
          freight.deductions.reduce((sum, d) => sum + d.amount, 0),
          freight.netFreightAmount,
          freight.advancePaid,
          freight.balanceAmount,
          freight.dispatchDate,
          freight.paymentStatus,
          freight.isBranConsignment ? 'Yes' : 'No',
          freight.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
    } else if (type === 'transporters') {
      csvContent = [
        ['Name', 'Phone', 'Address', 'Lorry Numbers', 'Default Rate', 'Notes'],
        ...transporters.map(transporter => [
          transporter.name,
          transporter.phone || '',
          transporter.address || '',
          transporter.lorryNumbers.join(', '),
          transporter.defaultRate || '',
          transporter.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FCI Consignments</h1>
            <p className="text-gray-600 mt-2">Manage rice consignments, lorry freights, and transporters</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportData(activeTab)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            {activeTab === 'consignments' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Consignment
              </button>
            )}
            {activeTab === 'freights' && (
              <button
                onClick={() => setShowFreightForm(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Freight
              </button>
            )}
            {activeTab === 'transporters' && (
              <button
                onClick={() => setShowTransporterForm(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transporter
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {activeTab === 'consignments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard
              title="Total Consignments"
              value={formatNumber(totalConsignments)}
              icon={<Truck className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Total Rice"
              value={`${formatNumber(totalRiceQuantity)} Qtl`}
              icon={<Package className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Total Bags"
              value={formatNumber(totalBags)}
              icon={<Package className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
            <StatsCard
              title="Unloading Hamali"
              value={formatCurrency(totalUnloadingHamali)}
              icon={<Users className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Passing Fees Due"
              value={formatCurrency(pendingPassingFees)}
              icon={<FileCheck className="h-6 w-6" />}
              color="from-red-500 to-red-600"
            />
          </div>
        )}

        {activeTab === 'freights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Freight"
              value={formatCurrency(totalFreightAmount)}
              icon={<Truck className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Advance Paid"
              value={formatCurrency(totalAdvancePaid)}
              icon={<CreditCard className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Balance Amount"
              value={formatCurrency(totalBalanceAmount)}
              icon={<Clock className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Bran Consignments"
              value={formatNumber(lorryFreights.filter(f => f.isBranConsignment).length)}
              subtitle={`${formatCurrency(lorryFreights.filter(f => f.isBranConsignment).reduce((sum, f) => sum + f.grossFreightAmount, 0))}`}
              icon={<Package className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}

        {activeTab === 'transporters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Transporters"
              value={formatNumber(transporters.length)}
              icon={<Truck className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Total Lorries"
              value={formatNumber(transporters.reduce((sum, t) => sum + t.lorryNumbers.length, 0))}
              icon={<Truck className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Average Rate"
              value={formatCurrency(
                transporters.filter(t => t.defaultRate).reduce((sum, t) => sum + (t.defaultRate || 0), 0) / 
                transporters.filter(t => t.defaultRate).length || 0
              )}
              subtitle="Per MT"
              icon={<CreditCard className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}

        {/* Status Widgets */}
        {activeTab === 'consignments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">In Transit</h3>
                <div className="bg-blue-100 text-blue-800 p-2 rounded-lg">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{inTransitCount}</div>
              <p className="text-sm text-gray-600">Consignments on the way</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dispatched</h3>
                <div className="bg-green-100 text-green-800 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{dispatchedCount}</div>
              <p className="text-sm text-gray-600">Consignments dispatched</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">QC Passed</h3>
                <div className="bg-purple-100 text-purple-800 p-2 rounded-lg">
                  <FileCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{qcPassedCount}</div>
              <p className="text-sm text-gray-600">Quality check passed</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dumping Done</h3>
                <div className="bg-yellow-100 text-yellow-800 p-2 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{dumpingDoneCount}</div>
              <p className="text-sm text-gray-600">Awaiting quality check</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Rejected</h3>
                <div className="bg-red-100 text-red-800 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{rejectedCount}</div>
              <p className="text-sm text-gray-600">Failed quality check</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'consignments', label: 'Consignments', icon: Truck },
                { id: 'freights', label: 'Lorry Freights', icon: CreditCard },
                { id: 'transporters', label: 'Transporters', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'consignments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rice Consignments</h3>
                {consignments.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No consignments recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rice Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FCI Weight</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unloading Hamali</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passing Fee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {consignments.map((consignment) => (
                          <tr key={consignment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {editingConsignment === consignment.id ? (
                                <input
                                  type="text"
                                  value={editConsignmentForm.ackNumber}
                                  onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, ackNumber: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                consignment.ackNumber
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingConsignment === consignment.id ? (
                                <input
                                  type="date"
                                  value={editConsignmentForm.consignmentDate}
                                  onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, consignmentDate: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(consignment.consignmentDate).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingConsignment === consignment.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editConsignmentForm.riceQuantity}
                                  onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, riceQuantity: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                `${formatDecimal(consignment.riceQuantity)} Qtl`
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingConsignment === consignment.id ? (
                                <input
                                  type="number"
                                  value={editConsignmentForm.totalBags}
                                  onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, totalBags: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatNumber(consignment.totalBags)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {editingConsignment === consignment.id ? (
                                <select
                                  value={editConsignmentForm.status}
                                  onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, status: e.target.value as FCIConsignment['status'] })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="in-transit">In Transit</option>
                                  <option value="dispatched">Dispatched</option>
                                  <option value="dumping-done">Dumping Done</option>
                                  <option value="qc-passed">QC Passed</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  consignment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                                  consignment.status === 'dispatched' ? 'bg-green-100 text-green-800' :
                                  consignment.status === 'dumping-done' ? 'bg-yellow-100 text-yellow-800' :
                                  consignment.status === 'qc-passed' ? 'bg-purple-100 text-purple-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {consignment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingConsignment === consignment.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editConsignmentForm.fciWeight}
                                  onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, fciWeight: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                consignment.fciWeight ? `${formatDecimal(consignment.fciWeight)} Qtl` : '-'
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingConsignment === consignment.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editConsignmentForm.fciUnloadingHamali}
                                  onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, fciUnloadingHamali: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(parseFloat(consignment.fciUnloadingHamali || '0'))
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {editingConsignment === consignment.id ? (
                                  <>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editConsignmentForm.fciPassingFee}
                                      onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, fciPassingFee: e.target.value })}
                                      className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={editConsignmentForm.passingFeePaid}
                                        onChange={(e) => setEditConsignmentForm({ ...editConsignmentForm, passingFeePaid: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <span className="ml-2 text-xs text-gray-700">Paid</span>
                                    </label>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-gray-900">{formatCurrency(parseFloat(consignment.fciPassingFee || '0'))}</span>
                                    <button
                                      onClick={() => togglePassingFeePaid(consignment.id)}
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        consignment.passingFeePaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {consignment.passingFeePaid ? 'Paid' : 'Pending'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingConsignment === consignment.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEditConsignment(consignment.id)}
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
                                    onClick={() => startEditConsignment(consignment)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
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
            )}

            {activeTab === 'freights' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lorry Freight Records</h3>
                {lorryFreights.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No freight records added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK/Consignment</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (MT)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate/MT</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lorryFreights.map((freight) => (
                          <tr key={freight.id} className={`hover:bg-gray-50 ${freight.isBranConsignment ? 'bg-yellow-50' : ''}`}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {editingFreight === freight.id ? (
                                <input
                                  type="text"
                                  value={editFreightForm.ackNumber}
                                  onChange={(e) => setEditFreightForm({ ...editFreightForm, ackNumber: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                freight.ackNumber
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                freight.isBranConsignment ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {freight.isBranConsignment ? 'Bran' : 'Rice'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingFreight === freight.id ? (
                                <input
                                  type="text"
                                  value={editFreightForm.lorryNumber}
                                  onChange={(e) => setEditFreightForm({ ...editFreightForm, lorryNumber: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                freight.lorryNumber
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingFreight === freight.id ? (
                                <input
                                  type="text"
                                  value={editFreightForm.transporterName}
                                  onChange={(e) => setEditFreightForm({ ...editFreightForm, transporterName: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                freight.transporterName
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingFreight === freight.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editFreightForm.quantityMT}
                                  onChange={(e) => {
                                    setEditFreightForm({ ...editFreightForm, quantityMT: e.target.value });
                                    setTimeout(calculateEditFreightAmounts, 100);
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatDecimal(freight.quantityMT)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingFreight === freight.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editFreightForm.freightPerMT}
                                  onChange={(e) => {
                                    setEditFreightForm({ ...editFreightForm, freightPerMT: e.target.value });
                                    setTimeout(calculateEditFreightAmounts, 100);
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(freight.freightPerMT)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(freight.grossFreightAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(freight.netFreightAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                              {editingFreight === freight.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editFreightForm.advancePaid}
                                  onChange={(e) => {
                                    setEditFreightForm({ ...editFreightForm, advancePaid: e.target.value });
                                    setTimeout(calculateEditFreightAmounts, 100);
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(freight.advancePaid)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(freight.balanceAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {editingFreight === freight.id ? (
                                <select
                                  value={editFreightForm.paymentStatus}
                                  onChange={(e) => setEditFreightForm({ ...editFreightForm, paymentStatus: e.target.value as 'pending' | 'advance-paid' | 'fully-paid' })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="advance-paid">Advance Paid</option>
                                  <option value="fully-paid">Fully Paid</option>
                                </select>
                              ) : (
                                <div className="flex space-x-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    freight.paymentStatus === 'fully-paid' ? 'bg-green-100 text-green-800' :
                                    freight.paymentStatus === 'advance-paid' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {freight.paymentStatus.replace('-', ' ')}
                                  </span>
                                  {freight.paymentStatus !== 'fully-paid' && (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => updateFreightPaymentStatus(freight.id, 'advance-paid')}
                                        className="text-xs text-yellow-600 hover:text-yellow-800"
                                        title="Mark as Advance Paid"
                                      >
                                        A
                                      </button>
                                      <button
                                        onClick={() => updateFreightPaymentStatus(freight.id, 'fully-paid')}
                                        className="text-xs text-green-600 hover:text-green-800"
                                        title="Mark as Fully Paid"
                                      >
                                        F
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingFreight === freight.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEditFreight(freight.id)}
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
                                    onClick={() => startEditFreight(freight)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
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
            )}

            {activeTab === 'transporters' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transporters Database</h3>
                {transporters.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transporters added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry Numbers</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transporters.map((transporter) => (
                          <tr key={transporter.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transporter.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {transporter.phone || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {transporter.address || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              <div className="flex flex-wrap gap-1">
                                {transporter.lorryNumbers.map((number, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {number}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transporter.defaultRate ? formatCurrency(transporter.defaultRate) : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {transporter.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Consignment Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add FCI Consignment</h3>
                <form onSubmit={handleConsignmentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ACK Number</label>
                    <input
                      type="text"
                      value={consignmentForm.ackNumber}
                      onChange={(e) => setConsignmentForm({ ...consignmentForm, ackNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., ACK-2025-001"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rice Quantity (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={consignmentForm.riceQuantity}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, riceQuantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">FRK Quantity (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={consignmentForm.frkQuantity}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, frkQuantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Bags</label>
                      <input
                        type="number"
                        value={consignmentForm.totalBags}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, totalBags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stickers Used</label>
                      <input
                        type="number"
                        value={consignmentForm.stickersUsed}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, stickersUsed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gunny Type</label>
                      <select
                        value={consignmentForm.gunnyType}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, gunnyType: e.target.value as '2024-25-new' | '2023-24-leftover' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="2024-25-new">2024-25 New</option>
                        <option value="2023-24-leftover">2023-24 Leftover</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consignment Date</label>
                      <input
                        type="date"
                        value={consignmentForm.consignmentDate}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, consignmentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={consignmentForm.status}
                      onChange={(e) => setConsignmentForm({ ...consignmentForm, status: e.target.value as FCIConsignment['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="in-transit">In Transit</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="dumping-done">Dumping Done</option>
                      <option value="qc-passed">QC Passed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">FCI Unloading Hamali (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={consignmentForm.fciUnloadingHamali}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, fciUnloadingHamali: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">FCI Passing Fee (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={consignmentForm.fciPassingFee}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, fciPassingFee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={consignmentForm.notes}
                      onChange={(e) => setConsignmentForm({ ...consignmentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any notes about this consignment..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Consignment
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

        {/* Add Freight Form */}
        {showFreightForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Lorry Freight</h3>
                <form onSubmit={handleFreightSubmit} className="space-y-4">
                  <div className="flex items-center mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={freightForm.isBranConsignment}
                        onChange={(e) => setFreightForm({ ...freightForm, isBranConsignment: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Bran Consignment</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {freightForm.isBranConsignment ? 'Bran Consignment ID' : 'ACK Number'}
                    </label>
                    <input
                      type="text"
                      value={freightForm.ackNumber}
                      onChange={(e) => setFreightForm({ ...freightForm, ackNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={freightForm.isBranConsignment ? "e.g., BRAN-001" : "e.g., ACK-2025-001"}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lorry Number</label>
                      <input
                        type="text"
                        value={freightForm.lorryNumber}
                        onChange={(e) => setFreightForm({ ...freightForm, lorryNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transporter</label>
                      <select
                        value={freightForm.transporterName}
                        onChange={(e) => {
                          const selectedTransporter = transporters.find(t => t.name === e.target.value);
                          setFreightForm({ 
                            ...freightForm, 
                            transporterName: e.target.value,
                            freightPerMT: selectedTransporter?.defaultRate ? selectedTransporter.defaultRate.toString() : freightForm.freightPerMT
                          });
                          setTimeout(calculateFreightAmounts, 100);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Transporter</option>
                        {transporters.map(transporter => (
                          <option key={transporter.id} value={transporter.name}>{transporter.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (MT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={freightForm.quantityMT}
                        onChange={(e) => {
                          setFreightForm({ ...freightForm, quantityMT: e.target.value });
                          setTimeout(calculateFreightAmounts, 100);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate per MT (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={freightForm.freightPerMT}
                        onChange={(e) => {
                          setFreightForm({ ...freightForm, freightPerMT: e.target.value });
                          setTimeout(calculateFreightAmounts, 100);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">Deductions</h4>
                    <div className="space-y-2">
                      {freightForm.deductions.map((deduction) => (
                        <div key={deduction.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                          <span className="text-sm text-gray-700">{deduction.description}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{formatCurrency(deduction.amount)}</span>
                            <button
                              type="button"
                              onClick={() => removeDeduction(deduction.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <input
                          type="text"
                          value={deductionForm.description}
                          onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                          placeholder="Description"
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <div className="flex">
                          <input
                            type="number"
                            step="0.01"
                            value={deductionForm.amount}
                            onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                            placeholder="Amount"
                            className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <button
                            type="button"
                            onClick={addDeduction}
                            disabled={!deductionForm.description || !deductionForm.amount}
                            className="bg-blue-600 text-white px-2 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gross Amount:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(freightForm.grossFreightAmount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Deductions:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(freightForm.deductions.reduce((sum, d) => sum + d.amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-gray-600">Net Amount:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(freightForm.netFreightAmount) || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={freightForm.advancePaid}
                      onChange={(e) => {
                        setFreightForm({ ...freightForm, advancePaid: e.target.value });
                        setTimeout(calculateFreightAmounts, 100);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Date</label>
                    <input
                      type="date"
                      value={freightForm.dispatchDate}
                      onChange={(e) => setFreightForm({ ...freightForm, dispatchDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={freightForm.notes}
                      onChange={(e) => setFreightForm({ ...freightForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any notes about this freight..."
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Freight
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFreightForm(false)}
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

        {/* Add Transporter Form */}
        {showTransporterForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Transporter</h3>
                <form onSubmit={handleTransporterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transporter Name
                    </label>
                    <input
                      type="text"
                      value={transporterForm.name}
                      onChange={(e) => setTransporterForm({ ...transporterForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={transporterForm.phone}
                      onChange={(e) => setTransporterForm({ ...transporterForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={transporterForm.address}
                      onChange={(e) => setTransporterForm({ ...transporterForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lorry Numbers (comma separated)
                    </label>
                    <input
                      type="text"
                      value={transporterForm.lorryNumbers}
                      onChange={(e) => setTransporterForm({ ...transporterForm, lorryNumbers: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., TS01AB1234, TS02CD5678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Rate per MT (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transporterForm.defaultRate}
                      onChange={(e) => setTransporterForm({ ...transporterForm, defaultRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={transporterForm.notes}
                      onChange={(e) => setTransporterForm({ ...transporterForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Transporter
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTransporterForm(false)}
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

export default FCIConsignments;