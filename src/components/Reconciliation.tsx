import React, { useState, useMemo } from 'react';
import { FileCheck, CheckCircle, Clock, AlertCircle, Plus, Camera, Truck, Upload, Download, Edit, Save, X, ArrowLeft } from 'lucide-react';
import { ReconciliationRecord, OldGunnyDispatch } from '../types';
import { paddyData } from '../data/paddyData';
import { oldGunnyDispatchData } from '../data/oldGunnyDispatchData';
import { formatNumber, formatDecimal } from '../utils/calculations';
import StatsCard from './StatsCard';

interface ReconciliationProps {
  onBack?: () => void;
}

const Reconciliation: React.FC<ReconciliationProps> = ({ onBack }) => {
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [oldGunnyDispatches, setOldGunnyDispatches] = useState<OldGunnyDispatch[]>(
    oldGunnyDispatchData.map(dispatch => ({
      ...dispatch,
      dispatchDate: dispatch.date,
      status: dispatch.acknowledgmentReceived ? 'acknowledged' : 'dispatched'
    }))
  );
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'gunny-dispatch'>('reconciliation');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReconcileForm, setShowReconcileForm] = useState<string | null>(null);
  const [editingDispatch, setEditingDispatch] = useState<string | null>(null);
  const [reconcileAmount, setReconcileAmount] = useState('');

  const [gunnyDispatchForm, setGunnyDispatchForm] = useState({
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

  // Generate reconciliation records from paddy data
  const centerSummary = useMemo(() => {
    return paddyData.reduce((acc, record) => {
      const key = `${record.centerName}-${record.district}`;
      if (!acc[key]) {
        acc[key] = {
          centerName: record.centerName,
          district: record.district,
          totalPaddyReceived: 0,
          totalQuintals: 0
        };
      }
      acc[key].totalPaddyReceived += record.totalBags;
      acc[key].totalQuintals += record.totalQuintals;
      return acc;
    }, {} as Record<string, any>);
  }, []);

  const centerRecords = useMemo(() => {
    return Object.values(centerSummary).map((center: any) => {
      const existing = reconciliations.find(r => 
        r.centerName === center.centerName && r.district === center.district
      );
      
      const reconciledQuintals = existing?.reconciledQuintals || 0;
      const balanceQuintals = center.totalQuintals - reconciledQuintals;
      
      return {
        id: `${center.centerName}-${center.district}`,
        centerName: center.centerName,
        district: center.district,
        totalPaddyReceived: center.totalPaddyReceived,
        totalQuintals: center.totalQuintals,
        reconciledQuintals,
        balanceQuintals,
        reconciliationStatus: existing?.reconciliationStatus || 'pending',
        reconciliationDate: existing?.reconciliationDate,
        reconciliationDocument: existing?.reconciliationDocument,
        notes: existing?.notes
      } as ReconciliationRecord;
    });
  }, [centerSummary, reconciliations]);

  // Calculate summary stats
  const totalQuintals = useMemo(() => centerRecords.reduce((sum, record) => sum + record.totalQuintals, 0), [centerRecords]);
  const totalReconciledQuintals = useMemo(() => centerRecords.reduce((sum, record) => sum + record.reconciledQuintals, 0), [centerRecords]);
  const totalBalanceQuintals = useMemo(() => centerRecords.reduce((sum, record) => sum + record.balanceQuintals, 0), [centerRecords]);
  const completedCount = useMemo(() => centerRecords.filter(r => r.reconciliationStatus === 'completed').length, [centerRecords]);
  const pendingCount = useMemo(() => centerRecords.filter(r => r.reconciliationStatus === 'pending').length, [centerRecords]);
  const inProgressCount = useMemo(() => centerRecords.filter(r => r.reconciliationStatus === 'in-progress').length, [centerRecords]);

  // Old Gunny Dispatch stats
  const totalGunniesDispatched = useMemo(() => oldGunnyDispatches.reduce((sum, dispatch) => sum + dispatch.gunniesDispatched, 0), [oldGunnyDispatches]);
  const acknowledgedGunnies = useMemo(() => oldGunnyDispatches.filter(d => d.acknowledgmentReceived).reduce((sum, dispatch) => sum + dispatch.gunniesDispatched, 0), [oldGunnyDispatches]);
  const pendingAcknowledgment = useMemo(() => oldGunnyDispatches.filter(d => !d.acknowledgmentReceived).reduce((sum, dispatch) => sum + dispatch.gunniesDispatched, 0), [oldGunnyDispatches]);
  const acknowledgedCount = useMemo(() => oldGunnyDispatches.filter(d => d.acknowledgmentReceived).length, [oldGunnyDispatches]);

  const updateReconciliationStatus = (id: string, status: ReconciliationRecord['reconciliationStatus'], notes?: string) => {
    const centerRecord = centerRecords.find(r => r.id === id);
    if (!centerRecord) return;

    const updated = reconciliations.find(r => r.id === id);
    if (updated) {
      updated.reconciliationStatus = status;
      updated.reconciliationDate = status === 'completed' ? new Date().toISOString().split('T')[0] : undefined;
      updated.notes = notes;
      setReconciliations([...reconciliations.filter(r => r.id !== id), updated]);
    } else {
      const newRecord: ReconciliationRecord = {
        id,
        centerName: centerRecord.centerName,
        district: centerRecord.district,
        totalPaddyReceived: centerRecord.totalPaddyReceived,
        totalQuintals: centerRecord.totalQuintals,
        reconciledQuintals: centerRecord.reconciledQuintals,
        balanceQuintals: centerRecord.balanceQuintals,
        reconciliationStatus: status,
        reconciliationDate: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        notes
      };
      setReconciliations([...reconciliations, newRecord]);
    }
  };

  const handleReconcileSubmit = (id: string) => {
    const amount = parseFloat(reconcileAmount);
    if (isNaN(amount) || amount <= 0) return;

    const centerRecord = centerRecords.find(r => r.id === id);
    if (!centerRecord) return;

    const maxReconcile = centerRecord.balanceQuintals;
    const actualAmount = Math.min(amount, maxReconcile);

    const existing = reconciliations.find(r => r.id === id);
    if (existing) {
      existing.reconciledQuintals += actualAmount;
      existing.balanceQuintals = centerRecord.totalQuintals - existing.reconciledQuintals;
      existing.reconciliationStatus = existing.balanceQuintals <= 0 ? 'completed' : 'in-progress';
      existing.reconciliationDate = existing.reconciliationStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined;
      setReconciliations([...reconciliations.filter(r => r.id !== id), existing]);
    } else {
      const newRecord: ReconciliationRecord = {
        id,
        centerName: centerRecord.centerName,
        district: centerRecord.district,
        totalPaddyReceived: centerRecord.totalPaddyReceived,
        totalQuintals: centerRecord.totalQuintals,
        reconciledQuintals: actualAmount,
        balanceQuintals: centerRecord.totalQuintals - actualAmount,
        reconciliationStatus: (centerRecord.totalQuintals - actualAmount) <= 0 ? 'completed' : 'in-progress'
      };
      setReconciliations([...reconciliations, newRecord]);
    }

    setReconcileAmount('');
    setShowReconcileForm(null);
  };

  const handleGunnyDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDispatch: OldGunnyDispatch = {
      id: Date.now().toString(),
      centerName: gunnyDispatchForm.centerName,
      district: gunnyDispatchForm.district,
      gunniesDispatched: parseInt(gunnyDispatchForm.gunniesDispatched),
      dispatchDate: gunnyDispatchForm.dispatchDate,
      acknowledgmentReceived: false,
      comments: gunnyDispatchForm.comments,
      status: 'dispatched'
    };
    setOldGunnyDispatches([...oldGunnyDispatches, newDispatch]);
    setGunnyDispatchForm({ centerName: '', district: '', gunniesDispatched: '', dispatchDate: '', comments: '' });
    setShowAddForm(false);
  };

  const startEdit = (dispatch: OldGunnyDispatch) => {
    setEditingDispatch(dispatch.id);
    setEditForm({
      centerName: dispatch.centerName,
      district: dispatch.district,
      gunniesDispatched: dispatch.gunniesDispatched.toString(),
      dispatchDate: dispatch.dispatchDate,
      comments: dispatch.comments || ''
    });
  };

  const saveEdit = (id: string) => {
    setOldGunnyDispatches(oldGunnyDispatches.map(dispatch => 
      dispatch.id === id ? {
        ...dispatch,
        centerName: editForm.centerName,
        district: editForm.district,
        gunniesDispatched: parseInt(editForm.gunniesDispatched),
        dispatchDate: editForm.dispatchDate,
        comments: editForm.comments
      } : dispatch
    ));
    setEditingDispatch(null);
  };

  const cancelEdit = () => {
    setEditingDispatch(null);
    setEditForm({ centerName: '', district: '', gunniesDispatched: '', dispatchDate: '', comments: '' });
  };

  const toggleAcknowledgment = (id: string) => {
    setOldGunnyDispatches(oldGunnyDispatches.map(dispatch => 
      dispatch.id === id ? { 
        ...dispatch, 
        acknowledgmentReceived: !dispatch.acknowledgmentReceived,
        acknowledgmentDate: !dispatch.acknowledgmentReceived ? new Date().toISOString().split('T')[0] : undefined,
        status: !dispatch.acknowledgmentReceived ? 'acknowledged' : 'dispatched'
      } : dispatch
    ));
  };

  const handlePhotoUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOldGunnyDispatches(oldGunnyDispatches.map(dispatch => 
          dispatch.id === id ? { ...dispatch, acknowledgmentPhoto: e.target?.result as string } : dispatch
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReconciliationDocumentUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const existing = reconciliations.find(r => r.id === id);
        const centerRecord = centerRecords.find(r => r.id === id);
        if (!centerRecord) return;

        if (existing) {
          existing.reconciliationDocument = e.target?.result as string;
          setReconciliations([...reconciliations.filter(r => r.id !== id), existing]);
        } else {
          const newRecord: ReconciliationRecord = {
            id,
            centerName: centerRecord.centerName,
            district: centerRecord.district,
            totalPaddyReceived: centerRecord.totalPaddyReceived,
            totalQuintals: centerRecord.totalQuintals,
            reconciledQuintals: centerRecord.reconciledQuintals,
            balanceQuintals: centerRecord.balanceQuintals,
            reconciliationStatus: centerRecord.reconciliationStatus,
            reconciliationDate: centerRecord.reconciliationDate,
            reconciliationDocument: e.target?.result as string
          };
          setReconciliations([...reconciliations, newRecord]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportGunnyDispatchData = () => {
    const csvContent = [
      ['S.No', 'Date', 'Center Name', 'District', 'Gunnies Dispatched', 'Acknowledgment Status', 'Acknowledgment Date', 'Comments'],
      ...oldGunnyDispatches.map((dispatch, index) => [
        index + 1,
        dispatch.dispatchDate,
        dispatch.centerName,
        dispatch.district,
        dispatch.gunniesDispatched,
        dispatch.acknowledgmentReceived ? 'Received' : 'Pending',
        dispatch.acknowledgmentDate || '',
        dispatch.comments || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'old-gunny-dispatch-records.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'acknowledged': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': 
      case 'dispatched': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: 
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'acknowledged': 
        return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': 
      case 'dispatched': 
        return <Clock className="h-4 w-4" />;
      default: 
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const uniqueCenters = Array.from(new Set(Object.values(centerSummary).map((center: any) => center.centerName))).sort();
  const uniqueDistricts = Array.from(new Set(Object.values(centerSummary).map((center: any) => center.district))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reconciliation & Old Gunny Management</h1>
              <p className="text-gray-600 mt-2">Track reconciliation status and old gunny dispatches to centers</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'gunny-dispatch' && (
              <>
                <button
                  onClick={exportGunnyDispatchData}
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
                  Add Gunny Dispatch
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {activeTab === 'reconciliation' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Quintals"
              value={formatDecimal(totalQuintals)}
              subtitle="Total paddy received"
              icon={<FileCheck className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Reconciled"
              value={formatDecimal(totalReconciledQuintals)}
              subtitle={`${Math.round((totalReconciledQuintals / totalQuintals) * 100)}% complete`}
              icon={<CheckCircle className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Balance"
              value={formatDecimal(totalBalanceQuintals)}
              subtitle="Pending reconciliation"
              icon={<Clock className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Centers"
              value={`${completedCount}/${centerRecords.length}`}
              subtitle={`${pendingCount} pending, ${inProgressCount} in progress`}
              icon={<AlertCircle className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Dispatched"
              value={formatNumber(totalGunniesDispatched)}
              subtitle="Old gunnies sent to centers"
              icon={<Truck className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Acknowledged"
              value={formatNumber(acknowledgedGunnies)}
              subtitle={`${acknowledgedCount} centers confirmed`}
              icon={<CheckCircle className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Pending Ack"
              value={formatNumber(pendingAcknowledgment)}
              subtitle={`${oldGunnyDispatches.length - acknowledgedCount} centers pending`}
              icon={<Clock className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Completion Rate"
              value={`${Math.round((acknowledgedCount / oldGunnyDispatches.length) * 100)}%`}
              subtitle={`${acknowledgedCount}/${oldGunnyDispatches.length} centers`}
              icon={<FileCheck className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'reconciliation', label: 'Center Reconciliation', icon: FileCheck },
                { id: 'gunny-dispatch', label: 'Old Gunny Dispatch', icon: Truck }
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
            {activeTab === 'reconciliation' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Reconciliation Status</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quintals</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reconciled</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {centerRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-xs">
                            <div className="truncate">{record.centerName}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {record.district}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatDecimal(record.totalQuintals)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {formatDecimal(record.reconciledQuintals)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimal(record.balanceQuintals)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.reconciliationStatus)}`}>
                              {getStatusIcon(record.reconciliationStatus)}
                              <span className="ml-1 capitalize">{record.reconciliationStatus.replace('-', ' ')}</span>
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {record.reconciliationDocument ? (
                              <img 
                                src={record.reconciliationDocument} 
                                alt="Reconciliation Document" 
                                className="h-10 w-10 rounded-lg object-cover cursor-pointer"
                                onClick={() => window.open(record.reconciliationDocument, '_blank')}
                              />
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => handleReconciliationDocumentUpload(record.id, e)}
                                />
                              </label>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {record.balanceQuintals > 0 && (
                                <button
                                  onClick={() => setShowReconcileForm(record.id)}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Reconcile
                                </button>
                              )}
                              {record.reconciliationStatus === 'completed' && (
                                <button
                                  onClick={() => updateReconciliationStatus(record.id, 'pending')}
                                  className="text-gray-600 hover:text-gray-800 font-medium"
                                >
                                  Reset
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

            {activeTab === 'gunny-dispatch' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Old Gunny Dispatch Records</h3>
                  <div className="text-sm text-gray-600">
                    Total: {formatNumber(totalGunniesDispatched)} gunnies | 
                    Acknowledged: {formatNumber(acknowledgedGunnies)} | 
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
                      {oldGunnyDispatches.map((dispatch, index) => (
                        <tr key={dispatch.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingDispatch === dispatch.id ? (
                              <input
                                type="date"
                                value={editForm.dispatchDate}
                                onChange={(e) => setEditForm({ ...editForm, dispatchDate: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              new Date(dispatch.dispatchDate).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-xs">
                            {editingDispatch === dispatch.id ? (
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
                              <div className="truncate">{dispatch.centerName}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingDispatch === dispatch.id ? (
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
                                {dispatch.district}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {editingDispatch === dispatch.id ? (
                              <input
                                type="number"
                                value={editForm.gunniesDispatched}
                                onChange={(e) => setEditForm({ ...editForm, gunniesDispatched: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              formatNumber(dispatch.gunniesDispatched)
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={dispatch.acknowledgmentReceived}
                                  onChange={() => toggleAcknowledgment(dispatch.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {dispatch.acknowledgmentReceived ? 'Received' : 'Pending'}
                                </span>
                              </label>
                            </div>
                            {dispatch.acknowledgmentDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(dispatch.acknowledgmentDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {dispatch.acknowledgmentPhoto ? (
                              <img 
                                src={dispatch.acknowledgmentPhoto} 
                                alt="Acknowledgment" 
                                className="h-10 w-10 rounded-lg object-cover cursor-pointer"
                                onClick={() => window.open(dispatch.acknowledgmentPhoto, '_blank')}
                              />
                            ) : (
                              <label className="cursor-pointer">
                                <Upload className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(dispatch.id, e)}
                                />
                              </label>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                            {editingDispatch === dispatch.id ? (
                              <textarea
                                value={editForm.comments}
                                onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                            ) : (
                              <div className="truncate" title={dispatch.comments}>
                                {dispatch.comments || '-'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {editingDispatch === dispatch.id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(dispatch.id)}
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
                                  onClick={() => startEdit(dispatch)}
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

        {/* Reconcile Form */}
        {showReconcileForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reconcile Quintals</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quintals to Reconcile
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={reconcileAmount}
                      onChange={(e) => setReconcileAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter quintals amount"
                      required
                    />
                    {showReconcileForm && (
                      <p className="text-xs text-gray-500 mt-1">
                        Max available: {formatDecimal(centerRecords.find(r => r.id === showReconcileForm)?.balanceQuintals || 0)} Qtl
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => handleReconcileSubmit(showReconcileForm)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      Reconcile
                    </button>
                    <button
                      onClick={() => setShowReconcileForm(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Gunny Dispatch Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Old Gunny Dispatch</h3>
                <form onSubmit={handleGunnyDispatchSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Center Name
                    </label>
                    <select
                      value={gunnyDispatchForm.centerName}
                      onChange={(e) => setGunnyDispatchForm({ ...gunnyDispatchForm, centerName: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District
                    </label>
                    <select
                      value={gunnyDispatchForm.district}
                      onChange={(e) => setGunnyDispatchForm({ ...gunnyDispatchForm, district: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gunnies Dispatched
                    </label>
                    <input
                      type="number"
                      value={gunnyDispatchForm.gunniesDispatched}
                      onChange={(e) => setGunnyDispatchForm({ ...gunnyDispatchForm, gunniesDispatched: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dispatch Date
                    </label>
                    <input
                      type="date"
                      value={gunnyDispatchForm.dispatchDate}
                      onChange={(e) => setGunnyDispatchForm({ ...gunnyDispatchForm, dispatchDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments/Tags
                    </label>
                    <textarea
                      value={gunnyDispatchForm.comments}
                      onChange={(e) => setGunnyDispatchForm({ ...gunnyDispatchForm, comments: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add comments, tags, or notes about this dispatch..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Dispatch
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

export default Reconciliation;