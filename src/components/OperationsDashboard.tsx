import React, { useState, useEffect, useMemo } from 'react';
import { Package, Factory, Truck, TrendingUp, AlertCircle, CheckCircle, Clock, Target, BarChart3, Activity } from 'lucide-react';
import { paddyData } from '../data/paddyData';
import { 
  loadRiceProductions, 
  loadFCIConsignments, 
  loadGunnyStocks, 
  loadFRKStocks, 
  loadRexinStickers,
  loadByProductProductions 
} from '../utils/dataStorage';
import { formatNumber, formatDecimal, formatWeight } from '../utils/calculations';
import StatsCard from './StatsCard';

const OperationsDashboard: React.FC = () => {
  const [riceProductions, setRiceProductions] = useState<any[]>([]);
  const [fciConsignments, setFciConsignments] = useState<any[]>([]);
  const [gunnyStocks, setGunnyStocks] = useState<any[]>([]);
  const [frkStocks, setFrkStocks] = useState<any[]>([]);
  const [rexinStickers, setRexinStickers] = useState<any[]>([]);
  const [byProductProductions, setByProductProductions] = useState<any[]>([]);

  // Load all data on component mount
  useEffect(() => {
    setRiceProductions(loadRiceProductions());
    setFciConsignments(loadFCIConsignments());
    setGunnyStocks(loadGunnyStocks());
    setFrkStocks(loadFRKStocks());
    setRexinStickers(loadRexinStickers());
    setByProductProductions(loadByProductProductions());
  }, []);

  // Calculate paddy statistics
  const paddyStats = useMemo(() => {
    const totalQuintals = paddyData.reduce((sum, record) => sum + record.totalQuintals, 0);
    const totalBags = paddyData.reduce((sum, record) => sum + record.totalBags, 0);
    const uniqueCenters = new Set(paddyData.map(record => record.centerName)).size;
    const uniqueDistricts = new Set(paddyData.map(record => record.district)).size;
    
    return {
      totalQuintals,
      totalBags,
      uniqueCenters,
      uniqueDistricts,
      totalRecords: paddyData.length
    };
  }, []);

  // Calculate ACK delivery statistics
  const ackStats = useMemo(() => {
    // Calculate total ACKs from available paddy
    // 1 ACK = 287.1 Qtls Rice, so total ACKs = total paddy / 287.1 (rounded up)
    const totalPaddyQuintals = paddyStats.totalQuintals;
    const ricePerAck = 287.1; // Quintals per ACK
    
    // Total ACKs possible from available paddy (rounded up to next higher number)
    const totalPossibleACKs = Math.ceil(totalPaddyQuintals / ricePerAck);
    
    // ACKs produced (from rice production records)
    const acksProduced = riceProductions.reduce((sum, prod) => {
      const ackCount = prod.ackNumber.includes('ACK') ? parseInt(prod.ackNumber.split(' ')[0]) : 1;
      return sum + ackCount;
    }, 0);
    
    // ACKs delivered to FCI
    const acksDelivered = fciConsignments.filter(cons => cons.status === 'dispatched').length;
    
    // ACKs in transit or processing
    const acksInTransit = fciConsignments.filter(cons => 
      cons.status === 'in-transit' || cons.status === 'dumping-done' || cons.status === 'qc-passed'
    ).length;
    
    // Pending ACKs (produced but not yet consigned)
    const acksPending = acksProduced - fciConsignments.length;
    
    return {
      totalPossibleACKs,
      acksProduced,
      acksDelivered,
      acksInTransit,
      acksPending,
      totalConsignments: fciConsignments.length
    };
  }, [paddyStats.totalQuintals, riceProductions, fciConsignments]);

  // Calculate stock status
  const stockStatus = useMemo(() => {
    const totalGunnies = gunnyStocks.reduce((sum, stock) => sum + stock.originalQuantity, 0);
    const usedGunnies = gunnyStocks.reduce((sum, stock) => sum + stock.usedQuantity, 0);
    const remainingGunnies = gunnyStocks.reduce((sum, stock) => sum + stock.currentQuantity, 0);
    
    const totalFRK = frkStocks.reduce((sum, stock) => sum + stock.originalQuantity, 0);
    const usedFRK = frkStocks.reduce((sum, stock) => sum + stock.usedQuantity, 0);
    const remainingFRK = frkStocks.reduce((sum, stock) => sum + stock.currentQuantity, 0);
    
    // FRK requirement calculation: 1 ACK = 2.9 Qtls = 290 kg FRK
    const frkRequiredForAllACKs = ackStats.totalPossibleACKs * 290; // kg
    const frkShortage = Math.max(0, frkRequiredForAllACKs - remainingFRK);
    const frkSufficient = remainingFRK >= frkRequiredForAllACKs;
    
    const totalStickers = rexinStickers.reduce((sum, stock) => sum + stock.quantity, 0);
    const usedStickers = rexinStickers.reduce((sum, stock) => sum + stock.usedQuantity, 0);
    const remainingStickers = rexinStickers.reduce((sum, stock) => sum + stock.remainingQuantity, 0);
    
    return {
      gunnies: { total: totalGunnies, used: usedGunnies, remaining: remainingGunnies },
      frk: { 
        total: totalFRK, 
        used: usedFRK, 
        remaining: remainingFRK,
        required: frkRequiredForAllACKs,
        shortage: frkShortage,
        sufficient: frkSufficient
      },
      stickers: { total: totalStickers, used: usedStickers, remaining: remainingStickers }
    };
  }, [gunnyStocks, frkStocks, rexinStickers, ackStats.totalPossibleACKs]);

  // Calculate by-product statistics
  const byProductStats = useMemo(() => {
    const totalProduced = byProductProductions.reduce((sum, prod) => sum + prod.quantity, 0);
    const totalACKsCorrelated = byProductProductions.reduce((sum, prod) => sum + prod.correlatedACKs, 0);
    
    return {
      totalProduced,
      totalACKsCorrelated,
      averageYield: totalACKsCorrelated > 0 ? totalProduced / totalACKsCorrelated : 0
    };
  }, [byProductProductions]);

  // Progress calculation helpers
  const getProgressPercentage = (current: number, total: number) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'from-green-500 to-green-600';
    if (percentage >= 70) return 'from-blue-500 to-blue-600';
    if (percentage >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const ProgressBar: React.FC<{ current: number; total: number; label: string }> = ({ current, total, label }) => {
    const percentage = getProgressPercentage(current, total);
    const colorClass = getProgressColor(percentage);
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-900">{current}/{total} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
              <p className="text-gray-600">Complete overview of paddy processing, rice production, and FCI deliveries</p>
            </div>
          </div>
          
          {/* Key Performance Indicators */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Performance Indicators - RABI 2024-25</h2>
            
            {/* FRK Stock Alert */}
            {!stockStatus.frk.sufficient && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">FRK Stock Alert</h3>
                    <p className="text-sm text-red-700">
                      Insufficient FRK stock! Need {formatDecimal(stockStatus.frk.shortage)} kg more to complete all {ackStats.totalPossibleACKs} ACKs.
                      Current stock: {formatDecimal(stockStatus.frk.remaining)} kg
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ACK Production Progress */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">ACK Delivery Target</h3>
                <ProgressBar 
                  current={ackStats.acksDelivered} 
                  total={ackStats.totalPossibleACKs} 
                  label={`ACKs Delivered: ${ackStats.acksDelivered}/${ackStats.totalPossibleACKs}`}
                />
                <div className="text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Target ACKs:</span>
                    <span className="font-semibold">{formatNumber(ackStats.totalPossibleACKs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivered:</span>
                    <span className="font-semibold text-green-600">{formatNumber(ackStats.acksDelivered)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-semibold text-orange-600">{formatNumber(ackStats.totalPossibleACKs - ackStats.acksDelivered)}</span>
                  </div>
                </div>
              </div>

              {/* Production Progress */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Production Status</h3>
                <ProgressBar 
                  current={ackStats.acksProduced} 
                  total={ackStats.totalPossibleACKs} 
                  label={`ACKs Produced: ${ackStats.acksProduced}/${ackStats.totalPossibleACKs}`}
                />
                <div className="text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Produced:</span>
                    <span className="font-semibold text-green-600">{formatNumber(ackStats.acksProduced)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ready to Produce:</span>
                    <span className="font-semibold">{formatNumber(ackStats.totalPossibleACKs - ackStats.acksProduced)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rice Available:</span>
                    <span className="font-semibold">{formatWeight(riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0))}</span>
                  </div>
                </div>
              </div>

              {/* FRK Stock Status */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">FRK Stock Status</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-purple-700">Stock vs Requirement</span>
                    <span className={`text-sm font-bold ${stockStatus.frk.sufficient ? 'text-green-600' : 'text-red-600'}`}>
                      {stockStatus.frk.sufficient ? 'Sufficient' : 'Insufficient'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        stockStatus.frk.sufficient 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (stockStatus.frk.remaining / stockStatus.frk.required) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-purple-700">
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-semibold">{formatDecimal(stockStatus.frk.remaining)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required:</span>
                    <span className="font-semibold">{formatDecimal(stockStatus.frk.required)} kg</span>
                  </div>
                  {!stockStatus.frk.sufficient && (
                    <div className="flex justify-between">
                      <span>Shortage:</span>
                      <span className="font-semibold text-red-600">{formatDecimal(stockStatus.frk.shortage)} kg</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>ACKs Possible:</span>
                    <span className="font-semibold">{Math.floor(stockStatus.frk.remaining / 290)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Paddy Received"
            value={formatWeight(paddyStats.totalQuintals)}
            subtitle={`${formatNumber(paddyStats.totalBags)} bags from ${paddyStats.uniqueCenters} centers`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="ACKs to Deliver"
            value={`${formatNumber(ackStats.totalPossibleACKs)} ACKs`}
            subtitle={`From ${formatWeight(paddyStats.totalQuintals)} paddy (${formatDecimal(paddyStats.totalQuintals / 287.1, 1)} exact)`}
            icon={<Factory className="h-6 w-6" />}
            color="from-emerald-500 to-emerald-600"
          />
          <StatsCard
            title="ACKs Delivered"
            value={`${formatNumber(ackStats.acksDelivered)}/${formatNumber(ackStats.totalPossibleACKs)}`}
            subtitle={`${getProgressPercentage(ackStats.acksDelivered, ackStats.totalPossibleACKs)}% complete | ${formatNumber(ackStats.acksInTransit)} in transit`}
            icon={<Truck className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="FRK Stock Status"
            value={stockStatus.frk.sufficient ? "✓ Sufficient" : "⚠ Low Stock"}
            subtitle={`${formatDecimal(stockStatus.frk.remaining)} kg available | Need ${formatDecimal(stockStatus.frk.required)} kg`}
            icon={<AlertCircle className="h-6 w-6" />}
            color={stockStatus.frk.sufficient ? "from-green-500 to-green-600" : "from-red-500 to-red-600"}
          />
        </div>

        {/* Detailed Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Production Flow */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Production Flow
              </h3>
              
              <div className="space-y-6">
                {/* Paddy to Rice Conversion */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Paddy to Rice Conversion</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Paddy Available:</span>
                      <span className="font-semibold text-blue-900">{formatWeight(paddyStats.totalQuintals)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Rice Produced:</span>
                      <span className="font-semibold text-blue-900">
                        {formatWeight(riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Conversion Rate:</span>
                      <span className="font-semibold text-blue-900">
                        {paddyStats.totalQuintals > 0 ? 
                          formatDecimal((riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0) / paddyStats.totalQuintals) * 100, 1) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACK Status Breakdown */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3">ACK Status Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-700">Delivered to FCI:</span>
                      </div>
                      <span className="font-semibold text-green-900">{formatNumber(ackStats.acksDelivered)} ACKs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-green-700">In Transit:</span>
                      </div>
                      <span className="font-semibold text-green-900">{formatNumber(ackStats.acksInTransit)} ACKs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                        <span className="text-sm text-green-700">Ready for Dispatch:</span>
                      </div>
                      <span className="font-semibold text-green-900">{formatNumber(ackStats.acksPending)} ACKs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Availability */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Stock Availability
              </h3>
              
              <div className="space-y-6">
                {/* Gunny Bags */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-3">Gunny Bags</h4>
                  <ProgressBar 
                    current={stockStatus.gunnies.used} 
                    total={stockStatus.gunnies.total} 
                    label="Usage Progress" 
                  />
                  <div className="text-xs text-purple-700">
                    Remaining: {formatNumber(stockStatus.gunnies.remaining)} bags
                    ({Math.floor(stockStatus.gunnies.remaining / 580)} ACKs possible)
                  </div>
                </div>

                {/* FRK Stock */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-3">FRK Stock</h4>
                  <ProgressBar 
                    current={stockStatus.frk.remaining} 
                    total={stockStatus.frk.required} 
                    label={`Available vs Required: ${formatDecimal(stockStatus.frk.remaining)}/${formatDecimal(stockStatus.frk.required)} kg`}
                  />
                  <div className={`text-xs ${stockStatus.frk.sufficient ? 'text-green-700' : 'text-red-700'}`}>
                    {stockStatus.frk.sufficient ? (
                      <>Sufficient stock for all {ackStats.totalPossibleACKs} ACKs</>
                    ) : (
                      <>Shortage: {formatDecimal(stockStatus.frk.shortage)} kg ({Math.ceil(stockStatus.frk.shortage / 290)} ACKs affected)</>
                    )}
                  </div>
                </div>

                {/* Rexin Stickers */}
                <div className="bg-pink-50 rounded-lg p-4">
                  <h4 className="font-medium text-pink-900 mb-3">Rexin Stickers</h4>
                  <ProgressBar 
                    current={stockStatus.stickers.used} 
                    total={stockStatus.stickers.total} 
                    label="Usage Progress" 
                  />
                  <div className="text-xs text-pink-700">
                    Remaining: {formatNumber(stockStatus.stickers.remaining)} stickers
                    ({Math.floor(stockStatus.stickers.remaining / 580)} ACKs possible)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Paddy Processing Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Paddy Processing
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-semibold text-gray-900">{formatNumber(paddyStats.totalRecords)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Bags:</span>
                  <span className="font-semibold text-gray-900">{formatNumber(paddyStats.totalBags)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Quintals:</span>
                  <span className="font-semibold text-gray-900">{formatWeight(paddyStats.totalQuintals)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Centers:</span>
                  <span className="font-semibold text-gray-900">{paddyStats.uniqueCenters}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Districts:</span>
                  <span className="font-semibold text-gray-900">{paddyStats.uniqueDistricts}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rice Production Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Factory className="h-5 w-5 mr-2 text-emerald-600" />
                Rice Production
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Production Batches:</span>
                  <span className="font-semibold text-gray-900">{formatNumber(riceProductions.length)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total ACKs:</span>
                  <span className="font-semibold text-gray-900">{formatNumber(ackStats.acksProduced)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Rice Produced:</span>
                  <span className="font-semibold text-gray-900">
                    {formatWeight(riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Paddy Used:</span>
                  <span className="font-semibold text-gray-900">
                    {formatWeight(riceProductions.reduce((sum, prod) => sum + prod.paddyUsed, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Avg. Outturn:</span>
                  <span className="font-semibold text-gray-900">
                    {paddyStats.totalQuintals > 0 ? 
                      formatDecimal((riceProductions.reduce((sum, prod) => sum + prod.riceProduced, 0) / 
                      riceProductions.reduce((sum, prod) => sum + prod.paddyUsed, 0)) * 100, 1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FCI Consignment Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-green-600" />
                FCI Consignments
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Consignments:</span>
                  <span className="font-semibold text-gray-900">{formatNumber(ackStats.totalConsignments)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Delivered:</span>
                  <span className="font-semibold text-green-600">{formatNumber(ackStats.acksDelivered)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">In Transit:</span>
                  <span className="font-semibold text-yellow-600">{formatNumber(ackStats.acksInTransit)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Rice Delivered:</span>
                  <span className="font-semibold text-gray-900">
                    {formatWeight(ackStats.acksDelivered * 287.1)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Delivery Rate:</span>
                  <span className="font-semibold text-gray-900">
                    {ackStats.acksProduced > 0 ? 
                      getProgressPercentage(ackStats.acksDelivered, ackStats.acksProduced) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Constraints Analysis */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Constraints & Capacity Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Rice Capacity */}
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Factory className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Rice Capacity</h4>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Math.floor((paddyStats.totalQuintals * 0.675) / 287.1)}
                </div>
                <div className="text-xs text-gray-500">Max possible ACKs</div>
              </div>

              {/* Gunny Constraint */}
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Gunny Constraint</h4>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.floor(stockStatus.gunnies.remaining / 580)}
                </div>
                <div className="text-xs text-gray-500">ACKs possible with gunnies</div>
              </div>

              {/* FRK Constraint */}
              <div className="text-center">
                <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">FRK Constraint</h4>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {Math.floor(stockStatus.frk.remaining / 290)}
                </div>
                <div className="text-xs text-gray-500">ACKs possible with FRK</div>
              </div>

              {/* Sticker Constraint */}
              <div className="text-center">
                <div className="bg-pink-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-pink-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Sticker Constraint</h4>
                <div className="text-2xl font-bold text-pink-600 mb-1">
                  {Math.floor(stockStatus.stickers.remaining / 580)}
                </div>
                <div className="text-xs text-gray-500">ACKs possible with stickers</div>
              </div>
            </div>

            {/* Bottleneck Analysis */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Bottleneck Analysis</h4>
              <div className="text-sm text-gray-600">
                {(() => {
                  const constraints = [
                    { name: 'Rice Production', capacity: Math.floor((paddyStats.totalQuintals * 0.675) / 287.1) },
                    { name: 'Gunny Bags', capacity: Math.floor(stockStatus.gunnies.remaining / 580) },
                    { name: 'FRK Stock', capacity: Math.floor(stockStatus.frk.remaining / 290) },
                    { name: 'Rexin Stickers', capacity: Math.floor(stockStatus.stickers.remaining / 580) }
                  ];
                  
                  const bottleneck = constraints.reduce((min, constraint) => 
                    constraint.capacity < min.capacity ? constraint : min
                  );
                  
                  return (
                    <div>
                      <span className="font-medium text-red-600">Current Bottleneck: {bottleneck.name}</span>
                      <span className="ml-2">({bottleneck.capacity} ACKs maximum capacity)</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Latest Productions */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Latest Productions</h4>
                <div className="space-y-2">
                  {riceProductions.slice(-3).reverse().map((production, index) => (
                    <div key={production.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">{production.ackNumber}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(production.productionDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {riceProductions.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">No productions yet</div>
                  )}
                </div>
              </div>

              {/* Latest Consignments */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Latest Consignments</h4>
                <div className="space-y-2">
                  {fciConsignments.slice(-3).reverse().map((consignment, index) => (
                    <div key={consignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">{consignment.ackNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(consignment.status)}`}>
                        {consignment.status}
                      </span>
                    </div>
                  ))}
                  {fciConsignments.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">No consignments yet</div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Production Efficiency:</span>
                    <span className="font-semibold text-green-600">
                      {getProgressPercentage(ackStats.acksProduced, ackStats.totalPossibleACKs)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivery Rate:</span>
                    <span className="font-semibold text-blue-600">
                      {ackStats.acksProduced > 0 ? getProgressPercentage(ackStats.acksDelivered, ackStats.acksProduced) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock Utilization:</span>
                    <span className="font-semibold text-purple-600">
                      {stockStatus.gunnies.total > 0 ? getProgressPercentage(stockStatus.gunnies.used, stockStatus.gunnies.total) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;