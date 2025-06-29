import React, { useState, useMemo } from 'react';
import { Plus, Users, Calendar, CreditCard, Clock, TrendingUp, Download, Edit, Save, X } from 'lucide-react';
import { HamaliWork, HamaliPayment, SupervisorSalary } from '../types';
import { formatCurrency, formatDecimal } from '../utils/calculations';
import StatsCard from './StatsCard';

const HamaliManagement: React.FC = () => {
  const [hamaliWork, setHamaliWork] = useState<HamaliWork[]>([]);
  const [hamaliPayments, setHamaliPayments] = useState<HamaliPayment[]>([]);
  const [supervisorSalaries, setSupervisorSalaries] = useState<SupervisorSalary[]>([]);
  const [activeTab, setActiveTab] = useState<'work' | 'payments' | 'supervisors'>('work');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWork, setEditingWork] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [workForm, setWorkForm] = useState({
    workType: '',
    workDescription: '',
    quantity: '',
    unit: 'bags' as HamaliWork['unit'],
    ratePerUnit: '',
    workDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: '',
    paymentMethod: 'cash' as HamaliPayment['paymentMethod'],
    workPeriod: '',
    notes: ''
  });

  const [supervisorForm, setSupervisorForm] = useState({
    supervisorName: '',
    designation: '',
    monthlySalary: '',
    month: '',
    paidAmount: '',
    paymentDate: '',
    notes: ''
  });

  const [editWorkForm, setEditWorkForm] = useState({
    workType: '',
    workDescription: '',
    quantity: '',
    unit: 'bags' as HamaliWork['unit'],
    ratePerUnit: '',
    workDate: '',
    notes: ''
  });

  // Predefined work types with rates (from the image)
  const workTypes = [
    { type: 'PADDY UNLOADING TO NET / NET TO LOADING', rate: 4.00, unit: 'bags' },
    { type: 'PADDY DIRECT BATTI', rate: 3.50, unit: 'bags' },
    { type: 'PADDY NET TO BATTI', rate: 3.50, unit: 'bags' },
    { type: 'PADDY LOOSE FILLING TO PC', rate: 2.00, unit: 'bags' },
    { type: 'PADDY LOADING WITH VEHICLE TO PC', rate: 5.00, unit: 'bags' },
    { type: 'PADDY NET TO PALTI & LORRY LOADING', rate: 5.50, unit: 'bags' },
    { type: 'PADDY LORRY LOADING MAMUL OTHER STATES', rate: 30.00, unit: 'ton' },
    { type: 'FCI RICE LOADING+KANTA+CHAPA+STITCHING+STENCIL', rate: 6.00, unit: 'bags' },
    { type: 'RICE 26KG KANTA+STITCHING TO NET/LOADING', rate: 2.50, unit: 'bags' },
    { type: 'RICE 26KGS NET TO LOADING', rate: 1.60, unit: 'bags' },
    { type: 'RICE NET TO LOADING/UNLOADING', rate: 2.00, unit: 'bags' },
    { type: 'RICE UNLOADING & PALTI/NET', rate: 2.30, unit: 'bags' },
    { type: 'FCI RICE LORRY THADU BATHA', rate: 400.00, unit: 'ack' },
    { type: 'BRAN FILLING & LOADING', rate: 100.00, unit: 'ton' },
    { type: 'BRAN LOADING MAMUL', rate: 30.00, unit: 'ton' },
    { type: 'BROKEN RICE FILLING & NET/LOADING', rate: 4.00, unit: 'bags' },
    { type: 'BROKEN RICE FILLING, KANTA & NET/LOADING', rate: 5.00, unit: 'bags' },
    { type: 'BROKEN RICE LOADING MAMUL', rate: 30.00, unit: 'ton' },
    { type: 'BROKEN RICE NET TO LOADING', rate: 2.00, unit: 'bags' },
    { type: 'PARAM FILLING & NET/LOADING', rate: 80.00, unit: 'ton' },
    { type: 'PARAM LOADING MAMUL', rate: 30.00, unit: 'ton' },
    { type: 'PARAM NET TO LOADING', rate: 2.00, unit: 'bags' },
    { type: 'FRK LORRY UNLOADING', rate: 1.60, unit: 'bags' },
    { type: 'FRK BLENDER LOADING', rate: 1.00, unit: 'bags' },
    { type: 'NEW GUNNIES BALES UNLOADING', rate: 25.00, unit: 'bale' },
    { type: 'GUNNIES BUNDELING AND NET', rate: 2.00, unit: 'bags' },
    { type: 'PADDY/RICE/BROKENRICE/ NET TO PALTI', rate: 1.50, unit: 'bags' },
    { type: 'HOPPER LOADING (BROKEN, REJECTION, RICE)', rate: 3.00, unit: 'bags' }
  ];

  // Filter work entries by selected date
  const filteredWorkByDate = useMemo(() => 
    hamaliWork.filter(work => work.workDate === selectedDate),
    [hamaliWork, selectedDate]
  );

  // Calculate daily totals for selected date
  const dailyTotals = useMemo(() => {
    const totalAmount = filteredWorkByDate.reduce((sum, work) => sum + work.totalAmount, 0);
    const totalBags = filteredWorkByDate
      .filter(work => work.unit === 'bags')
      .reduce((sum, work) => sum + work.quantity, 0);
    
    return { totalAmount, totalBags };
  }, [filteredWorkByDate]);

  // Calculate summary stats
  const totalPendingWork = useMemo(() => 
    hamaliWork.filter(work => work.paymentStatus === 'pending').reduce((sum, work) => sum + work.totalAmount, 0), 
    [hamaliWork]
  );
  
  const totalPaidWork = useMemo(() => 
    hamaliWork.filter(work => work.paymentStatus === 'paid').reduce((sum, work) => sum + work.totalAmount, 0), 
    [hamaliWork]
  );
  
  const totalPaymentsMade = useMemo(() => 
    hamaliPayments.reduce((sum, payment) => sum + payment.amount, 0), 
    [hamaliPayments]
  );

  const totalSupervisorSalaries = useMemo(() => 
    supervisorSalaries.reduce((sum, salary) => sum + salary.monthlySalary, 0), 
    [supervisorSalaries]
  );

  const pendingSupervisorPayments = useMemo(() => 
    supervisorSalaries.filter(salary => salary.paymentStatus === 'pending').reduce((sum, salary) => sum + salary.monthlySalary, 0), 
    [supervisorSalaries]
  );

  // Get unique dates from work entries for the date selector
  const workDates = useMemo(() => {
    const dates = Array.from(new Set(hamaliWork.map(work => work.workDate)));
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [hamaliWork]);

  const handleWorkTypeChange = (selectedType: string) => {
    const workType = workTypes.find(wt => wt.type === selectedType);
    if (workType) {
      setWorkForm({
        ...workForm,
        workType: selectedType,
        ratePerUnit: workType.rate.toString(),
        unit: workType.unit as HamaliWork['unit']
      });
    } else {
      setWorkForm({
        ...workForm,
        workType: selectedType
      });
    }
  };

  const handleWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(workForm.quantity);
    const rate = parseFloat(workForm.ratePerUnit);
    
    const newWork: HamaliWork = {
      id: Date.now().toString(),
      workType: workForm.workType,
      workDescription: workForm.workDescription,
      quantity,
      unit: workForm.unit,
      ratePerUnit: rate,
      totalAmount: quantity * rate,
      workDate: workForm.workDate,
      paymentStatus: 'pending',
      notes: workForm.notes
    };

    setHamaliWork([...hamaliWork, newWork]);
    setWorkForm({ 
      ...workForm, 
      workType: '', 
      workDescription: '', 
      quantity: '', 
      ratePerUnit: '', 
      notes: '' 
    });
    setShowAddForm(false);
    setSelectedDate(workForm.workDate);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: HamaliPayment = {
      id: Date.now().toString(),
      amount: parseFloat(paymentForm.amount),
      paymentDate: paymentForm.paymentDate,
      paymentMethod: paymentForm.paymentMethod,
      workPeriod: paymentForm.workPeriod,
      notes: paymentForm.notes
    };

    setHamaliPayments([...hamaliPayments, newPayment]);
    
    // Mark corresponding work as paid (simplified - in real app, you'd select specific work items)
    const paymentAmount = parseFloat(paymentForm.amount);
    let remainingAmount = paymentAmount;
    
    const updatedWork = hamaliWork.map(work => {
      if (work.paymentStatus === 'pending' && remainingAmount > 0) {
        if (remainingAmount >= work.totalAmount) {
          remainingAmount -= work.totalAmount;
          return { ...work, paymentStatus: 'paid' as const };
        }
      }
      return work;
    });
    
    setHamaliWork(updatedWork);
    setPaymentForm({ amount: '', paymentDate: '', paymentMethod: 'cash', workPeriod: '', notes: '' });
    setShowAddForm(false);
  };

  const handleSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupervisor: SupervisorSalary = {
      id: Date.now().toString(),
      supervisorName: supervisorForm.supervisorName,
      designation: supervisorForm.designation,
      monthlySalary: parseFloat(supervisorForm.monthlySalary),
      month: supervisorForm.month,
      paidAmount: parseFloat(supervisorForm.paidAmount) || 0,
      paymentDate: supervisorForm.paymentDate || undefined,
      paymentStatus: parseFloat(supervisorForm.paidAmount) >= parseFloat(supervisorForm.monthlySalary) ? 'paid' : 'pending',
      notes: supervisorForm.notes
    };

    setSupervisorSalaries([...supervisorSalaries, newSupervisor]);
    setSupervisorForm({ supervisorName: '', designation: '', monthlySalary: '', month: '', paidAmount: '', paymentDate: '', notes: '' });
    setShowAddForm(false);
  };

  const startEditWork = (work: HamaliWork) => {
    setEditingWork(work.id);
    setEditWorkForm({
      workType: work.workType,
      workDescription: work.workDescription,
      quantity: work.quantity.toString(),
      unit: work.unit,
      ratePerUnit: work.ratePerUnit.toString(),
      workDate: work.workDate,
      notes: work.notes || ''
    });
  };

  const saveEditWork = (id: string) => {
    const quantity = parseFloat(editWorkForm.quantity);
    const rate = parseFloat(editWorkForm.ratePerUnit);
    
    setHamaliWork(hamaliWork.map(work => 
      work.id === id ? {
        ...work,
        workType: editWorkForm.workType,
        workDescription: editWorkForm.workDescription,
        quantity,
        unit: editWorkForm.unit,
        ratePerUnit: rate,
        totalAmount: quantity * rate,
        workDate: editWorkForm.workDate,
        notes: editWorkForm.notes
      } : work
    ));
    setEditingWork(null);
  };

  const cancelEditWork = () => {
    setEditingWork(null);
    setEditWorkForm({ workType: '', workDescription: '', quantity: '', unit: 'bags', ratePerUnit: '', workDate: '', notes: '' });
  };

  const exportWorkData = () => {
    const csvContent = [
      ['Date', 'Work Type', 'Description', 'Quantity', 'Unit', 'Rate', 'Total Amount', 'Status', 'Notes'],
      ...hamaliWork.map(work => [
        work.workDate,
        work.workType,
        work.workDescription,
        work.quantity,
        work.unit,
        work.ratePerUnit,
        work.totalAmount,
        work.paymentStatus,
        work.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hamali-work-records.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'work', label: 'Daily Work', icon: Clock },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'supervisors', label: 'Supervisor Salaries', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hamali Management</h1>
            <p className="text-gray-600 mt-2">Track daily hamali work, payments and supervisor salaries</p>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'work' && (
              <button
                onClick={exportWorkData}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Work Data
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === 'work' ? 'Work Record' : activeTab === 'payments' ? 'Payment' : 'Supervisor'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Pending Work"
            value={formatCurrency(totalPendingWork)}
            subtitle="Bholi Paswan"
            icon={<Clock className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Paid Work"
            value={formatCurrency(totalPaidWork)}
            icon={<CreditCard className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Total Payments"
            value={formatCurrency(totalPaymentsMade)}
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Supervisor Salaries"
            value={formatCurrency(totalSupervisorSalaries)}
            icon={<Users className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Pending Supervisor"
            value={formatCurrency(pendingSupervisorPayments)}
            icon={<Calendar className="h-6 w-6" />}
            color="from-red-500 to-red-600"
          />
        </div>

        {/* Date Selector for Work Tab */}
        {activeTab === 'work' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <label className="font-medium text-gray-700">Select Date:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
                <div className="text-sm">
                  <span className="text-gray-600">Daily Total:</span>
                  <span className="ml-2 font-semibold text-gray-900">{formatCurrency(dailyTotals.totalAmount)}</span>
                </div>
                {dailyTotals.totalBags > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Total Bags:</span>
                    <span className="ml-2 font-semibold text-gray-900">{formatDecimal(dailyTotals.totalBags, 0)}</span>
                  </div>
                )}
                {workDates.length > 0 && (
                  <div className="text-sm">
                    <select 
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      <option value="">Select from history</option>
                      {workDates.map(date => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
            {activeTab === 'work' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Hamali Work Records</h3>
                {filteredWorkByDate.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No work records for {new Date(selectedDate).toLocaleDateString()}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredWorkByDate.map((work) => (
                          <tr key={work.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                              {editingWork === work.id ? (
                                <select
                                  value={editWorkForm.workType}
                                  onChange={(e) => setEditWorkForm({ ...editWorkForm, workType: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">Select Work Type</option>
                                  {workTypes.map(wt => (
                                    <option key={wt.type} value={wt.type}>{wt.type}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="truncate" title={work.workType}>{work.workType}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                              {editingWork === work.id ? (
                                <input
                                  type="text"
                                  value={editWorkForm.workDescription}
                                  onChange={(e) => setEditWorkForm({ ...editWorkForm, workDescription: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="truncate">{work.workDescription}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingWork === work.id ? (
                                <div className="flex space-x-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editWorkForm.quantity}
                                    onChange={(e) => setEditWorkForm({ ...editWorkForm, quantity: e.target.value })}
                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <select
                                    value={editWorkForm.unit}
                                    onChange={(e) => setEditWorkForm({ ...editWorkForm, unit: e.target.value as any })}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="bags">Bags</option>
                                    <option value="qtl">Qtl</option>
                                    <option value="ton">Ton</option>
                                    <option value="ack">ACK</option>
                                    <option value="bale">Bale</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                  </select>
                                </div>
                              ) : (
                                `${formatDecimal(work.quantity, 0)} ${work.unit}`
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingWork === work.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editWorkForm.ratePerUnit}
                                  onChange={(e) => setEditWorkForm({ ...editWorkForm, ratePerUnit: e.target.value })}
                                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(work.ratePerUnit)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingWork === work.id ? (
                                formatCurrency(parseFloat(editWorkForm.quantity || '0') * parseFloat(editWorkForm.ratePerUnit || '0'))
                              ) : (
                                formatCurrency(work.totalAmount)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                work.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {work.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingWork === work.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEditWork(work.id)}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={cancelEditWork}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEditWork(work)}
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

                {/* All Work Records */}
                <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">All Hamali Work Records</h3>
                {hamaliWork.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hamali work recorded yet. Add your first hamali work entry.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {hamaliWork.map((work) => (
                          <tr key={work.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(work.workDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                              <div className="truncate" title={work.workType}>{work.workType}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                              <div className="truncate">{work.workDescription}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(work.quantity, 0)} {work.unit}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(work.ratePerUnit)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(work.totalAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                work.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {work.paymentStatus}
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

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hamali Payments to Bholi Paswan</h3>
                {hamaliPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No payments recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Period</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {hamaliPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {payment.workPeriod}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                              {payment.paymentMethod.replace('-', ' ')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {payment.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'supervisors' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supervisor Salaries</h3>
                {supervisorSalaries.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No supervisor salary records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Salary</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {supervisorSalaries.map((salary) => (
                          <tr key={salary.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {salary.supervisorName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {salary.designation}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(salary.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(salary.monthlySalary)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(salary.paidAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {salary.paymentDate ? new Date(salary.paymentDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                salary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {salary.paymentStatus}
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
                  Add {activeTab === 'work' ? 'Work Record' : activeTab === 'payments' ? 'Payment' : 'Supervisor Salary'}
                </h3>
                
                {activeTab === 'work' && (
                  <form onSubmit={handleWorkSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Date</label>
                      <input
                        type="date"
                        value={workForm.workDate}
                        onChange={(e) => setWorkForm({ ...workForm, workDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                      <select
                        value={workForm.workType}
                        onChange={(e) => handleWorkTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Work Type</option>
                        {workTypes.map(workType => (
                          <option key={workType.type} value={workType.type}>
                            {workType.type} - ₹{workType.rate}/{workType.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
                      <input
                        type="text"
                        value={workForm.workDescription}
                        onChange={(e) => setWorkForm({ ...workForm, workDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the specific work done"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          value={workForm.quantity}
                          onChange={(e) => setWorkForm({ ...workForm, quantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          value={workForm.unit}
                          onChange={(e) => setWorkForm({ ...workForm, unit: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="bags">Bags</option>
                          <option value="qtl">Quintals</option>
                          <option value="ton">Tons</option>
                          <option value="ack">ACK</option>
                          <option value="bale">Bales</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Unit (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={workForm.ratePerUnit}
                        onChange={(e) => setWorkForm({ ...workForm, ratePerUnit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    {workForm.quantity && workForm.ratePerUnit && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Total Amount: <span className="font-semibold text-gray-900">
                            {formatCurrency(parseFloat(workForm.quantity || '0') * parseFloat(workForm.ratePerUnit || '0'))}
                          </span>
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={workForm.notes}
                        onChange={(e) => setWorkForm({ ...workForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Work Record
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'payments' && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Period</label>
                      <input
                        type="text"
                        value={paymentForm.workPeriod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, workPeriod: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 1-15 June 2025"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank-transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Pending Amount:</strong> {formatCurrency(totalPendingWork)}
                      </p>
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Record Payment
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'supervisors' && (
                  <form onSubmit={handleSupervisorSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
                      <input
                        type="text"
                        value={supervisorForm.supervisorName}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, supervisorName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={supervisorForm.designation}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, designation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={supervisorForm.monthlySalary}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, monthlySalary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                      <input
                        type="month"
                        value={supervisorForm.month}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, month: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={supervisorForm.paidAmount}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, paidAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={supervisorForm.paymentDate}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, paymentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={supervisorForm.notes}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Supervisor
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

export default HamaliManagement;