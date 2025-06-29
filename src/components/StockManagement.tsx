import React, { useState, useMemo } from 'react';
import { Plus, Archive, Camera, CheckCircle, Truck, Package, Upload, Download, Edit, Save, X } from 'lucide-react';
import { GunnyStock, FRKStock, RexinSticker, OldGunnyDispatch } from '../types';
import { paddyData } from '../data/paddyData';
import { oldGunnyDispatchData } from '../data/oldGunnyDispatchData';
import { formatNumber, formatDecimal } from '../utils/calculations';
import StatsCard from './StatsCard';

const StockManagement: React.FC = () => {
  const [gunnyStock, setGunnyStock] = useState<GunnyStock[]>([]);
  const [frkStock, setFRKStock] = useState<FRKStock[]>([]);
  const [stickerStock, setStickerStock] = useState<RexinSticker[]>([]);
  const [oldGunnyReturns, setOldGunnyReturns] = useState<OldGunnyDispatch[]>(
    oldGunnyDispatchData.map(dispatch => ({
      ...dispatch,
      dispatchDate: dispatch.date,
      status: dispatch.acknowledgmentReceived ? 'acknowledged' : 'dispatched'
    }))
  );
  const [activeTab, setActiveTab] = useState<'gunnies' | 'frk' | 'stickers' | 'old-gunny-returns'>('gunnies');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReturn, setEditingReturn] = useState<string | null>(null);

  const [gunnyForm, setGunnyForm] = useState({
    type: '2024-25-new' as '2024-25-new' | '2023-24-leftover',
    quantity: '',
    source: 'new-bales' as 'new-bales' | 'received-with-paddy',
    dateReceived: '',
    notes: ''
  });

  const [frkForm, setFRKForm] = useState({
    quantity: '',
    supplier: '',
    bags: '',
    batchNumber: '',
    certificateNumber: '',
    premixCertificateNumber: '',
    dateReceived: '',
    expiryDate: '',
    notes: ''
  });

  const [stickerForm, setStickerForm] = useState({
    quantity: '',
    dateReceived: ''
  });

  const [oldGunnyForm, setOldGunnyForm] = useState({
    centerName: '',
    district: '',
    gunniesDispatched: '',
    dispatchDate: '',
    comments: ''
  });

  const [editForm, setEditForm] = useState({
    centerName: '',
    district: '',
    gunniesDispatched: '',
    dispatchDate: '',
    comments: ''
  });

  // Calculate gunnies from paddy data
  const paddyGunnies = useMemo(() => {
    const newGunnies = paddyData.reduce((sum, record) => sum + record.newBags, 0);
    const oldGunnies = paddyData.reduce((sum, record) => sum + record.oldBags, 0);
    return { newGunnies, oldGunnies };
  }, []);

  // Calculate old gunny return stats
  const totalOldGunniesDispatched = useMemo(() => oldGunnyReturns.reduce((sum, ret) => sum + ret.gunniesDispatched, 0), [oldGunnyReturns]);
  const acknowledgedOldGunnies = useMemo(() => oldGunnyReturns.filter(r => r.acknowledgmentReceived).reduce((sum, ret) => sum + ret.gunniesDispatched, 0), [oldGunnyReturns]);
  const pendingAcknowledgment = useMemo(() => oldGunnyReturns.filter(r => !r.acknowledgmentReceived).reduce((sum, ret) => sum + ret.gunniesDispatched, 0), [oldGunnyReturns]);

  const handleGunnySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStock: GunnyStock = {
      id: Date.now().toString(),
      type: gunnyForm.type,
      quantity: parseInt(gunnyForm.quantity),
      source: gunnyForm.source,
      dateReceived: gunnyForm.dateReceived,
      notes: gunnyForm.notes
    };
    setGunnyStock([...gunnyStock, newStock]);
    setGunnyForm({ type: '2024-25-new', quantity: '', source: 'new-bales', dateReceived: '', notes: '' });
    setShowAddForm(false);
  };

  const handleFRKSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStock: FRKStock = {
      id: Date.now().toString(),
      quantity: parseFloat(frkForm.quantity),
      supplier: frkForm.supplier,
      bags: parseInt(frkForm.bags),
      batchNumber: frkForm.batchNumber,
      certificateNumber: frkForm.certificateNumber,
      premixCertificateNumber: frkForm.premixCertificateNumber,
      dateReceived: frkForm.dateReceived,
      expiryDate: frkForm.expiryDate,
      notes: frkForm.notes
    };
    setFRKStock([...frkStock, newStock]);
    setFRKForm({ quantity: '', supplier: '', bags: '', batchNumber: '', certificateNumber: '', premixCertificateNumber: '', dateReceived: '', expiryDate: '', notes: '' });
    setShowAddForm(false);
  };

  const handleStickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(stickerForm.quantity);
    const newSticker: RexinSticker = {
      id: Date.now().toString(),
      quantity,
      dateReceived: stickerForm.dateReceived,
      usedQuantity: 0,
      remainingQuantity: quantity
    };
    setStickerStock([...stickerStock, newSticker]);
    setStickerForm({ quantity: '', dateReceived: '' });
    setShowAddForm(false);
  };

  const handleOldGunnySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReturn: OldGunnyDispatch = {
      id: Date.now().toString(),
      centerName: oldGunnyForm.centerName,
      district: oldGunnyForm.district,
      gunniesDispatched: parseInt(oldGunnyForm.gunniesDispatched),
      dispatchDate: oldGunnyForm.dispatchDate,
      acknowledgmentReceived: false,
      comments: oldGunnyForm.comments,
      status: 'dispatched'
    };
    setOldGunnyReturns([...oldGunnyReturns, newReturn]);
    setOldGunnyForm({ centerName: '', district: '', gunniesDispatched: '', dispatchDate: '', comments: '' });
    setShowAddForm(false);
  };

  const handleFRKCertificateUpload = (id: string, type: 'frk' | 'premix', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFRKStock(frkStock.map(stock => 
          stock.id === id ? { 
            ...stock, 
            [type === 'frk' ? 'frkTestCertificate' : 'premixTestCertificate']: e.target?.result as string 
          } : stock
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOldGunnyPhotoUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOldGunnyReturns(oldGunnyReturns.map(ret => 
          ret.id === id ? { ...ret, acknowledgmentPhoto: e.target?.result as string } : ret
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleOldGunnyAcknowledgment = (id: string) => {
    setOldGunnyReturns(oldGunnyReturns.map(ret => 
      ret.id === id ? { 
        ...ret, 
        acknowledgmentReceived: !ret.acknowledgmentReceived,
        acknowledgmentDate: !ret.acknowledgmentReceived ? new Date().toISOString().split('T')[0] : undefined,
        status: !ret.acknowledgmentReceived ? 'acknowledged' : 'dispatched'
      } : ret
    ));
  };

  const startEdit = (returnRecord: OldGunnyDispatch) => {
    setEditingReturn(returnRecord.id);
    setEditForm({
      centerName: returnRecord.centerName,
      district: returnRecord.district,
      gunniesDispatched: returnRecord.gunniesDispatched.toString(),
      dispatchDate: returnRecord.dispatchDate,
      comments: returnRecord.comments || ''
    });
  };

  const saveEdit = (id: string) => {
    setOldGunnyReturns(oldGunnyReturns.map(ret => 
      ret.id === id ? {
        ...ret,
        centerName: editForm.centerName,
        district: editForm.district,
        gunniesDispatched: parseInt(editForm.gunniesDispatched),
        dispatchDate: editForm.dispatchDate,
        comments: editForm.comments
      } : ret
    ));
    setEditingReturn(null);
  };

  const cancelEdit = () => {
    setEditingReturn(null);
    setEditForm({ centerName: '', district: '', gunniesDispatched: '', dispatchDate: '', comments: '' });
  };

  const exportOldGunnyData = () => {
    const csvContent = [
      ['S.No', 'Date', 'Center Name', 'District', 'Gunnies Dispatched', 'Acknowledgment Status', 'Acknowledgment Date', 'Comments'],
      ...oldGunnyReturns.map((ret, index) => [
        index + 1,
        ret.dispatchDate,
        ret.centerName,
        ret.district,
        ret.gunniesDispatched,
        ret.acknowledgmentReceived ? 'Received' : 'Pending',
        ret.acknowledgmentDate || '',
        ret.comments || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'old-gunny-returns-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate totals
  const additionalNewGunnies = gunnyStock.filter(s => s.type === '2024-25-new').reduce((sum, stock) => sum + stock.quantity, 0);
  const additionalLeftoverGunnies = gunnyStock.filter(s => s.type === '2023-24-leftover').reduce((sum, stock) => sum + stock.quantity, 0);
  
  const totalNewGunnies = paddyGunnies.newGunnies + additionalNewGunnies;
  const totalLeftoverGunnies = additionalLeftoverGunnies;
  const totalOldGunnies = paddyGunnies.oldGunnies;
  
  // FRK stock starts at 0 - only manual entries count
  const totalFRK = frkStock.reduce((sum, stock) => sum + stock.quantity, 0);
  
  const totalStickers = stickerStock.reduce((sum, stock) => sum + stock.quantity, 0);
  const usedStickers = stickerStock.reduce((sum, stock) => sum + stock.usedQuantity, 0);
  const remainingStickers = totalStickers - usedStickers;

  // Get unique centers and districts for forms
  const uniqueCenters = Array.from(new Set(paddyData.map(record => record.centerName))).sort();
  const uniqueDistricts = Array.from(new Set(paddyData.map(record => record.district))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-2">Manage gunnies, FRK, rexin stickers and old gunny returns</p>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'old-gunny-returns' && (
              <button
                onClick={exportOldGunnyData}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="New Gunnies"
            value={formatNumber(totalNewGunnies)}
            subtitle={`From paddy: ${formatNumber(paddyGunnies.newGunnies)}`}
            icon={<Archive className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Old Gunnies"
            value={formatNumber(totalOldGunnies)}
            subtitle="To be returned to centers"
            icon={<Archive className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="FRK Stock"
            value={`${formatDecimal(totalFRK)} Kg`}
            subtitle="Manual entries only"
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Rexin Stickers"
            value={formatNumber(remainingStickers)}
            subtitle={`Used: ${formatNumber(usedStickers)}`}
            icon={<CheckCircle className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Old Gunny Returns"
            value={`${formatNumber(acknowledgedOldGunnies)}/${formatNumber(totalOldGunniesDispatched)}`}
            subtitle={`${formatNumber(pendingAcknowledgment)} pending ack`}
            icon={<Truck className="h-6 w-6" />}
            color="from-indigo-500 to-indigo-600"
          />
        </div>

        {/* Gunny Summary from Paddy Data */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gunnies from Paddy Procurement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-900">New Gunnies</h4>
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">{formatNumber(paddyGunnies.newGunnies)}</p>
                <p className="text-sm text-green-600">Received with paddy - for CMR deliveries</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-orange-900">Old Gunnies</h4>
                  <Archive className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-900 mt-2">{formatNumber(paddyGunnies.oldGunnies)}</p>
                <p className="text-sm text-orange-600">To be returned to centers</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-900">Leftover Gunnies</h4>
                  <Archive className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">{formatNumber(totalLeftoverGunnies)}</p>
                <p className="text-sm text-blue-600">2023-24 stock</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: 'gunnies', label: 'Additional Gunnies', icon: Archive },
                { id: 'frk', label: 'FRK Stock', icon: Package },
                { id: 'stickers', label: 'Rexin Stickers', icon: CheckCircle },
                { id: 'old-gunny-returns', label: 'Old Gunny Returns', icon: Truck }
              ].map((tab) => {
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
            {activeTab === 'gunnies' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Gunny Stock</h3>
                {gunnyStock.length === 0 ? (
                  <div className="text-center py-8">
                    <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No additional gunny stock records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {gunnyStock.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stock.type === '2024-25-new' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {stock.type === '2024-25-new' ? '2024-25 New' : '2023-24 Leftover'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatNumber(stock.quantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                              {stock.source.replace('-', ' ')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(stock.dateReceived).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {stock.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'frk' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FRK Stock</h3>
                {frkStock.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FRK stock records yet. Add your first FRK stock entry.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (Kg)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premix Cert. No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificates</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {frkStock.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {stock.supplier}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(stock.quantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatNumber(stock.bags)} bags
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {stock.batchNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {stock.certificateNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {stock.premixCertificateNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(stock.dateReceived).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {stock.expiryDate ? new Date(stock.expiryDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {/* FRK Test Certificate */}
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">FRK Test</span>
                                  {stock.frkTestCertificate ? (
                                    <img 
                                      src={stock.frkTestCertificate} 
                                      alt="FRK Test Certificate" 
                                      className="h-8 w-8 rounded object-cover cursor-pointer"
                                      onClick={() => window.open(stock.frkTestCertificate, '_blank')}
                                    />
                                  ) : (
                                    <label className="cursor-pointer">
                                      <Upload className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFRKCertificateUpload(stock.id, 'frk', e)}
                                      />
                                    </label>
                                  )}
                                </div>
                                
                                {/* Premix Test Certificate */}
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Premix Test</span>
                                  {stock.premixTestCertificate ? (
                                    <img 
                                      src={stock.premixTestCertificate} 
                                      alt="Premix Test Certificate" 
                                      className="h-8 w-8 rounded object-cover cursor-pointer"
                                      onClick={() => window.open(stock.premixTestCertificate, '_blank')}
                                    />
                                  ) : (
                                    <label className="cursor-pointer">
                                      <Upload className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFRKCertificateUpload(stock.id, 'premix', e)}
                                      />
                                    </label>
                                  )}
                                </div>
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

            {activeTab === 'stickers' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rexin Stickers</h3>
                {stickerStock.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sticker stock records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stickerStock.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatNumber(stock.quantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                              {formatNumber(stock.usedQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatNumber(stock.remainingQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(stock.dateReceived).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'old-gunny-returns' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Old Gunny Returns to Centers</h3>
                  <div className="text-sm text-gray-600">
                    Total: {formatNumber(totalOldGunniesDispatched)} | 
                    Acknowledged: {formatNumber(acknowledgedOldGunnies)} | 
                    Pending: {formatNumber(pendingAcknowledgment)}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gunnies Sent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acknowledgment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo/Document</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {oldGunnyReturns.map((returnRecord, index) => (
                        <tr key={returnRecord.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingReturn === returnRecord.id ? (
                              <input
                                type="date"
                                value={editForm.dispatchDate}
                                onChange={(e) => setEditForm({ ...editForm, dispatchDate: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              new Date(returnRecord.dispatchDate).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-xs">
                            {editingReturn === returnRecord.id ? (
                              <select
                                value={editForm.centerName}
                                onChange={(e) => setEditForm({ ...editForm, centerName: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                {uniqueCenters.map(center => (
                                  <option key={center} value={center}>{center}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="truncate">{returnRecord.centerName}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingReturn === returnRecord.id ? (
                              <select
                                value={editForm.district}
                                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                {uniqueDistricts.map(district => (
                                  <option key={district} value={district}>{district}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {returnRecord.district}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {editingReturn === returnRecord.id ? (
                              <input
                                type="number"
                                value={editForm.gunniesDispatched}
                                onChange={(e) => setEditForm({ ...editForm, gunniesDispatched: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              formatNumber(returnRecord.gunniesDispatched)
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={returnRecord.acknowledgmentReceived}
                                  onChange={() => toggleOldGunnyAcknowledgment(returnRecord.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {returnRecord.acknowledgmentReceived ? 'Received' : 'Pending'}
                                </span>
                              </label>
                            </div>
                            {returnRecord.acknowledgmentDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(returnRecord.acknowledgmentDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {returnRecord.acknowledgmentPhoto ? (
                              <img 
                                src={returnRecord.acknowledgmentPhoto} 
                                alt="Acknowledgment" 
                                className="h-10 w-10 rounded-lg object-cover cursor-pointer"
                                onClick={() => window.open(returnRecord.acknowledgmentPhoto, '_blank')}
                              />
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => handleOldGunnyPhotoUpload(returnRecord.id, e)}
                                />
                              </label>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                            {editingReturn === returnRecord.id ? (
                              <textarea
                                value={editForm.comments}
                                onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                            ) : (
                              <div className="truncate" title={returnRecord.comments}>
                                {returnRecord.comments || '-'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {editingReturn === returnRecord.id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(returnRecord.id)}
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
                                  onClick={() => startEdit(returnRecord)}
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
              </div>
            )}
          </div>
        </div>

        {/* Add Stock Forms */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add {activeTab === 'gunnies' ? 'Gunny' : activeTab === 'frk' ? 'FRK' : activeTab === 'stickers' ? 'Sticker' : 'Old Gunny Return'} Stock
                </h3>
                
                {activeTab === 'gunnies' && (
                  <form onSubmit={handleGunnySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={gunnyForm.type}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="2024-25-new">2024-25 New Gunnies</option>
                        <option value="2023-24-leftover">2023-24 Leftover Gunnies</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={gunnyForm.quantity}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <select
                        value={gunnyForm.source}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, source: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="new-bales">New Bales (500 Pcs)</option>
                        <option value="received-with-paddy">Received with Paddy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={gunnyForm.dateReceived}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, dateReceived: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={gunnyForm.notes}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Stock
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'frk' && (
                  <form onSubmit={handleFRKSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <input
                        type="text"
                        value={frkForm.supplier}
                        onChange={(e) => setFRKForm({ ...frkForm, supplier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={frkForm.quantity}
                        onChange={(e) => setFRKForm({ ...frkForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bags (20 Kg each)</label>
                      <input
                        type="number"
                        value={frkForm.bags}
                        onChange={(e) => setFRKForm({ ...frkForm, bags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                      <input
                        type="text"
                        value={frkForm.batchNumber}
                        onChange={(e) => setFRKForm({ ...frkForm, batchNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                      <input
                        type="text"
                        value={frkForm.certificateNumber}
                        onChange={(e) => setFRKForm({ ...frkForm, certificateNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Premix Certificate Number</label>
                      <input
                        type="text"
                        value={frkForm.premixCertificateNumber}
                        onChange={(e) => setFRKForm({ ...frkForm, premixCertificateNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={frkForm.dateReceived}
                        onChange={(e) => setFRKForm({ ...frkForm, dateReceived: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={frkForm.expiryDate}
                        onChange={(e) => setFRKForm({ ...frkForm, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={frkForm.notes}
                        onChange={(e) => setFRKForm({ ...frkForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Stock
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'stickers' && (
                  <form onSubmit={handleStickerSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={stickerForm.quantity}
                        onChange={(e) => setStickerForm({ ...stickerForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={stickerForm.dateReceived}
                        onChange={(e) => setStickerForm({ ...stickerForm, dateReceived: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Stock
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'old-gunny-returns' && (
                  <form onSubmit={handleOldGunnySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
                      <select
                        value={oldGunnyForm.centerName}
                        onChange={(e) => setOldGunnyForm({ ...oldGunnyForm, centerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Center</option>
                        {uniqueCenters.map(center => (
                          <option key={center} value={center}>{center}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <select
                        value={oldGunnyForm.district}
                        onChange={(e) => setOldGunnyForm({ ...oldGunnyForm, district: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select District</option>
                        {uniqueDistricts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gunnies Dispatched</label>
                      <input
                        type="number"
                        value={oldGunnyForm.gunniesDispatched}
                        onChange={(e) => setOldGunnyForm({ ...oldGunnyForm, gunniesDispatched: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Date</label>
                      <input
                        type="date"
                        value={oldGunnyForm.dispatchDate}
                        onChange={(e) => setOldGunnyForm({ ...oldGunnyForm, dispatchDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comments/Tags</label>
                      <textarea
                        value={oldGunnyForm.comments}
                        onChange={(e) => setOldGunnyForm({ ...oldGunnyForm, comments: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Add comments, tags, or notes about this dispatch..."
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Return
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

export default StockManagement;