import React, { useState } from 'react';
import { Plus, Factory, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { RiceProduction as RiceProductionType } from '../types';
import { paddyData } from '../data/paddyData';
import { formatNumber } from '../utils/calculations';
import StatsCard from './StatsCard';

const RiceProduction: React.FC = () => {
  const [productions, setProductions] = useState<RiceProductionType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    ackQuantity: '1',
    riceType: 'boiled' as 'boiled' | 'raw',
    productionDate: '',
    notes: ''
  });

  // Calculate available paddy from paddy data
  const totalPaddyReceived = paddyData.reduce((sum, record) => sum + record.totalQuintals, 0);
  const usedPaddy = productions.reduce((sum, prod) => sum + prod.paddyUsed, 0);
  const remainingPaddy = totalPaddyReceived - usedPaddy;

  const totalRiceProduced = productions.reduce((sum, prod) => sum + prod.riceProduced, 0);
  const totalMillersDue = productions.reduce((sum, prod) => sum + prod.millersDue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ackQuantity = parseInt(formData.ackQuantity);
    const ricePerAck = 290; // 290 quintals per ACK
    const totalRiceQuantity = ackQuantity * ricePerAck;
    
    // Calculate paddy required based on rice type
    const outturnRate = formData.riceType === 'boiled' ? 0.68 : 0.67; // 68% for boiled, 67% for raw
    const paddyRequired = totalRiceQuantity / outturnRate;
    const millersDue = paddyRequired * 0.01; // 1% of paddy weight

    if (paddyRequired > remainingPaddy) {
      alert(`Insufficient paddy! Required: ${formatNumber(Math.round(paddyRequired))} Qtl, Available: ${formatNumber(Math.round(remainingPaddy))} Qtl`);
      return;
    }

    const newProduction: RiceProductionType = {
      id: Date.now().toString(),
      ackNumber: `${ackQuantity} ACK ${formData.riceType.toUpperCase()}`,
      riceType: formData.riceType,
      paddyUsed: paddyRequired,
      riceProduced: totalRiceQuantity,
      millersDue,
      productionDate: formData.productionDate,
      millName: 'Surya Industries',
      notes: formData.notes
    };

    setProductions([...productions, newProduction]);
    setFormData({ ackQuantity: '1', riceType: 'boiled', productionDate: '', notes: '' });
    setShowAddForm(false);
  };

  // Calculate paddy requirement for current form values
  const currentAckQuantity = parseInt(formData.ackQuantity) || 1;
  const currentRiceQuantity = currentAckQuantity * 290;
  const currentOutturnRate = formData.riceType === 'boiled' ? 0.68 : 0.67;
  const currentPaddyRequired = currentRiceQuantity / currentOutturnRate;
  const currentMillersDue = currentPaddyRequired * 0.01;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rice Production</h1>
            <p className="text-gray-600 mt-2">Track paddy to rice conversion and production records - Surya Industries</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Production Record
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Available Paddy"
            value={`${formatNumber(Math.round(remainingPaddy))} Qtl`}
            subtitle={`Used: ${formatNumber(Math.round(usedPaddy))} Qtl`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Rice Produced"
            value={`${formatNumber(Math.round(totalRiceProduced))} Qtl`}
            subtitle="290 Qtl per ACK"
            icon={<Factory className="h-6 w-6" />}
            color="from-emerald-500 to-emerald-600"
          />
          <StatsCard
            title="Millers Due"
            value={`${formatNumber(Math.round(totalMillersDue))} Qtl`}
            subtitle="1% of paddy weight"
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Total ACKs"
            value={formatNumber(productions.reduce((sum, prod) => {
              const ackCount = prod.ackNumber.includes('ACK') ? parseInt(prod.ackNumber.split(' ')[0]) : 1;
              return sum + ackCount;
            }, 0))}
            subtitle={`${productions.length} production batches`}
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Add Production Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Production Record</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of ACKs
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.ackQuantity}
                      onChange={(e) => setFormData({ ...formData, ackQuantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter number of ACKs"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Each ACK = 290 Quintals of Fortified Rice
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rice Type
                    </label>
                    <select
                      value={formData.riceType}
                      onChange={(e) => setFormData({ ...formData, riceType: e.target.value as 'boiled' | 'raw' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="boiled">Boiled Rice (68% outturn)</option>
                      <option value="raw">Raw Rice (67% outturn)</option>
                    </select>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Production Calculation</h4>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>ACKs:</span>
                        <span className="font-semibold">{currentAckQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rice Output:</span>
                        <span className="font-semibold">{formatNumber(currentRiceQuantity)} Qtl</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paddy Required:</span>
                        <span className="font-semibold">{formatNumber(Math.round(currentPaddyRequired))} Qtl</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Millers Due:</span>
                        <span className="font-semibold">{formatNumber(Math.round(currentMillersDue))} Qtl</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span>Available Paddy:</span>
                          <span className={`font-semibold ${currentPaddyRequired > remainingPaddy ? 'text-red-600' : 'text-green-600'}`}>
                            {formatNumber(Math.round(remainingPaddy))} Qtl
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Production Date
                    </label>
                    <input
                      type="date"
                      value={formData.productionDate}
                      onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Optional production notes..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={currentPaddyRequired > remainingPaddy}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add Production
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

        {/* Production Records */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Records - Surya Industries</h3>
            {productions.length === 0 ? (
              <div className="text-center py-8">
                <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No production records yet. Add your first production batch.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Details</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rice Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paddy Used</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rice Produced</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Millers Due</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productions.map((production) => (
                      <tr key={production.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {production.ackNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(production.productionDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            production.riceType === 'boiled' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {production.riceType === 'boiled' ? 'Boiled Rice' : 'Raw Rice'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(Math.round(production.paddyUsed))} Qtl
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatNumber(production.riceProduced)} Qtl
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                          {formatNumber(Math.round(production.millersDue))} Qtl
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {production.notes || '-'}
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

export default RiceProduction;