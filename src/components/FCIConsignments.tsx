import React, { useState, useEffect } from 'react';
import { Plus, Truck, Package, CheckCircle, Clock, AlertCircle, Edit, Save, X } from 'lucide-react';
import { FCIConsignment, FRKStock, GunnyStock, RexinSticker, RiceProduction } from '../types';
import { formatNumber, formatDecimal, formatCurrency } from '../utils/calculations';
import { 
  saveFCIConsignments, loadFCIConsignments, 
  saveFRKStocks, loadFRKStocks,
  saveGunnyStocks, loadGunnyStocks,
  saveRexinStickers, loadRexinStickers,
  loadRiceProductions
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const FCIConsignments: React.FC = () => {
  const [consignments, setConsignments] = useState<FCIConsignment[]>([]);
  const [frkStocks, setFrkStocks] = useState<FRKStock[]>([]);
  const [gunnyStocks, setGunnyStocks] = useState<GunnyStock[]>([]);
  const [rexinStickers, setRexinStickers] = useState<RexinSticker[]>([]);
  const [riceProductions, setRiceProductions] = useState<RiceProduction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConsignment, setEditingConsignment] = useState<string | null>(null);
  const [selectedFrkBatches, setSelectedFrkBatches] = useState<string[]>([]);

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
    status: 'in-transit' as FCIConsignment['status'],
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    setConsignments(loadFCIConsignments());
    setFrkStocks(loadFRKStocks());
    setGunnyStocks(loadGunnyStocks());
    setRexinStickers(loadRexinStickers());
    setRiceProductions(loadRiceProductions());
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

  // Calculate available stocks
  const totalFrkStock = frkStocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const usedFrkStock = consignments.reduce((sum, consignment) => sum + 290, 0); // 290 kg per consignment
  const availableFrkStock = totalFrkStock - usedFrkStock;

  const totalGunnies = gunnyStocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const usedGunnies = consignments.reduce((sum, consignment) => sum + 580, 0); // 580 gunnies per consignment
  const availableGunnies = totalGunnies - usedGunnies;

  const totalStickers = rexinStickers.reduce((sum, sticker) => sum + sticker.quantity, 0);
  const usedStickers = consignments.reduce((sum, consignment) => sum + 580, 0); // 580 stickers per consignment
  const availableStickers = totalStickers - usedStickers;

  // Calculate available rice from productions (287.1 Qtl per ACK)
  const totalRiceProduced = riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0);
  const usedRiceInConsignments = consignments.reduce((sum, consignment) => sum + 287.1, 0); // 287.1 Qtl per consignment
  const availableRice = totalRiceProduced - usedRiceInConsignments;

  // Get available FRK batches for selection
  const getAvailableFrkBatches = () => {
    return frkStocks.filter(stock => stock.quantity > 0).map(stock => ({
      ...stock,
      availableQty: stock.quantity
    }));
  };

  // Calculate total selected FRK quantity
  const getSelectedFrkQuantity = () => {
    return selectedFrkBatches.reduce((total, batchId) => {
      const batch = frkStocks.find(stock => stock.id === batchId);
      return total + (batch?.quantity || 0);
    }, 0);
  };

  const handleConsignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (availableRice < 287.1) {
      alert(`Insufficient rice! Required: 287.1 Qtl, Available: ${formatDecimal(availableRice)} Qtl`);
      return;
    }

    if (availableGunnies < 580) {
      alert(`Insufficient gunnies! Required: 580, Available: ${availableGunnies}`);
      return;
    }

    if (availableStickers < 580) {
      alert(`Insufficient stickers! Required: 580, Available: ${availableStickers}`);
      return;
    }

    const selectedFrkQty = getSelectedFrkQuantity();
    if (selectedFrkQty < 290) {
      alert(`Insufficient FRK selected! Required: 290 kg, Selected: ${selectedFrkQty} kg`);
      return;
    }

    // Create new consignment
    const newConsignment: FCIConsignment = {
      id: Date.now().toString(),
      ackNumber: consignmentForm.ackNumber,
      riceQuantity: 287.1, // Pure rice quantity
      frkQuantity: 290, // FRK quantity
      totalBags: 580,
      gunnyType: consignmentForm.gunnyType,
      stickersUsed: 580,
      consignmentDate: consignmentForm.consignmentDate,
      status: 'in-transit',
      lorryNumber: consignmentForm.lorryNumber,
      transporterName: consignmentForm.transporterName,
      eWayBill: consignmentForm.eWayBill,
      notes: consignmentForm.notes
    };

    // Update FRK stocks - deduct from selected batches
    let remainingFrkNeeded = 290;
    const updatedFrkStocks = frkStocks.map(stock => {
      if (selectedFrkBatches.includes(stock.id) && remainingFrkNeeded > 0) {
        const deductAmount = Math.min(stock.quantity, remainingFrkNeeded);
        remainingFrkNeeded -= deductAmount;
        return { ...stock, quantity: stock.quantity - deductAmount };
      }
      return stock;
    });

    // Update gunny stocks - deduct 580 gunnies
    let remainingGunniesNeeded = 580;
    const updatedGunnyStocks = gunnyStocks.map(stock => {
      if (stock.type === consignmentForm.gunnyType && remainingGunniesNeeded > 0) {
        const deductAmount = Math.min(stock.quantity, remainingGunniesNeeded);
        remainingGunniesNeeded -= deductAmount;
        return { ...stock, quantity: stock.quantity - deductAmount };
      }
      return stock;
    });

    // Update rexin stickers - deduct 580 stickers
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
    setConsignments([...consignments, newConsignment]);
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
      eWayBill: '',
      notes: ''
    });
    setSelectedFrkBatches([]);
    setShowAddForm(false);
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
      status: consignment.status,
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
        lorryNumber: editForm.lorryNumber,
        transporterName: editForm.transporterName,
        eWayBill: editForm.eWayBill,
        fciWeight: parseFloat(editForm.fciWeight) || undefined,
        fciMoisture: parseFloat(editForm.fciMoisture) || undefined,
        fciUnloadingHamali: editForm.fciUnloadingHamali,
        fciPassingFee: editForm.fciPassingFee,
        passingFeePaid: editForm.passingFeePaid,
        status: editForm.status,
        notes: editForm.notes
      } : consignment
    ));
    setEditingConsignment(null);
  };

  const cancelEdit = () => {
    setEditingConsignment(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FCI Consignments</h1>
            <p className="text-gray-600 mt-2">Manage fortified rice consignments to FCI</p>
            <p className="text-sm text-blue-600 mt-1">Note: 1 Consignment = 287.1 Qtl Rice + 2.9 Qtl FRK = 290 Qtl Total</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add FCI Consignment
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Available Rice"
            value={`${formatDecimal(availableRice)} Qtl`}
            subtitle={`${Math.floor(availableRice / 287.1)} ACKs possible`}
            icon={<Package className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Available FRK"
            value={`${formatNumber(availableFrkStock)} kg`}
            subtitle={`${Math.floor(availableFrkStock / 290)} ACKs possible`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Available Gunnies"
            value={formatNumber(availableGunnies)}
            subtitle={`${Math.floor(availableGunnies / 580)} ACKs possible`}
            icon={<Package className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Available Stickers"
            value={formatNumber(availableStickers)}
            subtitle={`${Math.floor(availableStickers / 580)} ACKs possible`}
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

        {/* Add Consignment Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add FCI Consignment</h3>
                <form onSubmit={handleConsignmentSubmit} className="space-y-4">
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
                        placeholder="Enter ACK Number (e.g., ACK001, 1 ACK BOILED, etc.)"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter any ACK number you generated online</p>
                    </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-Way Bill (Optional)
                      </label>
                      <input
                        type="text"
                        value={consignmentForm.eWayBill}
                        onChange={(e) => setConsignmentForm({ ...consignmentForm, eWayBill: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter e-way bill number"
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

                  {/* FRK Batch Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select FRK Batches (Required: 290 kg)
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {getAvailableFrkBatches().map((batch) => (
                        <div key={batch.id} className="flex items-center space-x-3 mb-2">
                          <input
                            type="checkbox"
                            id={`frk-${batch.id}`}
                            checked={selectedFrkBatches.includes(batch.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFrkBatches([...selectedFrkBatches, batch.id]);
                              } else {
                                setSelectedFrkBatches(selectedFrkBatches.filter(id => id !== batch.id));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`frk-${batch.id}`} className="text-sm text-gray-700 flex-1">
                            <span className="font-medium">{batch.batchNumber}</span> - 
                            <span className="text-green-600"> {batch.availableQty} kg available</span> - 
                            <span className="text-gray-500">{batch.supplier}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {getSelectedFrkQuantity()} kg / 290 kg required
                    </p>
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
                      <div className="flex justify-between">
                        <span>Stickers Required:</span>
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
                      placeholder="Optional notes about this consignment..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={
                        availableRice < 287.1 || 
                        availableGunnies < 580 || 
                        availableStickers < 580 ||
                        getSelectedFrkQuantity() < 290
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

        {/* Consignments Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
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
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="space-y-1">
                            <div>Rice: <span className="font-semibold">{formatDecimal(consignment.riceQuantity)} Qtl</span></div>
                            <div>FRK: <span className="font-semibold">{formatDecimal(consignment.frkQuantity)} kg</span></div>
                            <div>Total: <span className="font-semibold">290.0 Qtl</span></div>
                            <div>Bags: <span className="font-semibold">{consignment.totalBags}</span></div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {editingConsignment === consignment.id ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editForm.lorryNumber}
                                onChange={(e) => setEditForm({ ...editForm, lorryNumber: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="Lorry Number"
                              />
                              <input
                                type="text"
                                value={editForm.transporterName}
                                onChange={(e) => setEditForm({ ...editForm, transporterName: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="Transporter"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div>Lorry: <span className="font-medium">{consignment.lorryNumber || '-'}</span></div>
                              <div>Transporter: <span className="font-medium">{consignment.transporterName || '-'}</span></div>
                              <div>E-Way: <span className="font-medium">{consignment.eWayBill || '-'}</span></div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {editingConsignment === consignment.id ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
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
                              <div>Weight: <span className="font-medium">{consignment.fciWeight ? `${consignment.fciWeight} Qtl` : '-'}</span></div>
                              <div>Moisture: <span className="font-medium">{consignment.fciMoisture ? `${consignment.fciMoisture}%` : '-'}</span></div>
                              <div>Passing Fee: <span className="font-medium">{consignment.passingFeePaid ? '✓ Paid' : 'Pending'}</span></div>
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
        </div>
      </div>
    </div>
  );
};

export default FCIConsignments;