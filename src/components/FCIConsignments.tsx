import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Truck, Package, AlertCircle, CheckCircle, Clock, Edit, Save, X, Download } from 'lucide-react';
import { FCIConsignment, LorryFreight, Transporter, RiceProduction, GunnyStock, RexinSticker } from '../types';
import { formatCurrency, formatDecimal } from '../utils/calculations';
import { 
  saveFCIConsignments, loadFCIConsignments, saveLorryFreights, loadLorryFreights,
  saveRiceProductions, loadRiceProductions, saveGunnyStocks, loadGunnyStocks,
  saveRexinStickers, loadRexinStickers
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const FCIConsignments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consignments' | 'freight'>('consignments');
  const [consignments, setConsignments] = useState<FCIConsignment[]>([]);
  const [lorryFreights, setLorryFreights] = useState<LorryFreight[]>([]);
  const [riceProductions, setRiceProductions] = useState<RiceProduction[]>([]);
  const [gunnyStocks, setGunnyStocks] = useState<GunnyStock[]>([]);
  const [rexinStickers, setRexinStickers] = useState<RexinSticker[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    setConsignments(loadFCIConsignments());
    setLorryFreights(loadLorryFreights());
    setRiceProductions(loadRiceProductions());
    setGunnyStocks(loadGunnyStocks());
    setRexinStickers(loadRexinStickers());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    saveFCIConsignments(consignments);
  }, [consignments]);

  useEffect(() => {
    saveLorryFreights(lorryFreights);
  }, [lorryFreights]);

  useEffect(() => {
    saveRiceProductions(riceProductions);
  }, [riceProductions]);

  useEffect(() => {
    saveGunnyStocks(gunnyStocks);
  }, [gunnyStocks]);

  useEffect(() => {
    saveRexinStickers(rexinStickers);
  }, [rexinStickers]);

  // Form states
  const [consignmentForm, setConsignmentForm] = useState({
    ackNumber: '',
    gunnyType: '2024-25-new' as FCIConsignment['gunnyType'],
    consignmentDate: '',
    notes: ''
  });

  const [freightForm, setFreightForm] = useState({
    consignmentId: '',
    ackNumber: '',
    lorryNumber: '',
    transporterName: '',
    freightPerMT: '',
    deductions: [] as { id: string; description: string; amount: number }[],
    advancePaid: '',
    dispatchDate: '',
    notes: '',
    isBranConsignment: false
  });

  const [editForm, setEditForm] = useState({
    ackNumber: '',
    gunnyType: '2024-25-new' as FCIConsignment['gunnyType'],
    consignmentDate: '',
    status: 'in-transit' as FCIConsignment['status'],
    fciWeight: '',
    fciMoisture: '',
    fciUnloadingHamali: '',
    fciPassingFee: '',
    passingFeePaid: false,
    notes: ''
  });

  // Calculate available stocks
  const totalGunnyStock = useMemo(() => {
    return gunnyStocks.reduce((sum, stock) => sum + stock.quantity, 0);
  }, [gunnyStocks]);

  const totalRexinStickers = useMemo(() => {
    return rexinStickers.reduce((sum, sticker) => sum + sticker.remainingQuantity, 0);
  }, [rexinStickers]);

  const availableRiceProductions = useMemo(() => {
    const usedAcks = consignments.map(c => c.ackNumber);
    return riceProductions.filter(prod => !usedAcks.includes(prod.ackNumber));
  }, [riceProductions, consignments]);

  // Calculate summary stats
  const totalConsignments = consignments.length;
  const inTransitCount = consignments.filter(c => c.status === 'in-transit').length;
  const completedCount = consignments.filter(c => c.status === 'dispatched').length;
  const totalFreightPending = useMemo(() => 
    lorryFreights.filter(f => f.paymentStatus === 'pending').reduce((sum, f) => sum + f.balanceAmount, 0), 
    [lorryFreights]
  );

  // Handle consignment creation with stock deduction
  const handleConsignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we have enough stock
    if (totalGunnyStock < 580) {
      alert(`Insufficient gunny stock! Required: 580, Available: ${totalGunnyStock}`);
      return;
    }

    if (totalRexinStickers < 580) {
      alert(`Insufficient rexin stickers! Required: 580, Available: ${totalRexinStickers}`);
      return;
    }

    const newConsignment: FCIConsignment = {
      id: Date.now().toString(),
      ackNumber: consignmentForm.ackNumber,
      riceQuantity: 290,
      frkQuantity: 290,
      totalBags: 580,
      gunnyType: consignmentForm.gunnyType,
      stickersUsed: 580,
      consignmentDate: consignmentForm.consignmentDate,
      status: 'in-transit',
      notes: consignmentForm.notes
    };

    // Deduct gunny stock (580 gunnies)
    let remainingToDeduct = 580;
    const updatedGunnyStocks = gunnyStocks.map(stock => {
      if (remainingToDeduct > 0 && stock.quantity > 0) {
        const deductAmount = Math.min(stock.quantity, remainingToDeduct);
        remainingToDeduct -= deductAmount;
        return { ...stock, quantity: stock.quantity - deductAmount };
      }
      return stock;
    }).filter(stock => stock.quantity > 0);

    // Deduct rexin stickers (580 stickers)
    let remainingStickersToDeduct = 580;
    const updatedRexinStickers = rexinStickers.map(sticker => {
      if (remainingStickersToDeduct > 0 && sticker.remainingQuantity > 0) {
        const deductAmount = Math.min(sticker.remainingQuantity, remainingStickersToDeduct);
        remainingStickersToDeduct -= deductAmount;
        return { 
          ...sticker, 
          usedQuantity: sticker.usedQuantity + deductAmount,
          remainingQuantity: sticker.remainingQuantity - deductAmount 
        };
      }
      return sticker;
    });

    setConsignments([...consignments, newConsignment]);
    setGunnyStocks(updatedGunnyStocks);
    setRexinStickers(updatedRexinStickers);
    
    setConsignmentForm({ ackNumber: '', gunnyType: '2024-25-new', consignmentDate: '', notes: '' });
    setShowAddForm(false);
  };

  const handleFreightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantityMT = freightForm.isBranConsignment ? 29 : 58; // 29 MT for bran, 58 MT for rice
    const freightPerMT = parseFloat(freightForm.freightPerMT);
    const grossFreightAmount = quantityMT * freightPerMT;
    const totalDeductions = freightForm.deductions.reduce((sum, d) => sum + d.amount, 0);
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
      paymentStatus: balanceAmount <= 0 ? 'fully-paid' : advancePaid > 0 ? 'advance-paid' : 'pending',
      notes: freightForm.notes,
      isBranConsignment: freightForm.isBranConsignment
    };

    setLorryFreights([...lorryFreights, newFreight]);
    setFreightForm({ 
      consignmentId: '', ackNumber: '', lorryNumber: '', transporterName: '', 
      freightPerMT: '', deductions: [], advancePaid: '', dispatchDate: '', 
      notes: '', isBranConsignment: false 
    });
    setShowAddForm(false);
  };

  const startEdit = (consignment: FCIConsignment) => {
    setEditingItem(consignment.id);
    setEditForm({
      ackNumber: consignment.ackNumber,
      gunnyType: consignment.gunnyType,
      consignmentDate: consignment.consignmentDate,
      status: consignment.status,
      fciWeight: consignment.fciWeight?.toString() || '',
      fciMoisture: consignment.fciMoisture?.toString() || '',
      fciUnloadingHamali: consignment.fciUnloadingHamali || '',
      fciPassingFee: consignment.fciPassingFee || '',
      passingFeePaid: consignment.passingFeePaid || false,
      notes: consignment.notes || ''
    });
  };

  const saveEdit = (id: string) => {
    setConsignments(consignments.map(consignment => 
      consignment.id === id ? {
        ...consignment,
        ackNumber: editForm.ackNumber,
        gunnyType: editForm.gunnyType,
        consignmentDate: editForm.consignmentDate,
        status: editForm.status,
        fciWeight: editForm.fciWeight ? parseFloat(editForm.fciWeight) : undefined,
        fciMoisture: editForm.fciMoisture ? parseFloat(editForm.fciMoisture) : undefined,
        fciUnloadingHamali: editForm.fciUnloadingHamali,
        fciPassingFee: editForm.fciPassingFee,
        passingFeePaid: editForm.passingFeePaid,
        notes: editForm.notes
      } : consignment
    ));
    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({ 
      ackNumber: '', gunnyType: '2024-25-new', consignmentDate: '', status: 'in-transit',
      fciWeight: '', fciMoisture: '', fciUnloadingHamali: '', fciPassingFee: '', 
      passingFeePaid: false, notes: '' 
    });
  };

  const addDeduction = () => {
    setFreightForm({
      ...freightForm,
      deductions: [...freightForm.deductions, { id: Date.now().toString(), description: '', amount: 0 }]
    });
  };

  const updateDeduction = (id: string, field: 'description' | 'amount', value: string | number) => {
    setFreightForm({
      ...freightForm,
      deductions: freightForm.deductions.map(d => 
        d.id === id ? { ...d, [field]: value } : d
      )
    });
  };

  const removeDeduction = (id: string) => {
    setFreightForm({
      ...freightForm,
      deductions: freightForm.deductions.filter(d => d.id !== id)
    });
  };

  const exportData = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'consignments') {
      csvContent = [
        ['ACK Number', 'Rice Qty (Qtl)', 'FRK Qty (Kg)', 'Total Bags', 'Gunny Type', 'Stickers Used', 'Date', 'Status', 'FCI Weight', 'FCI Moisture', 'Notes'],
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
          consignment.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
      filename = 'fci-consignments.csv';
    } else {
      csvContent = [
        ['ACK Number', 'Lorry Number', 'Transporter', 'Quantity (MT)', 'Freight/MT', 'Gross Amount', 'Net Amount', 'Advance Paid', 'Balance', 'Status', 'Notes'],
        ...lorryFreights.map(freight => [
          freight.ackNumber,
          freight.lorryNumber,
          freight.transporterName,
          freight.quantityMT,
          freight.freightPerMT,
          freight.grossFreightAmount,
          freight.netFreightAmount,
          freight.advancePaid,
          freight.balanceAmount,
          freight.paymentStatus,
          freight.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
      filename = 'lorry-freights.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched': return 'bg-green-100 text-green-800 border-green-200';
      case 'qc-passed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dumping-done': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dispatched': return <CheckCircle className="h-4 w-4" />;
      case 'qc-passed': return <CheckCircle className="h-4 w-4" />;
      case 'dumping-done': return <Package className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: 'consignments', label: 'FCI Consignments', icon: Package },
    { id: 'freight', label: 'Lorry Freight', icon: Truck }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FCI Consignments</h1>
            <p className="text-gray-600 mt-2">Manage FCI rice consignments and lorry freight charges</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportData}
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
              Add {activeTab === 'consignments' ? 'Consignment' : 'Freight'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Consignments"
            value={totalConsignments.toString()}
            subtitle={`${completedCount} completed`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="In Transit"
            value={inTransitCount.toString()}
            subtitle="Pending delivery"
            icon={<Truck className="h-6 w-6" />}
            color="from-yellow-500 to-yellow-600"
          />
          <StatsCard
            title="Freight Pending"
            value={formatCurrency(totalFreightPending)}
            subtitle="Outstanding payments"
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-red-500 to-red-600"
          />
          <StatsCard
            title="Available Stock"
            value={`${totalGunnyStock} Gunnies`}
            subtitle={`${totalRexinStickers} Stickers`}
            icon={<CheckCircle className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FCI Consignment Records</h3>
                {consignments.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No consignments created yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rice/FRK</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gunny Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FCI Details</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {consignments.map((consignment) => (
                          <tr key={consignment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {editingItem === consignment.id ? (
                                <input
                                  type="text"
                                  value={editForm.ackNumber}
                                  onChange={(e) => setEditForm({ ...editForm, ackNumber: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                consignment.ackNumber
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="space-y-1">
                                <div>Rice: {formatDecimal(consignment.riceQuantity, 0)} Qtl</div>
                                <div>FRK: {formatDecimal(consignment.frkQuantity, 0)} Kg</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {consignment.totalBags}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === consignment.id ? (
                                <select
                                  value={editForm.gunnyType}
                                  onChange={(e) => setEditForm({ ...editForm, gunnyType: e.target.value as FCIConsignment['gunnyType'] })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="2024-25-new">2024-25 New</option>
                                  <option value="2023-24-leftover">2023-24 Leftover</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  consignment.gunnyType === '2024-25-new' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {consignment.gunnyType === '2024-25-new' ? 'New 2024-25' : 'Leftover 2023-24'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === consignment.id ? (
                                <input
                                  type="date"
                                  value={editForm.consignmentDate}
                                  onChange={(e) => setEditForm({ ...editForm, consignmentDate: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(consignment.consignmentDate).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {editingItem === consignment.id ? (
                                <select
                                  value={editForm.status}
                                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as FCIConsignment['status'] })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="in-transit">In Transit</option>
                                  <option value="dumping-done">Dumping Done</option>
                                  <option value="qc-passed">QC Passed</option>
                                  <option value="rejected">Rejected</option>
                                  <option value="dispatched">Dispatched</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(consignment.status)}`}>
                                  {getStatusIcon(consignment.status)}
                                  <span className="ml-1 capitalize">{consignment.status.replace('-', ' ')}</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {editingItem === consignment.id ? (
                                <div className="space-y-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Weight"
                                    value={editForm.fciWeight}
                                    onChange={(e) => setEditForm({ ...editForm, fciWeight: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Moisture %"
                                    value={editForm.fciMoisture}
                                    onChange={(e) => setEditForm({ ...editForm, fciMoisture: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {consignment.fciWeight && <div>Weight: {formatDecimal(consignment.fciWeight)} MT</div>}
                                  {consignment.fciMoisture && <div>Moisture: {formatDecimal(consignment.fciMoisture, 1)}%</div>}
                                  {!consignment.fciWeight && !consignment.fciMoisture && <div className="text-gray-400">-</div>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingItem === consignment.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(consignment.id)}
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
                                    onClick={() => startEdit(consignment)}
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

            {activeTab === 'freight' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lorry Freight Records</h3>
                {lorryFreights.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No freight records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate/MT</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lorryFreights.map((freight) => (
                          <tr key={freight.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {freight.ackNumber}
                              {freight.isBranConsignment && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  Bran
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {freight.lorryNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {freight.transporterName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(freight.quantityMT, 0)} MT
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(freight.freightPerMT)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(freight.grossFreightAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(freight.netFreightAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(freight.balanceAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                freight.paymentStatus === 'fully-paid' ? 'bg-green-100 text-green-800' : 
                                freight.paymentStatus === 'advance-paid' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {freight.paymentStatus.replace('-', ' ')}
                              </span>
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

        {/* Add Forms */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add {activeTab === 'consignments' ? 'FCI Consignment' : 'Lorry Freight'}
                </h3>
                
                {activeTab === 'consignments' && (
                  <form onSubmit={handleConsignmentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ACK Number</label>
                      <select
                        value={consignmentForm.ackNumber}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, ackNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select ACK Number</option>
                        {availableRiceProductions.map(prod => (
                          <option key={prod.id} value={prod.ackNumber}>{prod.ackNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gunny Type</label>
                      <select
                        value={consignmentForm.gunnyType}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, gunnyType: e.target.value as FCIConsignment['gunnyType'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="2024-25-new">2024-25 New Gunnies</option>
                        <option value="2023-24-leftover">2023-24 Leftover Gunnies</option>
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
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Consignment Details</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Rice Quantity: 290 Quintals</div>
                        <div>FRK Quantity: 290 Kg</div>
                        <div>Total Bags: 580</div>
                        <div>Stickers Required: 580</div>
                        <div>Gunnies Required: 580</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">Available Stock</h4>
                      <div className="text-xs text-blue-600 space-y-1">
                        <div>Available Gunnies: {totalGunnyStock}</div>
                        <div>Available Stickers: {totalRexinStickers}</div>
                        <div className={`font-medium ${totalGunnyStock >= 580 && totalRexinStickers >= 580 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalGunnyStock >= 580 && totalRexinStickers >= 580 ? '✓ Sufficient stock available' : '✗ Insufficient stock'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={consignmentForm.notes}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Optional notes..."
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button 
                        type="submit" 
                        disabled={totalGunnyStock < 580 || totalRexinStickers < 580}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Create Consignment
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'freight' && (
                  <form onSubmit={handleFreightSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consignment</label>
                      <select
                        value={freightForm.consignmentId}
                        onChange={(e) => {
                          const selectedConsignment = consignments.find(c => c.id === e.target.value);
                          setFreightForm({ 
                            ...freightForm, 
                            consignmentId: e.target.value,
                            ackNumber: selectedConsignment?.ackNumber || ''
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Consignment</option>
                        {consignments.map(consignment => (
                          <option key={consignment.id} value={consignment.id}>
                            {consignment.ackNumber} - {new Date(consignment.consignmentDate).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isBranConsignment"
                        checked={freightForm.isBranConsignment}
                        onChange={(e) => setFreightForm({ ...freightForm, isBranConsignment: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isBranConsignment" className="text-sm font-medium text-gray-700">
                        Bran Consignment (29 MT instead of 58 MT)
                      </label>
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
                        <input
                          type="text"
                          value={freightForm.transporterName}
                          onChange={(e) => setFreightForm({ ...freightForm, transporterName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Freight Rate per MT (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={freightForm.freightPerMT}
                        onChange={(e) => setFreightForm({ ...freightForm, freightPerMT: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    {/* Deductions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Deductions</label>
                        <button
                          type="button"
                          onClick={addDeduction}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Deduction
                        </button>
                      </div>
                      {freightForm.deductions.map((deduction) => (
                        <div key={deduction.id} className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            placeholder="Description"
                            value={deduction.description}
                            onChange={(e) => updateDeduction(deduction.id, 'description', e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={deduction.amount}
                            onChange={(e) => updateDeduction(deduction.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeDeduction(deduction.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={freightForm.advancePaid}
                          onChange={(e) => setFreightForm({ ...freightForm, advancePaid: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
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
                    </div>

                    {freightForm.freightPerMT && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Freight Calculation</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span>{freightForm.isBranConsignment ? '29' : '58'} MT</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate per MT:</span>
                            <span>{formatCurrency(parseFloat(freightForm.freightPerMT || '0'))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gross Amount:</span>
                            <span>{formatCurrency((freightForm.isBranConsignment ? 29 : 58) * parseFloat(freightForm.freightPerMT || '0'))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Deductions:</span>
                            <span>{formatCurrency(freightForm.deductions.reduce((sum, d) => sum + d.amount, 0))}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Net Amount:</span>
                            <span className="font-semibold">
                              {formatCurrency((freightForm.isBranConsignment ? 29 : 58) * parseFloat(freightForm.freightPerMT || '0') - freightForm.deductions.reduce((sum, d) => sum + d.amount, 0))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Advance Paid:</span>
                            <span>{formatCurrency(parseFloat(freightForm.advancePaid || '0'))}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Balance:</span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(((freightForm.isBranConsignment ? 29 : 58) * parseFloat(freightForm.freightPerMT || '0') - freightForm.deductions.reduce((sum, d) => sum + d.amount, 0)) - parseFloat(freightForm.advancePaid || '0'))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={freightForm.notes}
                        onChange={(e) => setFreightForm({ ...freightForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Optional notes..."
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Freight
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FCIConsignments;