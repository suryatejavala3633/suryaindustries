import React, { useState, useMemo } from 'react';
import { Plus, Download, Edit, Save, X, Users, Calendar, CreditCard, Clock, FileCheck, DollarSign } from 'lucide-react';
import { HamaliWork, HamaliPayment, SupervisorSalary, LabourWage } from '../types';
import { formatNumber, formatCurrency, formatDate } from '../utils/calculations';
import StatsCard from './StatsCard';

const SalariesWages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hamali' | 'supervisors' | 'labour'>('hamali');
  const [hamaliWork, setHamaliWork] = useState<HamaliWork[]>([]);
  const [hamaliPayments, setHamaliPayments] = useState<HamaliPayment[]>([]);
  const [supervisorSalaries, setSupervisorSalaries] = useState<SupervisorSalary[]>([]);
  const [labourWages, setLabourWages] = useState<LabourWage[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Form states
  const [hamaliForm, setHamaliForm] = useState({
    workerName: '',
    workType: 'unloading-paddy' as HamaliWork['workType'],
    workDescription: '',
    quantity: '',
    unit: 'bags' as HamaliWork['unit'],
    ratePerUnit: '',
    workDate: '',
    notes: ''
  });

  const [labourForm, setLabourForm] = useState({
    workerName: '',
    workDescription: '',
    daysWorked: '',
    ratePerDay: '',
    workDate: '',
    advancePaid: '0',
    paymentStatus: 'pending' as 'pending' | 'paid',
    notes: ''
  });

  const [supervisorForm, setSupervisorForm] = useState({
    supervisorName: '',
    designation: '',
    monthlySalary: '',
    month: '',
    paidAmount: '0',
    paymentDate: '',
    paymentStatus: 'pending' as 'pending' | 'paid',
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: '',
    paymentMethod: 'cash' as 'cash' | 'bank-transfer' | 'upi',
    workPeriod: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    workerName: '',
    workType: '' as HamaliWork['workType'],
    workDescription: '',
    quantity: '',
    unit: '' as HamaliWork['unit'],
    ratePerUnit: '',
    workDate: '',
    notes: ''
  });

  const [editLabourForm, setEditLabourForm] = useState({
    workerName: '',
    workDescription: '',
    daysWorked: '',
    ratePerDay: '',
    workDate: '',
    advancePaid: '',
    paymentStatus: '' as 'pending' | 'paid',
    notes: ''
  });

  const [editSupervisorForm, setEditSupervisorForm] = useState({
    supervisorName: '',
    designation: '',
    monthlySalary: '',
    month: '',
    paidAmount: '',
    paymentDate: '',
    paymentStatus: '' as 'pending' | 'paid',
    notes: ''
  });

  // Calculate summary stats
  const totalHamaliAmount = useMemo(() => hamaliWork.reduce((sum, work) => sum + work.totalAmount, 0), [hamaliWork]);
  const pendingHamali = useMemo(() => hamaliWork.filter(work => work.paymentStatus === 'pending').reduce((sum, work) => sum + work.totalAmount, 0), [hamaliWork]);
  const paidHamali = useMemo(() => hamaliWork.filter(work => work.paymentStatus === 'paid').reduce((sum, work) => sum + work.totalAmount, 0), [hamaliWork]);
  
  const totalSupervisorSalaries = useMemo(() => supervisorSalaries.reduce((sum, salary) => sum + parseFloat(salary.monthlySalary), 0), [supervisorSalaries]);
  const pendingSupervisorSalaries = useMemo(() => supervisorSalaries.filter(salary => salary.paymentStatus === 'pending').reduce((sum, salary) => sum + (parseFloat(salary.monthlySalary) - parseFloat(salary.paidAmount)), 0), [supervisorSalaries]);
  
  const totalLabourWages = useMemo(() => labourWages.reduce((sum, wage) => sum + (parseFloat(wage.daysWorked) * parseFloat(wage.ratePerDay)), 0), [labourWages]);
  const pendingLabourWages = useMemo(() => labourWages.filter(wage => wage.paymentStatus === 'pending').reduce((sum, wage) => sum + (parseFloat(wage.daysWorked) * parseFloat(wage.ratePerDay) - parseFloat(wage.advancePaid)), 0), [labourWages]);
  const advancesPaid = useMemo(() => labourWages.reduce((sum, wage) => sum + parseFloat(wage.advancePaid), 0), [labourWages]);

  const handleHamaliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(hamaliForm.quantity);
    const rate = parseFloat(hamaliForm.ratePerUnit);
    const newHamaliWork: HamaliWork = {
      id: Date.now().toString(),
      workerName: hamaliForm.workerName,
      workType: hamaliForm.workType,
      workDescription: hamaliForm.workDescription,
      quantity,
      unit: hamaliForm.unit,
      ratePerUnit: rate,
      totalAmount: quantity * rate,
      workDate: hamaliForm.workDate,
      paymentStatus: 'pending',
      notes: hamaliForm.notes
    };
    setHamaliWork([...hamaliWork, newHamaliWork]);
    setHamaliForm({ workerName: '', workType: 'unloading-paddy', workDescription: '', quantity: '', unit: 'bags', ratePerUnit: '', workDate: '', notes: '' });
    setShowAddForm(false);
  };

  const handleLabourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const daysWorked = parseFloat(labourForm.daysWorked);
    const ratePerDay = parseFloat(labourForm.ratePerDay);
    const advancePaid = parseFloat(labourForm.advancePaid) || 0;
    
    const newLabourWage: LabourWage = {
      id: Date.now().toString(),
      workerName: labourForm.workerName,
      workDescription: labourForm.workDescription,
      daysWorked: daysWorked.toString(),
      ratePerDay: ratePerDay.toString(),
      totalAmount: daysWorked * ratePerDay,
      workDate: labourForm.workDate,
      advancePaid: advancePaid.toString(),
      remainingAmount: (daysWorked * ratePerDay) - advancePaid,
      paymentStatus: labourForm.paymentStatus,
      notes: labourForm.notes
    };
    
    setLabourWages([...labourWages, newLabourWage]);
    setLabourForm({
      workerName: '',
      workDescription: '',
      daysWorked: '',
      ratePerDay: '',
      workDate: '',
      advancePaid: '0',
      paymentStatus: 'pending',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlySalary = parseFloat(supervisorForm.monthlySalary);
    const paidAmount = parseFloat(supervisorForm.paidAmount) || 0;
    
    const newSupervisorSalary: SupervisorSalary = {
      id: Date.now().toString(),
      supervisorName: supervisorForm.supervisorName,
      designation: supervisorForm.designation,
      monthlySalary: monthlySalary.toString(),
      month: supervisorForm.month,
      paidAmount: paidAmount.toString(),
      paymentDate: supervisorForm.paymentDate,
      paymentStatus: supervisorForm.paymentStatus,
      notes: supervisorForm.notes
    };
    
    setSupervisorSalaries([...supervisorSalaries, newSupervisorSalary]);
    setSupervisorForm({
      supervisorName: '',
      designation: '',
      monthlySalary: '',
      month: '',
      paidAmount: '0',
      paymentDate: '',
      paymentStatus: 'pending',
      notes: ''
    });
    setShowAddForm(false);
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
    
    // Mark hamali work as paid up to the payment amount
    let remainingAmount = parseFloat(paymentForm.amount);
    const updatedHamaliWork = [...hamaliWork];
    
    for (let i = 0; i < updatedHamaliWork.length; i++) {
      if (updatedHamaliWork[i].paymentStatus === 'pending') {
        if (remainingAmount >= updatedHamaliWork[i].totalAmount) {
          updatedHamaliWork[i].paymentStatus = 'paid';
          remainingAmount -= updatedHamaliWork[i].totalAmount;
        } else {
          // Partial payment not supported in this simple model
          break;
        }
      }
    }
    
    setHamaliWork(updatedHamaliWork);
    setPaymentForm({ amount: '', paymentDate: '', paymentMethod: 'cash', workPeriod: '', notes: '' });
    setShowPaymentForm(false);
  };

  const startEdit = (item: HamaliWork | LabourWage | SupervisorSalary, type: 'hamali' | 'labour' | 'supervisor') => {
    setEditingItem(item.id);
    
    if (type === 'hamali') {
      const hamali = item as HamaliWork;
      setEditForm({
        workerName: hamali.workerName,
        workType: hamali.workType,
        workDescription: hamali.workDescription,
        quantity: hamali.quantity.toString(),
        unit: hamali.unit,
        ratePerUnit: hamali.ratePerUnit.toString(),
        workDate: hamali.workDate,
        notes: hamali.notes || ''
      });
    } else if (type === 'labour') {
      const labour = item as LabourWage;
      setEditLabourForm({
        workerName: labour.workerName,
        workDescription: labour.workDescription,
        daysWorked: labour.daysWorked,
        ratePerDay: labour.ratePerDay,
        workDate: labour.workDate,
        advancePaid: labour.advancePaid,
        paymentStatus: labour.paymentStatus,
        notes: labour.notes || ''
      });
    } else if (type === 'supervisor') {
      const supervisor = item as SupervisorSalary;
      setEditSupervisorForm({
        supervisorName: supervisor.supervisorName,
        designation: supervisor.designation,
        monthlySalary: supervisor.monthlySalary,
        month: supervisor.month,
        paidAmount: supervisor.paidAmount,
        paymentDate: supervisor.paymentDate || '',
        paymentStatus: supervisor.paymentStatus,
        notes: supervisor.notes || ''
      });
    }
  };

  const saveEdit = (id: string, type: 'hamali' | 'labour' | 'supervisor') => {
    if (type === 'hamali') {
      const quantity = parseFloat(editForm.quantity);
      const rate = parseFloat(editForm.ratePerUnit);
      
      setHamaliWork(hamaliWork.map(work => 
        work.id === id ? {
          ...work,
          workerName: editForm.workerName,
          workType: editForm.workType,
          workDescription: editForm.workDescription,
          quantity,
          unit: editForm.unit,
          ratePerUnit: rate,
          totalAmount: quantity * rate,
          workDate: editForm.workDate,
          notes: editForm.notes
        } : work
      ));
    } else if (type === 'labour') {
      const daysWorked = parseFloat(editLabourForm.daysWorked);
      const ratePerDay = parseFloat(editLabourForm.ratePerDay);
      const advancePaid = parseFloat(editLabourForm.advancePaid) || 0;
      
      setLabourWages(labourWages.map(wage => 
        wage.id === id ? {
          ...wage,
          workerName: editLabourForm.workerName,
          workDescription: editLabourForm.workDescription,
          daysWorked: editLabourForm.daysWorked,
          ratePerDay: editLabourForm.ratePerDay,
          totalAmount: daysWorked * ratePerDay,
          workDate: editLabourForm.workDate,
          advancePaid: editLabourForm.advancePaid,
          remainingAmount: (daysWorked * ratePerDay) - advancePaid,
          paymentStatus: editLabourForm.paymentStatus,
          notes: editLabourForm.notes
        } : wage
      ));
    } else if (type === 'supervisor') {
      const monthlySalary = parseFloat(editSupervisorForm.monthlySalary);
      const paidAmount = parseFloat(editSupervisorForm.paidAmount) || 0;
      
      setSupervisorSalaries(supervisorSalaries.map(salary => 
        salary.id === id ? {
          ...salary,
          supervisorName: editSupervisorForm.supervisorName,
          designation: editSupervisorForm.designation,
          monthlySalary: editSupervisorForm.monthlySalary,
          month: editSupervisorForm.month,
          paidAmount: editSupervisorForm.paidAmount,
          paymentDate: editSupervisorForm.paymentDate,
          paymentStatus: editSupervisorForm.paymentStatus,
          notes: editSupervisorForm.notes
        } : salary
      ));
    }
    
    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const togglePaymentStatus = (id: string, type: 'hamali' | 'labour' | 'supervisor') => {
    if (type === 'hamali') {
      setHamaliWork(hamaliWork.map(work => 
        work.id === id ? { 
          ...work, 
          paymentStatus: work.paymentStatus === 'pending' ? 'paid' : 'pending'
        } : work
      ));
    } else if (type === 'labour') {
      setLabourWages(labourWages.map(wage => 
        wage.id === id ? { 
          ...wage, 
          paymentStatus: wage.paymentStatus === 'pending' ? 'paid' : 'pending'
        } : wage
      ));
    } else if (type === 'supervisor') {
      setSupervisorSalaries(supervisorSalaries.map(salary => 
        salary.id === id ? { 
          ...salary, 
          paymentStatus: salary.paymentStatus === 'pending' ? 'paid' : 'pending',
          paymentDate: salary.paymentStatus === 'pending' ? new Date().toISOString().split('T')[0] : salary.paymentDate
        } : salary
      ));
    }
  };

  const exportData = (type: 'hamali' | 'labour' | 'supervisor') => {
    let csvContent = '';
    
    if (type === 'hamali') {
      csvContent = [
        ['Worker Name', 'Work Type', 'Description', 'Quantity', 'Unit', 'Rate', 'Total Amount', 'Work Date', 'Payment Status', 'Notes'],
        ...hamaliWork.map(work => [
          work.workerName,
          work.workType.replace('-', ' '),
          work.workDescription,
          work.quantity,
          work.unit,
          work.ratePerUnit,
          work.totalAmount,
          work.workDate,
          work.paymentStatus,
          work.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
    } else if (type === 'labour') {
      csvContent = [
        ['Worker Name', 'Work Description', 'Days Worked', 'Rate Per Day', 'Total Amount', 'Advance Paid', 'Remaining Amount', 'Work Date', 'Payment Status', 'Notes'],
        ...labourWages.map(wage => [
          wage.workerName,
          wage.workDescription,
          wage.daysWorked,
          wage.ratePerDay,
          parseFloat(wage.daysWorked) * parseFloat(wage.ratePerDay),
          wage.advancePaid,
          wage.remainingAmount,
          wage.workDate,
          wage.paymentStatus,
          wage.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
    } else if (type === 'supervisor') {
      csvContent = [
        ['Supervisor Name', 'Designation', 'Monthly Salary', 'Month', 'Paid Amount', 'Payment Date', 'Payment Status', 'Notes'],
        ...supervisorSalaries.map(salary => [
          salary.supervisorName,
          salary.designation,
          salary.monthlySalary,
          salary.month,
          salary.paidAmount,
          salary.paymentDate || '',
          salary.paymentStatus,
          salary.notes || ''
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
            <h1 className="text-3xl font-bold text-gray-900">Salaries & Wages Management</h1>
            <p className="text-gray-600 mt-2">Track hamali work, supervisor salaries, and daily labour wages</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportData(activeTab)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            {activeTab === 'hamali' && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === 'hamali' ? 'Hamali Work' : activeTab === 'supervisors' ? 'Supervisor Salary' : 'Labour Wage'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {activeTab === 'hamali' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Hamali Amount"
              value={formatCurrency(totalHamaliAmount)}
              icon={<Users className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Pending Payments"
              value={formatCurrency(pendingHamali)}
              subtitle={`${hamaliWork.filter(work => work.paymentStatus === 'pending').length} tasks pending`}
              icon={<Clock className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Paid Amount"
              value={formatCurrency(paidHamali)}
              subtitle={`${hamaliWork.filter(work => work.paymentStatus === 'paid').length} tasks completed`}
              icon={<FileCheck className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Total Payments"
              value={formatCurrency(hamaliPayments.reduce((sum, payment) => sum + payment.amount, 0))}
              subtitle={`${hamaliPayments.length} payments made`}
              icon={<CreditCard className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}

        {activeTab === 'supervisors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Monthly Salaries"
              value={formatCurrency(totalSupervisorSalaries)}
              icon={<Users className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Pending Salaries"
              value={formatCurrency(pendingSupervisorSalaries)}
              subtitle={`${supervisorSalaries.filter(salary => salary.paymentStatus === 'pending').length} salaries pending`}
              icon={<Clock className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Paid Salaries"
              value={formatCurrency(totalSupervisorSalaries - pendingSupervisorSalaries)}
              subtitle={`${supervisorSalaries.filter(salary => salary.paymentStatus === 'paid').length} salaries paid`}
              icon={<FileCheck className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Supervisors"
              value={`${supervisorSalaries.length}`}
              subtitle="Total staff members"
              icon={<Users className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}

        {activeTab === 'labour' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Labour Wages"
              value={formatCurrency(totalLabourWages)}
              icon={<Users className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Pending Wages"
              value={formatCurrency(pendingLabourWages)}
              subtitle={`${labourWages.filter(wage => wage.paymentStatus === 'pending').length} wages pending`}
              icon={<Clock className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Advances Paid"
              value={formatCurrency(advancesPaid)}
              icon={<CreditCard className="h-6 w-6" />}
              color="from-red-500 to-red-600"
            />
            <StatsCard
              title="Labour Workers"
              value={`${new Set(labourWages.map(wage => wage.workerName)).size}`}
              subtitle="Unique workers"
              icon={<Users className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'hamali', label: 'Hamali Work', icon: Users },
                { id: 'supervisors', label: 'Supervisor Salaries', icon: DollarSign },
                { id: 'labour', label: 'Daily Labour', icon: Calendar }
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
            {activeTab === 'hamali' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hamali Work Records</h3>
                {hamaliWork.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hamali work recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {hamaliWork.map((work) => (
                          <tr key={work.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {editingItem === work.id ? (
                                <input
                                  type="text"
                                  value={editForm.workerName}
                                  onChange={(e) => setEditForm({ ...editForm, workerName: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                work.workerName
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                              {editingItem === work.id ? (
                                <select
                                  value={editForm.workType}
                                  onChange={(e) => setEditForm({ ...editForm, workType: e.target.value as HamaliWork['workType'] })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="unloading-paddy">Unloading Paddy</option>
                                  <option value="loading-rice">Loading Rice</option>
                                  <option value="cleaning">Cleaning</option>
                                  <option value="bagging">Bagging</option>
                                  <option value="gunny-repair">Gunny Repair</option>
                                  <option value="other">Other</option>
                                </select>
                              ) : (
                                work.workType.replace('-', ' ')
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {editingItem === work.id ? (
                                <input
                                  type="text"
                                  value={editForm.workDescription}
                                  onChange={(e) => setEditForm({ ...editForm, workDescription: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                work.workDescription
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingItem === work.id ? (
                                <div className="flex space-x-2">
                                  <input
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <select
                                    value={editForm.unit}
                                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value as HamaliWork['unit'] })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="bags">Bags</option>
                                    <option value="qtl">Quintals</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                    <option value="pieces">Pieces</option>
                                  </select>
                                </div>
                              ) : (
                                `${formatNumber(work.quantity, 0)} ${work.unit}`
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingItem === work.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.ratePerUnit}
                                  onChange={(e) => setEditForm({ ...editForm, ratePerUnit: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(work.ratePerUnit)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(work.totalAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === work.id ? (
                                <input
                                  type="date"
                                  value={editForm.workDate}
                                  onChange={(e) => setEditForm({ ...editForm, workDate: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(work.workDate).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => togglePaymentStatus(work.id, 'hamali')}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    work.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {work.paymentStatus}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingItem === work.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(work.id, 'hamali')}
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
                                    onClick={() => startEdit(work, 'hamali')}
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

            {activeTab === 'supervisors' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supervisor Salaries</h3>
                {supervisorSalaries.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No supervisor salaries recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Salary</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {supervisorSalaries.map((salary) => (
                          <tr key={salary.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {editingItem === salary.id ? (
                                <input
                                  type="text"
                                  value={editSupervisorForm.supervisorName}
                                  onChange={(e) => setEditSupervisorForm({ ...editSupervisorForm, supervisorName: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                salary.supervisorName
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === salary.id ? (
                                <input
                                  type="text"
                                  value={editSupervisorForm.designation}
                                  onChange={(e) => setEditSupervisorForm({ ...editSupervisorForm, designation: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                salary.designation
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingItem === salary.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editSupervisorForm.monthlySalary}
                                  onChange={(e) => setEditSupervisorForm({ ...editSupervisorForm, monthlySalary: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(parseFloat(salary.monthlySalary))
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === salary.id ? (
                                <input
                                  type="month"
                                  value={editSupervisorForm.month}
                                  onChange={(e) => setEditSupervisorForm({ ...editSupervisorForm, month: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                salary.month
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                              {editingItem === salary.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editSupervisorForm.paidAmount}
                                  onChange={(e) => setEditSupervisorForm({ ...editSupervisorForm, paidAmount: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(parseFloat(salary.paidAmount))
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(parseFloat(salary.monthlySalary) - parseFloat(salary.paidAmount))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === salary.id ? (
                                <input
                                  type="date"
                                  value={editSupervisorForm.paymentDate}
                                  onChange={(e) => setEditSupervisorForm({ ...editSupervisorForm, paymentDate: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                salary.paymentDate ? new Date(salary.paymentDate).toLocaleDateString() : '-'
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => togglePaymentStatus(salary.id, 'supervisor')}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  salary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {salary.paymentStatus}
                              </button>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingItem === salary.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(salary.id, 'supervisor')}
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
                                    onClick={() => startEdit(salary, 'supervisor')}
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

            {activeTab === 'labour' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Labour Wages</h3>
                {labourWages.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No daily labour wages recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Per Day</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance Paid</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {labourWages.map((wage) => (
                          <tr key={wage.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {editingItem === wage.id ? (
                                <input
                                  type="text"
                                  value={editLabourForm.workerName}
                                  onChange={(e) => setEditLabourForm({ ...editLabourForm, workerName: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                wage.workerName
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {editingItem === wage.id ? (
                                <input
                                  type="text"
                                  value={editLabourForm.workDescription}
                                  onChange={(e) => setEditLabourForm({ ...editLabourForm, workDescription: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                wage.workDescription
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingItem === wage.id ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={editLabourForm.daysWorked}
                                  onChange={(e) => setEditLabourForm({ ...editLabourForm, daysWorked: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                wage.daysWorked
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingItem === wage.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editLabourForm.ratePerDay}
                                  onChange={(e) => setEditLabourForm({ ...editLabourForm, ratePerDay: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(parseFloat(wage.ratePerDay))
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(wage.totalAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                              {editingItem === wage.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editLabourForm.advancePaid}
                                  onChange={(e) => setEditLabourForm({ ...editLabourForm, advancePaid: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(parseFloat(wage.advancePaid))
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatCurrency(wage.remainingAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === wage.id ? (
                                <input
                                  type="date"
                                  value={editLabourForm.workDate}
                                  onChange={(e) => setEditLabourForm({ ...editLabourForm, workDate: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(wage.workDate).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => togglePaymentStatus(wage.id, 'labour')}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  wage.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {wage.paymentStatus}
                              </button>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingItem === wage.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(wage.id, 'labour')}
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
                                    onClick={() => startEdit(wage, 'labour')}
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
          </div>
        </div>

        {/* Add Forms */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add {activeTab === 'hamali' ? 'Hamali Work' : activeTab === 'supervisors' ? 'Supervisor Salary' : 'Labour Wage'}
                </h3>
                
                {activeTab === 'hamali' && (
                  <form onSubmit={handleHamaliSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                      <input
                        type="text"
                        value={hamaliForm.workerName}
                        onChange={(e) => setHamaliForm({ ...hamaliForm, workerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                      <select
                        value={hamaliForm.workType}
                        onChange={(e) => setHamaliForm({ ...hamaliForm, workType: e.target.value as HamaliWork['workType'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="unloading-paddy">Unloading Paddy</option>
                        <option value="loading-rice">Loading Rice</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="bagging">Bagging</option>
                        <option value="gunny-repair">Gunny Repair</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
                      <input
                        type="text"
                        value={hamaliForm.workDescription}
                        onChange={(e) => setHamaliForm({ ...hamaliForm, workDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          value={hamaliForm.quantity}
                          onChange={(e) => setHamaliForm({ ...hamaliForm, quantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          value={hamaliForm.unit}
                          onChange={(e) => setHamaliForm({ ...hamaliForm, unit: e.target.value as HamaliWork['unit'] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="bags">Bags</option>
                          <option value="qtl">Quintals</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="pieces">Pieces</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Unit (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={hamaliForm.ratePerUnit}
                        onChange={(e) => setHamaliForm({ ...hamaliForm, ratePerUnit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Date</label>
                      <input
                        type="date"
                        value={hamaliForm.workDate}
                        onChange={(e) => setHamaliForm({ ...hamaliForm, workDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    {hamaliForm.quantity && hamaliForm.ratePerUnit && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Total Amount: <span className="font-semibold text-gray-900">
                            {formatCurrency(parseFloat(hamaliForm.quantity || '0') * parseFloat(hamaliForm.ratePerUnit || '0'))}
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Work
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={supervisorForm.paidAmount}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, paidAmount: e.target.value })}
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
                        Add Salary
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'labour' && (
                  <form onSubmit={handleLabourSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                      <input
                        type="text"
                        value={labourForm.workerName}
                        onChange={(e) => setLabourForm({ ...labourForm, workerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
                      <input
                        type="text"
                        value={labourForm.workDescription}
                        onChange={(e) => setLabourForm({ ...labourForm, workDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Days Worked</label>
                        <input
                          type="number"
                          step="0.5"
                          value={labourForm.daysWorked}
                          onChange={(e) => setLabourForm({ ...labourForm, daysWorked: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Day (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={labourForm.ratePerDay}
                          onChange={(e) => setLabourForm({ ...labourForm, ratePerDay: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Date</label>
                      <input
                        type="date"
                        value={labourForm.workDate}
                        onChange={(e) => setLabourForm({ ...labourForm, workDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={labourForm.advancePaid}
                        onChange={(e) => setLabourForm({ ...labourForm, advancePaid: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {labourForm.daysWorked && labourForm.ratePerDay && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Total Amount:</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(parseFloat(labourForm.daysWorked) * parseFloat(labourForm.ratePerDay))}
                          </span>
                        </div>
                        {parseFloat(labourForm.advancePaid) > 0 && (
                          <>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600">Advance Paid:</span>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(parseFloat(labourForm.advancePaid))}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Remaining Amount:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(
                                  parseFloat(labourForm.daysWorked) * parseFloat(labourForm.ratePerDay) - 
                                  parseFloat(labourForm.advancePaid)
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Labour Wage
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

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Hamali Payment</h3>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount (₹)
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as 'cash' | 'bank-transfer' | 'upi' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Period
                    </label>
                    <input
                      type="text"
                      value={paymentForm.workPeriod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, workPeriod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 15-30 June 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      Record Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
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

export default SalariesWages;