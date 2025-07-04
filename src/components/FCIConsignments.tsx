import React, { useState, useEffect } from 'react';
import { Plus, Truck, Package, AlertCircle, CheckCircle, Clock, Edit, Save, X, Trash2 } from 'lucide-react';
import { FCIConsignment, RiceProduction, GunnyStock, FRKStock, RexinSticker, LorryFreight } from '../types';
import { formatNumber, formatDecimal, formatCurrency, formatWeight } from '../utils/calculations';
import { 
  saveFCIConsignments, loadFCIConsignments, saveRiceProductions, loadRiceProductions,
  saveGunnyStocks, loadGunnyStocks, saveFRKStocks, loadFRKStocks,
  saveRexinStickers, loadRexinStickers, saveLorryFreights, loadLorryFreights
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const FCIConsignments: React.FC = () => {
  const [consignments, setConsignments] = useState<FCIConsignment[]>([]);
  const [riceProductions, setRiceProductions] = useState<RiceProduction[]>([]);
  const [gunnyStocks, setGunnyStocks] = useState<GunnyStock[]>([]);
  const [frkStocks, setFrkStocks] = useState<FRKStock[]>([]);
  const [rexinStickers, setRexinStickers] = useState<RexinSticker[]>([]);
  const [lorryFreights, setLorryFreights] = useState<LorryFreight[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConsignment, setEditingConsignment] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [consignmentForm, setConsignmentForm] = useState({
    ackNumber: '',
    gunnyType: '2024-25-new' as '2024-25-new' | '2023-24-leftover',
    consignmentDate: '',
    lorryNumber: '',
    transporterName: '',
    eWayBill: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    ackNumber: '',
    gunnyType: '2024-25-new' as '2024-25-new' | '2023-24-leftover',
    consignmentDate: '',
    lorryNumber: '',
    transporterName: '',
    eWayBill: '',
    fciWeight: '',
    fciMoisture: '',
    fciUnloadingHamali: '',
    fciPassingFee: '',
    passingFeePaid: false,
    notes: '',
    status: 'in-transit' as FCIConsignment['status']
  });

  // Load data on component mount
  useEffect(() => {
    setConsignments(loadFCIConsignments());
    setRiceProductions(loadRiceProductions());
    setGunnyStocks(loadGunnyStocks());
    setFrkStocks(loadFRKStocks());
    setRexinStickers(loadRexinStickers());
    setLorryFreights(loadLorryFreights());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (consignments.length > 0) {
      saveFCIConsignments(consignments);
    }
  }, [consignments]);

  // Calculate available stocks
  const availableRice = riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0);
  const usedRice = consignments.reduce((sum, cons) => sum + cons.riceQuantity, 0);
  const remainingRice = availableRice - usedRice;

  const availableFRK = frkStocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const usedFRK = consignments.reduce((sum, cons) => sum + cons.frkQuantity, 0);
  const remainingFRK = availableFRK - usedFRK;

  const availableGunnies = gunnyStocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const usedGunnies = consignments.reduce((sum, cons) => sum + cons.totalBags, 0);
  const remainingGunnies = availableGunnies - usedGunnies;

  const availableStickers = rexinStickers.reduce((sum, stock) => sum + stock.remainingQuantity, 0);
  const usedStickers = consignments.reduce((sum, cons) => sum + cons.stickersUsed, 0);
  const remainingStickers = availableStickers - usedStickers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate stock availability
    if (remainingRice < 287.1) {
      alert(`Insufficient rice! Required: 287.1 Qtl, Available: ${formatDecimal(remainingRice)} Qtl`);
      return;
    }
    
    if (remainingFRK < 290) {
      alert(`Insufficient FRK! Required: 290 kg, Available: ${formatDecimal(remainingFRK)} kg`);
      return;
    }
    
    if (remainingGunnies < 580) {
      alert(`Insufficient gunnies! Required: 580, Available: ${remainingGunnies}`);
      return;
    }
    
    if (remainingStickers < 580) {
      alert(`Insufficient stickers! Required: 580, Available: ${remainingStickers}`);
      return;
    }

    const newConsignment: FCIConsignment = {
      id: Date.now().toString(),
      ackNumber: consignmentForm.ackNumber,
      riceQuantity: 287.1, // Fixed per ACK
      frkQuantity: 290, // Fixed per ACK (290 kg)
      totalBags: 580, // Fixed per ACK (580 bags)
      gunnyType: consignmentForm.gunnyType,
      stickersUsed: 580, // Fixed per ACK
      consignmentDate: consignmentForm.consignmentDate,
      status: 'in-transit',
      lorryNumber: consignmentForm.lorryNumber,
      transporterName: consignmentForm.transporterName,
      eWayBill: consignmentForm.eWayBill,
      notes: consignmentForm.notes
    };

    const updatedConsignments = [...consignments, newConsignment];
    setConsignments(updatedConsignments);

    // Update stock quantities
    updateStockQuantities(newConsignment);

    setConsignmentForm({ 
      ackNumber: '', 
      gunnyType: '2024-25-new', 
      consignmentDate: '', 
      lorryNumber: '', 
      transporterName: '', 
      eWayBill: '', 
      notes: '' 
    });
    setShowAddForm(false);
  };

  const updateStockQuantities = (consignment: FCIConsignment) => {
    // Update gunny stock
    const updatedGunnyStocks = gunnyStocks.map(stock => {
      if (stock.type === consignment.gunnyType && stock.quantity >= consignment.totalBags) {
        return { ...stock, quantity: stock.quantity - consignment.totalBags };
      }
      return stock;
    });
    setGunnyStocks(updatedGunnyStocks);
    saveGunnyStocks(updatedGunnyStocks);

    // Update FRK stock
    const updatedFrkStocks = frkStocks.map(stock => {
      if (stock.quantity >= consignment.frkQuantity) {
        return { ...stock, quantity: stock.quantity - consignment.frkQuantity };
      }
      return stock;
    });
    setFrkStocks(updatedFrkStocks);
    saveFRKStocks(updatedFrkStocks);

    // Update sticker stock
    const updatedStickerStocks = rexinStickers.map(stock => {
      if (stock.remainingQuantity >= consignment.stickersUsed) {
        return { 
          ...stock, 
          usedQuantity: stock.usedQuantity + consignment.stickersUsed,
          remainingQuantity: stock.remainingQuantity - consignment.stickersUsed
        };
      }
      return stock;
    });
    setRexinStickers(updatedStickerStocks);
    saveRexinStickers(updatedStickerStocks);
  };

  const startEdit = (consignment: FCIConsignment) => {
    setEditingConsignment(consignment.id);
    setEditForm({
      ackNumber: consignment.ackNumber,
      gunnyType: consignment.gunnyType,
      consignmentDate: consignment.consignmentDate,
      lorryNumber: consignment.lorryNumber || '',
      transporterName: consignment.transporterName || '',
      eWayBill: consignment.eWayBill || '',
      fciWeight: consignment.fciWeight?.toString() || '',
      fciMoisture: consignment.fciMoisture?.toString() || '',
      fciUnloadingHamali: consignment.fciUnloadingHamali || '',
      fciPassingFee: consignment.fciPassingFee || '',
      passingFeePaid: consignment.passingFeePaid || false,
      notes: consignment.notes || '',
      status: consignment.status
    });
  };

  const saveEdit = (id: string) => {
    setConsignments(consignments.map(consignment => 
      consignment.id === id ? {
        ...consignment,
        ackNumber: editForm.ackNumber,
        gunnyType: editForm.gunnyType,
        consignmentDate: editForm.consignmentDate,
        lorryNumber: editForm.lorryNumber,
        transporterName: editForm.transporterName,
        eWayBill: editForm.eWayBill,
        fciWeight: parseFloat(editForm.fciWeight) || undefined,
        fciMoisture: parseFloat(editForm.fciMoisture) || undefined,
        fciUnloadingHamali: editForm.fciUnloadingHamali,
        fciPassingFee: editForm.fciPassingFee,
        passingFeePaid: editForm.passingFeePaid,
        notes: editForm.notes,
        status: editForm.status
      } : consignment
    ));
    setEditingConsignment(null);
  };

  const cancelEdit = () => {
    setEditingConsignment(null);
    setEditForm({
      ackNumber: '',
      gunnyType: '2024-25-new',
      consignmentDate: '',
      lorryNumber: '',
      transporterName: '',
      eWayBill: '',
      fciWeight: '',
      fciMoisture: '',
      fciUnloadingHamali: '',
      fciPassingFee: '',
      passingFeePaid: false,
      notes: '',
      status: 'in-transit'
    });
  };

  const deleteConsignment = (id: string) => {
    const consignmentToDelete = consignments.find(c => c.id === id);
    if (consignmentToDelete) {
      // Restore stock quantities
      restoreStockQuantities(consignmentToDelete);
      
      // Remove consignment
      setConsignments(consignments.filter(consignment => consignment.id !== id));
      
      // Remove associated lorry freight if exists
      const updatedFreights = lorryFreights.filter(freight => freight.consignmentId !== id);
      setLorryFreights(updatedFreights);
      saveLorryFreights(updatedFreights);
    }
    setShowDeleteConfirm(null);
  };

  const restoreStockQuantities = (consignment: FCIConsignment) => {
    // Restore gunny stock
    const updatedGunnyStocks = gunnyStocks.map(stock => {
      if (stock.type === consignment.gunnyType) {
        return { ...stock, quantity: stock.quantity + consignment.totalBags };
      }
      return stock;
    });
    setGunnyStocks(updatedGunnyStocks);
    saveGunnyStocks(updatedGunnyStocks);

    // Restore FRK stock
    const updatedFrkStocks = frkStocks.map((stock, index) => {
      if (index === 0) { // Add to first available stock
        return { ...stock, quantity: stock.quantity + consignment.frkQuantity };
      }
      return stock;
    });
    setFrkStocks(updatedFrkStocks);
    saveFRKStocks(updatedFrkStocks);

    // Restore sticker stock
    const updatedStickerStocks = rexinStickers.map((stock, index) => {
      if (index === 0) { // Add to first available stock
        return { 
          ...stock, 
          usedQuantity: Math.max(0, stock.usedQuantity - consignment.stickersUsed),
          remainingQuantity: stock.remainingQuantity + consignment.stickersUsed
        };
      }
      return stock;
    });
    setRexinStickers(updatedStickerStocks);
    saveRexinStickers(updatedStickerStocks);
  };

  const getStatusColor = (status: FCIConsignment['status']) => {
    switch (status) {
      case 'dispatched': return 'bg-green-100 text-green-800 border-green-200';
      case 'qc-passed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dumping-done': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: FCIConsignment['status']) => {
    switch (status) {
      case 'dispatched': return <CheckCircle className="h-4 w-4" />;
      case 'qc-passed': return <CheckCircle className="h-4 w-4" />;
      case 'dumping-done': return <Package className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate summary stats
  const totalConsignments = consignments.length;
  const completedConsignments = consignments.filter(c => c.status === 'dispatched').length;
  const inTransitConsignments = consignments.filter(c => c.status === 'in-transit').length;
  const rejectedConsignments = consignments.filter(c => c.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FCI Consignments</h1>
            <p className="text-gray-600 mt-2">Manage rice consignments to FCI - Each ACK = 287.1 Qtl Rice + 290 kg FRK in 580 bags</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Consignment
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Consignments"
            value={formatNumber(totalConsignments)}
            subtitle={`${completedConsignments} completed`}
            icon={<Truck className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="In Transit"
            value={formatNumber(inTransitConsignments)}
            subtitle="Pending delivery"
            icon={<Clock className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Available Rice"
            value={formatWeight(remainingRice)}
            subtitle={`Used: ${formatWeight(usedRice)}`}
            icon={<Package className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Available FRK"
            value={`${formatDecimal(remainingFRK)} kg`}
            subtitle={`Used: ${formatDecimal(usedFRK)} kg`}
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Stock Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-700 mb-2">Rice Stock</h4>
                <div className="text-2xl font-bold text-blue-900">{formatWeight(remainingRice)}</div>
                <div className="text-sm text-blue-600">Available for consignment</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-700 mb-2">FRK Stock</h4>
                <div className="text-2xl font-bold text-green-900">{formatDecimal(remainingFRK)} kg</div>
                <div className="text-sm text-green-600">Available for mixing</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-700 mb-2">Gunny Bags</h4>
                <div className="text-2xl font-bold text-purple-900">{formatNumber(remainingGunnies)}</div>
                <div className="text-sm text-purple-600">Available for packing</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-orange-700 mb-2">Rexin Stickers</h4>
                <div className="text-2xl font-bold text-orange-900">{formatNumber(remainingStickers)}</div>
                <div className="text-sm text-orange-600">Available for sealing</div>
              </div>
            </div>
          </div>
        </div>

        {/* Consignments Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">FCI Consignment Records</h3>
            {consignments.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No consignments created yet. Add your first consignment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rice (Qtl)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FRK (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FCI Details</th>
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatDecimal(consignment.riceQuantity)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDecimal(consignment.frkQuantity)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(consignment.totalBags)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {editingConsignment === consignment.id ? (
                            <input
                              type="text"
                              value={editForm.lorryNumber}
                              onChange={(e) => setEditForm({ ...editForm, lorryNumber: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="Lorry number"
                            />
                          ) : (
                            consignment.lorryNumber || '-'
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {editingConsignment === consignment.id ? (
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
                          {editingConsignment === consignment.id ? (
                            <div className="space-y-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.fciWeight}
                                onChange={(e) => setEditForm({ ...editForm, fciWeight: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="FCI Weight"
                              />
                              <input
                                type="number"
                                step="0.1"
                                value={editForm.fciMoisture}
                                onChange={(e) => setEditForm({ ...editForm, fciMoisture: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="Moisture %"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {consignment.fciWeight && (
                                <div className="text-xs">Weight: {formatDecimal(consignment.fciWeight)} Qtl</div>
                              )}
                              {consignment.fciMoisture && (
                                <div className="text-xs">Moisture: {consignment.fciMoisture}%</div>
                              )}
                              {!consignment.fciWeight && !consignment.fciMoisture && '-'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            {editingConsignment === consignment.id ? (
                              <>
                                <button
                                  onClick={() => saveEdit(consignment.id)}
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
                                  onClick={() => startEdit(consignment)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit consignment"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(consignment.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete consignment"
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

        {/* Add Consignment Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add FCI Consignment</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ACK Number
                    </label>
                    <input
                      type="text"
                      value={consignmentForm.ackNumber}
                      onChange={(e) => setConsignmentForm({ ...consignmentForm, ackNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., ACK-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gunny Type
                    </label>
                    <select
                      value={consignmentForm.gunnyType}
                      onChange={(e) => setConsignmentForm({ ...consignmentForm, gunnyType: e.target.value as '2024-25-new' | '2023-24-leftover' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="2024-25-new">2024-25 New Gunnies</option>
                      <option value="2023-24-leftover">2023-24 Leftover Gunnies</option>
                    </select>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lorry Number
                    </label>
                    <input
                      type="text"
                      value={consignmentForm.lorryNumber}
                      onChange={(e) => setConsignmentForm({ ...consignmentForm, lorryNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., TS09UA1234"
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
                      placeholder="Transporter name"
                    />
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
                      placeholder="E-Way Bill number"
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Consignment Details</h4>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Rice Quantity:</span>
                        <span className="font-semibold">287.1 Qtl</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FRK Quantity:</span>
                        <span className="font-semibold">290 kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Bags:</span>
                        <span className="font-semibold">580 bags</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stickers Used:</span>
                        <span className="font-semibold">580 stickers</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={consignmentForm.notes}
                      onChange={(e) => setConsignmentForm({ ...consignmentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={remainingRice < 287.1 || remainingFRK < 290 || remainingGunnies < 580 || remainingStickers < 580}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this consignment? This will restore the stock quantities and cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => deleteConsignment(showDeleteConfirm)}
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

export default FCIConsignments;