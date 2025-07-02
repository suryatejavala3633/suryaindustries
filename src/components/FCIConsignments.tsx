import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Truck, Package, CheckCircle, Clock, AlertCircle, Edit, Save, X, Calculator, CreditCard, FileText, IndianRupee } from 'lucide-react';
import { FCIConsignment, FRKStock, GunnyStock, RexinSticker, RiceProduction, LorryFreight } from '../types';
import { formatNumber, formatDecimal, formatCurrency } from '../utils/calculations';
import { 
  saveFCIConsignments, loadFCIConsignments, 
  saveFRKStocks, loadFRKStocks,
  saveGunnyStocks, loadGunnyStocks,
  saveRexinStickers, loadRexinStickers,
  loadRiceProductions,
  saveLorryFreights, loadLorryFreights
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const FCIConsignments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consignments' | 'freight' | 'payments' | 'expenses'>('consignments');
  const [consignments, setConsignments] = useState<FCIConsignment[]>([]);
  const [frkStocks, setFrkStocks] = useState<FRKStock[]>([]);
  const [gunnyStocks, setGunnyStocks] = useState<GunnyStock[]>([]);
  const [rexinStickers, setRexinStickers] = useState<RexinSticker[]>([]);
  const [riceProductions, setRiceProductions] = useState<RiceProduction[]>([]);
  const [lorryFreights, setLorryFreights] = useState<LorryFreight[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConsignment, setEditingConsignment] = useState<string | null>(null);
  const [selectedFrkBatches, setSelectedFrkBatches] = useState<{[key: string]: number}>({});

  const [consignmentForm, setConsignmentForm] = useState({
    ackNumber: '',
    gunnyType: '2024-25-new' as '2024-25-new' | '2023-24-leftover',
    consignmentDate: '',
    lorryNumber: '',
    transporterName: '',
    freightRate: '',
    eWayBill: '',
    fciUnloadingHamali: '5600',
    fciPassing: '7000',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    ackNumber: '',
    gunnyType: '2024-25-new' as '2024-25-new' | '2023-24-leftover',
    consignmentDate: '',
    lorryNumber: '',
    transporterName: '',
    freightRate: '',
    eWayBill: '',
    fciUnloadingHamali: '5600',
    fciPassing: '7000',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    setConsignments(loadFCIConsignments());
    setFrkStocks(loadFRKStocks());
    setGunnyStocks(loadGunnyStocks());
    setRexinStickers(loadRexinStickers());
    setRiceProductions(loadRiceProductions());
    setLorryFreights(loadLorryFreights());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (consignments.length > 0) saveFCIConsignments(consignments);
  }, [consignments]);

  useEffect(() => {
    if (frkStocks.length > 0) saveFRKStocks(frkStocks);
  }, [frkStocks]);

  useEffect(() => {
    if (gunnyStocks.length > 0) saveGunnyStocks(gunnyStocks);
  }, [gunnyStocks]);

  useEffect(() => {
    if (rexinStickers.length > 0) saveRexinStickers(rexinStickers);
  }, [rexinStickers]);

  useEffect(() => {
    if (lorryFreights.length > 0) saveLorryFreights(lorryFreights);
  }, [lorryFreights]);

  // Calculate available stocks
  const availableStocks = useMemo(() => {
    const totalFrkStock = frkStocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const usedFrkStock = consignments.reduce((sum, consignment) => sum + 290, 0);
    const availableFrkStock = totalFrkStock - usedFrkStock;

    const totalGunnies = gunnyStocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const usedGunnies = consignments.reduce((sum, consignment) => sum + 580, 0);
    const availableGunnies = totalGunnies - usedGunnies;

    const totalStickers = rexinStickers.reduce((sum, sticker) => sum + sticker.quantity, 0);
    const usedStickers = consignments.reduce((sum, consignment) => sum + 580, 0);
    const availableStickers = totalStickers - usedStickers;

    const totalRiceProduced = riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0);
    const usedRiceInConsignments = consignments.reduce((sum, consignment) => sum + 287.1, 0);
    const availableRice = totalRiceProduced - usedRiceInConsignments;

    return {
      availableFrkStock,
      availableGunnies,
      availableStickers,
      availableRice
    };
  }, [frkStocks, gunnyStocks, rexinStickers, riceProductions, consignments]);

  // Get available FRK batches for selection
  const availableFrkBatches = useMemo(() => {
    return frkStocks.filter(stock => stock.quantity > 0).map(stock => ({
      ...stock,
      availableQty: stock.quantity
    }));
  }, [frkStocks]);

  // Calculate total selected FRK quantity
  const selectedFrkQuantity = useMemo(() => {
    return Object.values(selectedFrkBatches).reduce((total, qty) => total + qty, 0);
  }, [selectedFrkBatches]);

  // Calculate FCI expenses
  const fciExpenses = useMemo(() => {
    const totalUnloadingHamali = consignments.reduce((sum, consignment) => 
      sum + parseFloat(consignment.fciUnloadingHamali || '5600'), 0);
    const totalFciPassing = consignments.reduce((sum, consignment) => 
      sum + parseFloat(consignment.fciPassingFee || '7000'), 0);
    const totalExpenses = totalUnloadingHamali + totalFciPassing;
    
    return {
      totalUnloadingHamali,
      totalFciPassing,
      totalExpenses
    };
  }, [consignments]);

  const handleFrkBatchSelection = (batchId: string, quantity: number) => {
    setSelectedFrkBatches(prev => ({
      ...prev,
      [batchId]: quantity
    }));
  };

  const startEditConsignment = (consignment: FCIConsignment) => {
    setEditingConsignment(consignment.id);
    setEditForm({
      ackNumber: consignment.ackNumber,
      gunnyType: consignment.gunnyType,
      consignmentDate: consignment.consignmentDate,
      lorryNumber: consignment.lorryNumber || '',
      transporterName: consignment.transporterName || '',
      freightRate: '',
      eWayBill: consignment.eWayBill || '',
      fciUnloadingHamali: consignment.fciUnloadingHamali || '5600',
      fciPassing: consignment.fciPassingFee || '7000',
      notes: consignment.notes || ''
    });
  };

  const saveEditConsignment = (id: string) => {
    setConsignments(consignments.map(consignment => 
      consignment.id === id ? {
        ...consignment,
        ackNumber: editForm.ackNumber,
        gunnyType: editForm.gunnyType,
        consignmentDate: editForm.consignmentDate,
        lorryNumber: editForm.lorryNumber,
        transporterName: editForm.transporterName,
        eWayBill: editForm.eWayBill,
        fciUnloadingHamali: editForm.fciUnloadingHamali,
        fciPassingFee: editForm.fciPassing,
        notes: editForm.notes
      } : consignment
    ));
    setEditingConsignment(null);
  };

  const cancelEditConsignment = () => {
    setEditingConsignment(null);
    setEditForm({
      ackNumber: '',
      gunnyType: '2024-25-new',
      consignmentDate: '',
      lorryNumber: '',
      transporterName: '',
      freightRate: '',
      eWayBill: '',
      fciUnloadingHamali: '5600',
      fciPassing: '7000',
      notes: ''
    });
  };

  const handleConsignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (availableStocks.availableRice < 287.1) {
      alert(`Insufficient rice! Required: 287.1 Qtl, Available: ${formatDecimal(availableStocks.availableRice)} Qtl`);
      return;
    }

    if (availableStocks.availableGunnies < 580) {
      alert(`Insufficient gunnies! Required: 580, Available: ${availableStocks.availableGunnies}`);
      return;
    }

    if (availableStocks.availableStickers < 580) {
      alert(`Insufficient stickers! Required: 580, Available: ${availableStocks.availableStickers}`);
      return;
    }

    if (selectedFrkQuantity < 290) {
      alert(`Insufficient FRK selected! Required: 290 kg, Selected: ${selectedFrkQuantity} kg`);
      return;
    }

    // Create new consignment
    const newConsignment: FCIConsignment = {
      id: Date.now().toString(),
      ackNumber: consignmentForm.ackNumber,
      riceQuantity: 287.1,
      frkQuantity: 290,
      totalBags: 580,
      gunnyType: consignmentForm.gunnyType,
      stickersUsed: 580,
      consignmentDate: consignmentForm.consignmentDate,
      status: 'in-transit',
      lorryNumber: consignmentForm.lorryNumber,
      transporterName: consignmentForm.transporterName,
      eWayBill: consignmentForm.eWayBill,
      fciUnloadingHamali: consignmentForm.fciUnloadingHamali,
      fciPassingFee: consignmentForm.fciPassing,
      notes: consignmentForm.notes
    };

    // Create lorry freight entry
    if (consignmentForm.lorryNumber && consignmentForm.freightRate) {
      const freightRate = parseFloat(consignmentForm.freightRate);
      const totalFreight = 29 * freightRate; // 29 MT (290 Qtl)
      
      const newFreight: LorryFreight = {
        id: Date.now().toString() + '_freight',
        consignmentId: newConsignment.id,
        ackNumber: consignmentForm.ackNumber,
        lorryNumber: consignmentForm.lorryNumber,
        transporterName: consignmentForm.transporterName,
        quantityMT: 29,
        freightPerMT: freightRate,
        grossFreightAmount: totalFreight,
        deductions: [],
        netFreightAmount: totalFreight,
        advancePaid: 0,
        balanceAmount: totalFreight,
        dispatchDate: consignmentForm.consignmentDate,
        paymentStatus: 'pending'
      };
      
      setLorryFreights(prev => [...prev, newFreight]);
    }

    // Update FRK stocks
    const updatedFrkStocks = frkStocks.map(stock => {
      const selectedQty = selectedFrkBatches[stock.id] || 0;
      if (selectedQty > 0) {
        return { ...stock, quantity: stock.quantity - selectedQty };
      }
      return stock;
    });

    // Update gunny stocks
    let remainingGunniesNeeded = 580;
    const updatedGunnyStocks = gunnyStocks.map(stock => {
      if (stock.type === consignmentForm.gunnyType && remainingGunniesNeeded > 0) {
        const deductAmount = Math.min(stock.quantity, remainingGunniesNeeded);
        remainingGunniesNeeded -= deductAmount;
        return { ...stock, quantity: stock.quantity - deductAmount };
      }
      return stock;
    });

    // Update rexin stickers
    let remainingStickersNeeded = 580;
    const updatedRexinStickers = rexinStickers.map(sticker => {
      if (remainingStickersNeeded > 0) {
        const deductAmount = Math.min(sticker.remainingQuantity, remainingStickersNeeded);
        remainingStickersNeeded -= deductAmount;
        return { 
          ...sticker, 
          usedQuantity: sticker.usedQuantity + deductAmount,
          remainingQuantity: sticker.remainingQuantity - deductAmount
        };
      }
      return sticker;
    });

    // Update all states
    setConsignments(prev => [...prev, newConsignment]);
    setFrkStocks(updatedFrkStocks);
    setGunnyStocks(updatedGunnyStocks);
    setRexinStickers(updatedRexinStickers);

    // Reset form
    setConsignmentForm({
      ackNumber: '',
      gunnyType: '2024-25-new',
      consignmentDate: '',
      lorryNumber: '',
      transporterName: '',
      freightRate: '',
      eWayBill: '',
      fciUnloadingHamali: '5600',
      fciPassing: '7000',
      notes: ''
    });
    setSelectedFrkBatches({});
    setShowAddForm(false);
  };

  const tabs = [
    { id: 'consignments', label: 'FCI Consignments', icon: Truck, color: 'from-blue-500 to-blue-600' },
    { id: 'freight', label: 'Lorry Freight', icon: Calculator, color: 'from-green-500 to-green-600' },
    { id: 'payments', label: 'Freight Payments', icon: CreditCard, color: 'from-purple-500 to-purple-600' },
    { id: 'expenses', label: 'FCI Expenses', icon: IndianRupee, color: 'from-orange-500 to-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FCI Consignments</h1>
            <p className="text-gray-600 mt-2">Manage fortified rice consignments and freight</p>
          </div>
          {activeTab === 'consignments' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FCI Consignment
            </button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Available Rice"
            value={`${formatDecimal(availableStocks.availableRice)} Qtl`}
            subtitle={`${Math.floor(availableStocks.availableRice / 287.1)} ACKs possible`}
            icon={<Package className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Available FRK"
            value={`${formatNumber(availableStocks.availableFrkStock)} kg`}
            subtitle={`${Math.floor(availableStocks.availableFrkStock / 290)} ACKs possible`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Available Gunnies"
            value={formatNumber(availableStocks.availableGunnies)}
            subtitle={`${Math.floor(availableStocks.availableGunnies / 580)} ACKs possible`}
            icon={<Package className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Available Stickers"
            value={formatNumber(availableStocks.availableStickers)}
            subtitle={`${Math.floor(availableStocks.availableStickers / 580)} ACKs possible`}
            icon={<Package className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Total Consignments"
            value={formatNumber(consignments.length)}
            subtitle={`${formatDecimal(consignments.length * 290)} Qtl total`}
            icon={<Truck className="h-6 w-6" />}
            color="from-red-500 to-red-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-1 rounded-lg bg-gradient-to-r ${tab.color} ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
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
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FCI consignments yet. Create your first consignment.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantities</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FCI Expenses</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                  value={editForm.ackNumber}
                                  onChange={(e) => setEditForm({ ...editForm, ackNumber: e.target.value })}
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
                                  value={editForm.consignmentDate}
                                  onChange={(e) => setEditForm({ ...editForm, consignmentDate: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(consignment.consignmentDate).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <div className="space-y-1">
                                <div>Rice: <span className="font-semibold">{formatDecimal(consignment.riceQuantity)} Qtl</span></div>
                                <div>FRK: <span className="font-semibold">{formatDecimal(consignment.frkQuantity)} kg</span></div>
                                <div>Total: <span className="font-semibold">290.0 Qtl</span></div>
                                <div>Bags: <span className="font-semibold">{consignment.totalBags}</span></div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                <div>Lorry: 
                                  {editingConsignment === consignment.id ? (
                                    <input
                                      type="text"
                                      value={editForm.lorryNumber}
                                      onChange={(e) => setEditForm({ ...editForm, lorryNumber: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mt-1"
                                      placeholder="Lorry number"
                                    />
                                  ) : (
                                    <span className="font-medium ml-1">{consignment.lorryNumber || '-'}</span>
                                  )}
                                </div>
                                <div>Transporter: 
                                  {editingConsignment === consignment.id ? (
                                    <input
                                      type="text"
                                      value={editForm.transporterName}
                                      onChange={(e) => setEditForm({ ...editForm, transporterName: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mt-1"
                                      placeholder="Transporter name"
                                    />
                                  ) : (
                                    <span className="font-medium ml-1">{consignment.transporterName || '-'}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <div className="space-y-1">
                                <div>Hamali: 
                                  {editingConsignment === consignment.id ? (
                                    <input
                                      type="number"
                                      value={editForm.fciUnloadingHamali}
                                      onChange={(e) => setEditForm({ ...editForm, fciUnloadingHamali: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mt-1"
                                    />
                                  ) : (
                                    <span className="font-semibold ml-1">{formatCurrency(parseFloat(consignment.fciUnloadingHamali || '5600'))}</span>
                                  )}
                                </div>
                                <div>Passing: 
                                  {editingConsignment === consignment.id ? (
                                    <input
                                      type="number"
                                      value={editForm.fciPassing}
                                      onChange={(e) => setEditForm({ ...editForm, fciPassing: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mt-1"
                                    />
                                  ) : (
                                    <span className="font-semibold ml-1">{formatCurrency(parseFloat(consignment.fciPassingFee || '7000'))}</span>
                                  )}
                                </div>
                                <div className="text-xs text-blue-600 font-medium">
                                  Total: {formatCurrency(parseFloat(consignment.fciUnloadingHamali || '5600') + parseFloat(consignment.fciPassingFee || '7000'))}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                consignment.status === 'dispatched' ? 'bg-green-100 text-green-800 border-green-200' :
                                consignment.status === 'qc-passed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                consignment.status === 'dumping-done' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                consignment.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                <span className="capitalize">{consignment.status.replace('-', ' ')}</span>
                              </span>
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
                                      onClick={cancelEditConsignment}
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

            {activeTab === 'freight' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lorry Freight Records</h3>
                {lorryFreights.length === 0 ? (
                  <div className="text-center py-8">
                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No freight records yet. Create consignments to generate freight entries.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (MT)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Freight</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advances</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freight Dues</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lorryFreights.map((freight, index) => (
                          <tr key={freight.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(freight.dispatchDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {freight.lorryNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {freight.quantityMT} MT
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(freight.freightPerMT)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(freight.grossFreightAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatCurrency(freight.advancePaid)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(freight.balanceAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Freight Payment Dashboard</h3>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Payment management system coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FCI Expense Summary</h3>
                
                {/* Expense Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatsCard
                    title="FCI Unloading Hamali"
                    value={formatCurrency(fciExpenses.totalUnloadingHamali)}
                    subtitle={`${consignments.length} ACKs × ₹5,600`}
                    icon={<Truck className="h-6 w-6" />}
                    color="from-blue-500 to-blue-600"
                  />
                  <StatsCard
                    title="FCI Passing Fee"
                    value={formatCurrency(fciExpenses.totalFciPassing)}
                    subtitle={`${consignments.length} ACKs × ₹7,000`}
                    icon={<FileText className="h-6 w-6" />}
                    color="from-green-500 to-green-600"
                  />
                  <StatsCard
                    title="Total FCI Expenses"
                    value={formatCurrency(fciExpenses.totalExpenses)}
                    subtitle="Hamali + Passing Fee"
                    icon={<IndianRupee className="h-6 w-6" />}
                    color="from-red-500 to-red-600"
                  />
                </div>

                {/* Detailed Expense Table */}
                {consignments.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FCI expenses yet. Create consignments to track expenses.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900">Expense Breakdown by ACK</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unloading Hamali</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passing Fee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expense</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {consignments.map((consignment) => {
                            const hamaliAmount = parseFloat(consignment.fciUnloadingHamali || '5600');
                            const passingAmount = parseFloat(consignment.fciPassingFee || '7000');
                            const totalExpense = hamaliAmount + passingAmount;
                            
                            return (
                              <tr key={consignment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {consignment.ackNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {new Date(consignment.consignmentDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{formatCurrency(hamaliAmount)}</span>
                                    <span className="text-xs text-green-600">Paid at FCI</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{formatCurrency(passingAmount)}</span>
                                    <span className="text-xs text-orange-600">Paid later</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                  {formatCurrency(totalExpense)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex flex-col space-y-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Hamali: Paid
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      Passing: Pending
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expense Notes */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">FCI Expense Information:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>FCI Unloading Hamali:</strong> ₹5,600 per ACK - Paid directly to hamali workers at FCI godown</li>
                    <li>• <strong>FCI Passing Fee:</strong> ₹7,000 per ACK - Paid to FCI staff by miller representative at a later date</li>
                    <li>• <strong>Additional Costs:</strong> Overhead expenses may occur during FCI operations and should be recorded separately</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Consignment Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add FCI Consignment</h3>
                <form onSubmit={handleConsignmentSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ACK Number
                      </label>
                      <input
                        type="text"
                        value={consignmentForm.ackNumber}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, ackNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter ACK Number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Consignment Date
                      </label>
                      <input
                        type="date"
                        value={consignmentForm.consignmentDate}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, consignmentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lorry Number
                      </label>
                      <input
                        type="text"
                        value={consignmentForm.lorryNumber}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, lorryNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter lorry number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transporter Name
                      </label>
                      <input
                        type="text"
                        value={consignmentForm.transporterName}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, transporterName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter transporter name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Freight Rate (₹ per MT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={consignmentForm.freightRate}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, freightRate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter rate per MT"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        FCI Unloading Hamali (₹)
                      </label>
                      <input
                        type="number"
                        value={consignmentForm.fciUnloadingHamali}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, fciUnloadingHamali: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        FCI Passing Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={consignmentForm.fciPassing}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, fciPassing: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gunny Type
                      </label>
                      <select
                        value={consignmentForm.gunnyType}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, gunnyType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="2024-25-new">2024-25 New Gunnies</option>
                        <option value="2023-24-leftover">2023-24 Leftover Gunnies</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-Way Bill Number
                      </label>
                      <input
                        type="text"
                        value={consignmentForm.eWayBill}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, eWayBill: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter E-Way Bill number"
                      />
                    </div>
                  </div>

                  {/* FRK Batch Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select FRK Batches (Required: 290 kg)
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                      {availableFrkBatches.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No FRK batches available</p>
                      ) : (
                        <div className="space-y-3">
                          {availableFrkBatches.map((batch) => (
                            <div key={batch.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                                <div className="text-sm text-gray-600">{batch.supplier}</div>
                                <div className="text-sm text-green-600">Available: {batch.availableQty} kg</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={batch.availableQty}
                                  value={selectedFrkBatches[batch.id] || 0}
                                  onChange={(e) => handleFrkBatchSelection(batch.id, parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500">kg</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className={`font-medium ${selectedFrkQuantity >= 290 ? 'text-green-600' : 'text-red-600'}`}>
                        Selected: {selectedFrkQuantity} kg / 290 kg required
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">Consignment Summary</h4>
                    <div className="text-xs text-blue-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Rice Quantity:</span>
                        <span className="font-semibold">287.1 Qtl</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FRK Quantity:</span>
                        <span className="font-semibold">2.9 Qtl (290 kg)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Fortified Rice:</span>
                        <span className="font-semibold">290.0 Qtl</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gunnies Required:</span>
                        <span className="font-semibold">580 bags</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span>FCI Unloading Hamali:</span>
                        <span className="font-semibold">{formatCurrency(parseFloat(consignmentForm.fciUnloadingHamali))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FCI Passing Fee:</span>
                        <span className="font-semibold">{formatCurrency(parseFloat(consignmentForm.fciPassing))}</span>
                      </div>
                      {consignmentForm.freightRate && (
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span>Freight Amount:</span>
                          <span className="font-semibold">{formatCurrency(29 * parseFloat(consignmentForm.freightRate || '0'))}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={
                        availableStocks.availableRice < 287.1 || 
                        availableStocks.availableGunnies < 580 || 
                        availableStocks.availableStickers < 580 ||
                        selectedFrkQuantity < 290
                      }
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Create Consignment
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
      </div>
    </div>
  );
};

export default FCIConsignments;