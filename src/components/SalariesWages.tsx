import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Users, Calendar, IndianRupee, Clock, Edit, Save, X, Download } from 'lucide-react';
import { HamaliWork, LabourWage, SupervisorSalary } from '../types';
import { formatCurrency, formatDecimal } from '../utils/calculations';
import { 
  saveHamaliWork, loadHamaliWork, saveLabourWages, loadLabourWages, 
  saveSupervisorSalaries, loadSupervisorSalaries 
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const SalariesWages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hamali' | 'labour' | 'supervisors'>('hamali');
  const [hamaliWork, setHamaliWork] = useState<HamaliWork[]>([]);
  const [labourWages, setLabourWages] = useState<LabourWage[]>([]);
  const [supervisorSalaries, setSupervisorSalaries] = useState<SupervisorSalary[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    setHamaliWork(loadHamaliWork());
    setLabourWages(loadLabourWages());
    setSupervisorSalaries(loadSupervisorSalaries());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    saveHamaliWork(hamaliWork);
  }, [hamaliWork]);

  useEffect(() => {
    saveLabourWages(labourWages);
  }, [labourWages]);

  useEffect(() => {
    saveSupervisorSalaries(supervisorSalaries);
  }, [supervisorSalaries]);

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
    advancePaid: '',
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

  const [editHamaliForm, setEditHamaliForm] = useState({
    workerName: '',
    workType: 'unloading-paddy' as HamaliWork['workType'],
    workDescription: '',
    quantity: '',
    unit: 'bags' as HamaliWork['unit'],
    ratePerUnit: '',
    workDate: '',
    notes: ''
  });

  // Calculate summary stats
  const totalHamaliPending = useMemo(() => 
    hamaliWork.filter(work => work.paymentStatus === 'pending').reduce((sum, work) => sum + work.totalAmount, 0), 
    [hamaliWork]
  );
  
  const totalLabourPending = useMemo(() => 
    labourWages.filter(wage => wage.paymentStatus === 'pending').reduce((sum, wage) => sum + wage.remainingAmount, 0), 
    [labourWages]
  );
  
  const totalSupervisorPending = useMemo(() => 
    supervisorSalaries.filter(salary => salary.paymentStatus === 'pending').reduce((sum, salary) => sum + (parseFloat(salary.monthlySalary) - parseFloat(salary.paidAmount || '0')), 0), 
    [supervisorSalaries]
  );

  const totalHamaliPaid = useMemo(() => 
    hamaliWork.filter(work => work.paymentStatus === 'paid').reduce((sum, work) => sum + work.totalAmount, 0), 
    [hamaliWork]
  );

  // Handle form submissions
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
    const totalAmount = daysWorked * ratePerDay;
    const advancePaid = parseFloat(labourForm.advancePaid) || 0;
    const newLabourWage: LabourWage = {
      id: Date.now().toString(),
      workerName: labourForm.workerName,
      workDescription: labourForm.workDescription,
      daysWorked: labourForm.daysWorked,
      ratePerDay: labourForm.ratePerDay,
      totalAmount,
      workDate: labourForm.workDate,
      advancePaid: labourForm.advancePaid,
      remainingAmount: totalAmount - advancePaid,
      paymentStatus: totalAmount - advancePaid <= 0 ? 'paid' : 'pending',
      notes: labourForm.notes
    };
    setLabourWages([...labourWages, newLabourWage]);
    setLabourForm({ workerName: '', workDescription: '', daysWorked: '', ratePerDay: '', workDate: '', advancePaid: '', notes: '' });
    setShowAddForm(false);
  };

  const handleSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupervisorSalary: SupervisorSalary = {
      id: Date.now().toString(),
      supervisorName: supervisorForm.supervisorName,
      designation: supervisorForm.designation,
      monthlySalary: supervisorForm.monthlySalary,
      month: supervisorForm.month,
      paidAmount: supervisorForm.paidAmount,
      paymentDate: supervisorForm.paymentDate || undefined,
      paymentStatus: parseFloat(supervisorForm.paidAmount || '0') >= parseFloat(supervisorForm.monthlySalary) ? 'paid' : 'pending',
      notes: supervisorForm.notes
    };
    setSupervisorSalaries([...supervisorSalaries, newSupervisorSalary]);
    setSupervisorForm({ supervisorName: '', designation: '', monthlySalary: '', month: '', paidAmount: '', paymentDate: '', notes: '' });
    setShowAddForm(false);
  };

  const startEditHamali = (work: HamaliWork) => {
    setEditingItem(work.id);
    setEditHamaliForm({
      workerName: work.workerName,
      workType: work.workType,
      workDescription: work.workDescription,
      quantity: work.quantity.toString(),
      unit: work.unit,
      ratePerUnit: work.ratePerUnit.toString(),
      workDate: work.workDate,
      notes: work.notes || ''
    });
  };

  const saveEditHamali = (id: string) => {
    const quantity = parseFloat(editHamaliForm.quantity);
    const rate = parseFloat(editHamaliForm.ratePerUnit);
    setHamaliWork(hamaliWork.map(work => 
      work.id === id ? {
        ...work,
        workerName: editHamaliForm.workerName,
        workType: editHamaliForm.workType,
        workDescription: editHamaliForm.workDescription,
        quantity,
        unit: editHamaliForm.unit,
        ratePerUnit: rate,
        totalAmount: quantity * rate,
        workDate: editHamaliForm.workDate,
        notes: editHamaliForm.notes
      } : work
    ));
    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditHamaliForm({ workerName: '', workType: 'unloading-paddy', workDescription: '', quantity: '', unit: 'bags', ratePerUnit: '', workDate: '', notes: '' });
  };

  const toggleHamaliPayment = (id: string) => {
    setHamaliWork(hamaliWork.map(work => 
      work.id === id ? { ...work, paymentStatus: work.paymentStatus === 'paid' ? 'pending' : 'paid' } : work
    ));
  };

  const toggleLabourPayment = (id: string) => {
    setLabourWages(labourWages.map(wage => 
      wage.id === id ? { ...wage, paymentStatus: wage.paymentStatus === 'paid' ? 'pending' : 'paid' } : wage
    ));
  };

  const toggleSupervisorPayment = (id: string) => {
    setSupervisorSalaries(supervisorSalaries.map(salary => 
      salary.id === id ? { 
        ...salary, 
        paymentStatus: salary.paymentStatus === 'paid' ? 'pending' : 'paid',
        paymentDate: salary.paymentStatus === 'pending' ? new Date().toISOString().split('T')[0] : undefined
      } : salary
    ));
  };

  const deleteHamaliWork = (id: string) => {
    if (window.confirm('Are you sure you want to delete this hamali work record?')) {
      setHamaliWork(hamaliWork.filter(work => work.id !== id));
    }
  };

  const exportData = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'hamali') {
      csvContent = [
        ['S.No', 'Worker Name', 'Work Type', 'Description', 'Quantity', 'Unit', 'Rate', 'Total Amount', 'Date', 'Status', 'Notes'],
        ...hamaliWork.map((work, index) => [
          index + 1,
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
      filename = 'hamali-work-records.csv';
    } else if (activeTab === 'labour') {
      csvContent = [
        ['S.No', 'Worker Name', 'Description', 'Days Worked', 'Rate/Day', 'Total Amount', 'Advance Paid', 'Remaining', 'Date', 'Status', 'Notes'],
        ...labourWages.map((wage, index) => [
          index + 1,
          wage.workerName,
          wage.workDescription,
          wage.daysWorked,
          wage.ratePerDay,
          wage.totalAmount,
          wage.advancePaid,
          wage.remainingAmount,
          wage.workDate,
          wage.paymentStatus,
          wage.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
      filename = 'labour-wage-records.csv';
    } else {
      csvContent = [
        ['S.No', 'Supervisor Name', 'Designation', 'Monthly Salary', 'Month', 'Paid Amount', 'Payment Date', 'Status', 'Notes'],
        ...supervisorSalaries.map((salary, index) => [
          index + 1,
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
      filename = 'supervisor-salary-records.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'hamali', label: 'Hamali Work', icon: Users },
    { id: 'labour', label: 'Labour Wages', icon: Clock },
    { id: 'supervisors', label: 'Supervisor Salaries', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salaries & Wages</h1>
            <p className="text-gray-600 mt-2">Manage hamali work, labour wages and supervisor salaries</p>
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
              Add {activeTab === 'hamali' ? 'Hamali Work' : activeTab === 'labour' ? 'Labour Wage' : 'Supervisor Salary'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Hamali Pending"
            value={formatCurrency(totalHamaliPending)}
            icon={<Users className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Labour Pending"
            value={formatCurrency(totalLabourPending)}
            icon={<Clock className="h-6 w-6" />}
            color="from-red-500 to-red-600"
          />
          <StatsCard
            title="Supervisor Pending"
            value={formatCurrency(totalSupervisorPending)}
            icon={<Calendar className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Hamali Paid"
            value={formatCurrency(totalHamaliPaid)}
            icon={<IndianRupee className="h-6 w-6" />}
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
            {activeTab === 'hamali' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Hamali Work Records</h3>
                  <div className="text-sm text-gray-600">
                    Total Records: {hamaliWork.length} | 
                    Pending: {hamaliWork.filter(w => w.paymentStatus === 'pending').length} | 
                    Paid: {hamaliWork.filter(w => w.paymentStatus === 'paid').length}
                  </div>
                </div>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
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
                        {hamaliWork.map((work, index) => (
                          <tr key={work.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {editingItem === work.id ? (
                                <input
                                  type="text"
                                  value={editHamaliForm.workerName}
                                  onChange={(e) => setEditHamaliForm({ ...editHamaliForm, workerName: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                work.workerName
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === work.id ? (
                                <select
                                  value={editHamaliForm.workType}
                                  onChange={(e) => setEditHamaliForm({ ...editHamaliForm, workType: e.target.value as HamaliWork['workType'] })}
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
                                <span className="capitalize">{work.workType.replace('-', ' ')}</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                              {editingItem === work.id ? (
                                <input
                                  type="text"
                                  value={editHamaliForm.workDescription}
                                  onChange={(e) => setEditHamaliForm({ ...editHamaliForm, workDescription: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="truncate" title={work.workDescription}>
                                  {work.workDescription}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingItem === work.id ? (
                                <div className="flex space-x-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editHamaliForm.quantity}
                                    onChange={(e) => setEditHamaliForm({ ...editHamaliForm, quantity: e.target.value })}
                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <select
                                    value={editHamaliForm.unit}
                                    onChange={(e) => setEditHamaliForm({ ...editHamaliForm, unit: e.target.value as HamaliWork['unit'] })}
                                    className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="bags">Bags</option>
                                    <option value="qtl">Qtl</option>
                                    <option value="hours">Hrs</option>
                                    <option value="days">Days</option>
                                    <option value="pieces">Pcs</option>
                                  </select>
                                </div>
                              ) : (
                                `${formatDecimal(work.quantity, 0)} ${work.unit}`
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingItem === work.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editHamaliForm.ratePerUnit}
                                  onChange={(e) => setEditHamaliForm({ ...editHamaliForm, ratePerUnit: e.target.value })}
                                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatCurrency(work.ratePerUnit)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingItem === work.id ? (
                                <span className="text-blue-600 font-semibold">
                                  {formatCurrency(parseFloat(editHamaliForm.quantity || '0') * parseFloat(editHamaliForm.ratePerUnit || '0'))}
                                </span>
                              ) : (
                                formatCurrency(work.totalAmount)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === work.id ? (
                                <input
                                  type="date"
                                  value={editHamaliForm.workDate}
                                  onChange={(e) => setEditHamaliForm({ ...editHamaliForm, workDate: e.target.value })}
                                  className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(work.workDate).toLocaleDateString()
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
                                {editingItem === work.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEditHamali(work.id)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Save"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="text-red-600 hover:text-red-800"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditHamali(work)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Edit"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => toggleHamaliPayment(work.id)}
                                      className={`text-sm font-medium ${
                                        work.paymentStatus === 'paid' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                                      }`}
                                      title={work.paymentStatus === 'paid' ? 'Mark as Pending' : 'Mark as Paid'}
                                    >
                                      {work.paymentStatus === 'paid' ? '↩' : '✓'}
                                    </button>
                                    <button
                                      onClick={() => deleteHamaliWork(work.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete"
                                    >
                                      <X className="h-4 w-4" />
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
            )}

            {activeTab === 'labour' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Labour Wage Records</h3>
                {labourWages.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No labour wages recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate/Day</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {labourWages.map((wage) => (
                          <tr key={wage.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {wage.workerName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {wage.workDescription}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {wage.daysWorked}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(parseFloat(wage.ratePerDay))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(wage.totalAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600">
                              {formatCurrency(parseFloat(wage.advancePaid))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(wage.remainingAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(wage.workDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                wage.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {wage.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => toggleLabourPayment(wage.id)}
                                className={`text-sm font-medium ${
                                  wage.paymentStatus === 'paid' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                                }`}
                              >
                                Mark as {wage.paymentStatus === 'paid' ? 'Pending' : 'Paid'}
                              </button>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supervisor Salary Records</h3>
                {supervisorSalaries.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No supervisor salaries recorded yet.</p>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(salary.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(parseFloat(salary.monthlySalary))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600">
                              {formatCurrency(parseFloat(salary.paidAmount || '0'))}
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
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => toggleSupervisorPayment(salary.id)}
                                className={`text-sm font-medium ${
                                  salary.paymentStatus === 'paid' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                                }`}
                              >
                                Mark as {salary.paymentStatus === 'paid' ? 'Pending' : 'Paid'}
                              </button>
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
                  Add {activeTab === 'hamali' ? 'Hamali Work' : activeTab === 'labour' ? 'Labour Wage' : 'Supervisor Salary'}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={hamaliForm.notes}
                        onChange={(e) => setHamaliForm({ ...hamaliForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Optional notes..."
                      />
                    </div>
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
                        placeholder="0"
                      />
                    </div>
                    {labourForm.daysWorked && labourForm.ratePerDay && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(parseFloat(labourForm.daysWorked || '0') * parseFloat(labourForm.ratePerDay || '0'))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Advance Paid:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(parseFloat(labourForm.advancePaid || '0'))}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Remaining:</span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency((parseFloat(labourForm.daysWorked || '0') * parseFloat(labourForm.ratePerDay || '0')) - parseFloat(labourForm.advancePaid || '0'))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={labourForm.notes}
                        onChange={(e) => setLabourForm({ ...labourForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Optional notes..."
                      />
                    </div>
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
                        placeholder="e.g., Mill Supervisor, Security Guard"
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
                        placeholder="0"
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
                    {supervisorForm.monthlySalary && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Monthly Salary:</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(parseFloat(supervisorForm.monthlySalary || '0'))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Paid Amount:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(parseFloat(supervisorForm.paidAmount || '0'))}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Remaining:</span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(parseFloat(supervisorForm.monthlySalary || '0') - parseFloat(supervisorForm.paidAmount || '0'))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={supervisorForm.notes}
                        onChange={(e) => setSupervisorForm({ ...supervisorForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Optional notes..."
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Salary Record
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

export default SalariesWages;