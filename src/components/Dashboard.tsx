import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Truck, Package, MapPin, Calendar, Clock, Archive, FileCheck, Eye, EyeOff } from 'lucide-react';
import { paddyData } from '../data/paddyData';
import { calculateSummaryStats, formatNumber, formatDecimal, formatDate } from '../utils/calculations';
import { PaddyRecord } from '../types';
import StatsCard from './StatsCard';
import DataTable from './DataTable';
import FilterPanel from './FilterPanel';
import Reconciliation from './Reconciliation';

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUnloadingPoint, setSelectedUnloadingPoint] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reconciliation'>('dashboard');
  const [activeUnloadingPoint, setActiveUnloadingPoint] = useState<string>('all');
  const [showPaddyRecords, setShowPaddyRecords] = useState(false);
  const [showUnloadingPointDetails, setShowUnloadingPointDetails] = useState(false);

  // Get unique values for filters
  const uniqueCenters = useMemo(() => {
    return Array.from(new Set(paddyData.map(record => record.centerName))).sort();
  }, []);

  const uniqueDistricts = useMemo(() => {
    return Array.from(new Set(paddyData.map(record => record.district))).sort();
  }, []);

  const uniqueUnloadingPoints = useMemo(() => {
    return Array.from(new Set(paddyData.map(record => record.unloadingPoint))).sort();
  }, []);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return paddyData.filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.truckchitNo.toString().includes(searchTerm) ||
        record.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.wSlipNo.toString().includes(searchTerm);

      const matchesCenter = selectedCenter === '' || record.centerName === selectedCenter;
      const matchesDistrict = selectedDistrict === '' || record.district === selectedDistrict;
      const matchesUnloadingPoint = selectedUnloadingPoint === '' || record.unloadingPoint === selectedUnloadingPoint;

      // Date filter
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const recordDate = new Date(record.date.split('-').reverse().join('-'));
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          matchesDate = matchesDate && recordDate >= startDate;
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          matchesDate = matchesDate && recordDate <= endDate;
        }
      }

      return matchesSearch && matchesCenter && matchesDistrict && matchesUnloadingPoint && matchesDate;
    });
  }, [searchTerm, selectedCenter, selectedDistrict, selectedUnloadingPoint, dateRange]);

  const summaryStats = useMemo(() => calculateSummaryStats(filteredData), [filteredData]);

  // Calculate unloading point summary
  const unloadingPointSummary = useMemo(() => {
    return filteredData.reduce((acc, record) => {
      if (!acc[record.unloadingPoint]) {
        acc[record.unloadingPoint] = {
          totalQuintals: 0,
          totalBags: 0
        };
      }
      acc[record.unloadingPoint].totalQuintals += record.totalQuintals;
      acc[record.unloadingPoint].totalBags += record.totalBags;
      return acc;
    }, {} as Record<string, { totalQuintals: number; totalBags: number }>);
  }, [filteredData]);

  // Filter data by active unloading point
  const displayData = useMemo(() => {
    if (activeUnloadingPoint === 'all') return filteredData;
    return filteredData.filter(record => record.unloadingPoint === activeUnloadingPoint);
  }, [filteredData, activeUnloadingPoint]);

  const handleExport = () => {
    const csvContent = [
      ['S.No', 'Date', 'Vehicle No', 'W. Slip No', 'Truckchit No', 'Center Name', 'District', 'New Bags', 'Old Bags', 'Total Bags', 'Total Quintals', 'Moisture', 'Unloading Point'],
      ...filteredData.map(record => [
        record.sNo,
        record.date,
        record.vehicleNo,
        record.wSlipNo,
        record.truckchitNo,
        record.centerName,
        record.district,
        record.newBags,
        record.oldBags,
        record.totalBags,
        record.totalQuintals,
        record.moisture || '',
        record.unloadingPoint
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cmr-paddy-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCenter('');
    setSelectedDistrict('');
    setSelectedUnloadingPoint('');
    setDateRange({ start: '', end: '' });
    setActiveUnloadingPoint('all');
  };

  const getUnloadingPointColor = (point: string) => {
    switch (point) {
      case 'OLD GODOWN':
        return 'from-orange-500 to-orange-600';
      case 'NEW GODOWN':
        return 'from-green-500 to-green-600';
      case 'PLANT SHED':
        return 'from-blue-500 to-blue-600';
      case 'BATTI':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (activeTab === 'reconciliation') {
    return <Reconciliation />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CMR Paddy Dashboard</h1>
                <p className="text-sm text-gray-600">RABI 2024-25 Reconciliation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('reconciliation')}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Reconciliation
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Quintals"
            value={formatDecimal(summaryStats.totalQuintals)}
            icon={<Truck className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="New Bags"
            value={formatNumber(summaryStats.totalNewBags)}
            icon={<Package className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Old Bags"
            value={formatNumber(summaryStats.totalOldBags)}
            icon={<Archive className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Total Bags"
            value={formatNumber(summaryStats.totalBags)}
            subtitle={`New + Old Bags`}
            icon={<Package className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Enhanced Unloading Point Summary with Toggle */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Stock by Unloading Point</h3>
              <button
                onClick={() => setShowUnloadingPointDetails(!showUnloadingPointDetails)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                {showUnloadingPointDetails ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Details
                  </>
                )}
              </button>
            </div>
            
            {showUnloadingPointDetails && (
              <>
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setActiveUnloadingPoint('all')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeUnloadingPoint === 'all'
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Points ({formatNumber(summaryStats.totalBags)} bags)
                  </button>
                  {Object.entries(unloadingPointSummary).map(([point, data]) => (
                    <button
                      key={point}
                      onClick={() => setActiveUnloadingPoint(point)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        activeUnloadingPoint === point
                          ? `bg-gradient-to-r ${getUnloadingPointColor(point)} text-white shadow-md`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {point} ({formatNumber(data.totalBags)})
                    </button>
                  ))}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(unloadingPointSummary).map(([point, data]) => (
                    <div 
                      key={point} 
                      className={`rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        activeUnloadingPoint === point 
                          ? `bg-gradient-to-r ${getUnloadingPointColor(point)} text-white shadow-md` 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveUnloadingPoint(point)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium ${activeUnloadingPoint === point ? 'text-white' : 'text-gray-900'}`}>
                          {point}
                        </h4>
                        <MapPin className={`h-4 w-4 ${activeUnloadingPoint === point ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="space-y-1">
                        <div className={`text-sm ${activeUnloadingPoint === point ? 'text-white' : 'text-gray-600'}`}>
                          Quintals: <span className="font-semibold">{formatDecimal(data.totalQuintals)}</span>
                        </div>
                        <div className={`text-sm ${activeUnloadingPoint === point ? 'text-white' : 'text-gray-600'}`}>
                          Bags: <span className="font-semibold">{formatNumber(data.totalBags)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by vehicle number, truck chit, center name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    showFilters 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
                
                {(selectedCenter || selectedDistrict || selectedUnloadingPoint || searchTerm || dateRange.start || dateRange.end || activeUnloadingPoint !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <FilterPanel
                selectedCenter={selectedCenter}
                selectedDistrict={selectedDistrict}
                selectedUnloadingPoint={selectedUnloadingPoint}
                dateRange={dateRange}
                uniqueCenters={uniqueCenters}
                uniqueDistricts={uniqueDistricts}
                uniqueUnloadingPoints={uniqueUnloadingPoints}
                onCenterChange={setSelectedCenter}
                onDistrictChange={setSelectedDistrict}
                onUnloadingPointChange={setSelectedUnloadingPoint}
                onDateRangeChange={setDateRange}
              />
            )}
          </div>
        </div>

        {/* Paddy Records Toggle */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Paddy Records</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatNumber(displayData.length)} records found
                  {activeUnloadingPoint !== 'all' && ` for ${activeUnloadingPoint}`}
                </p>
              </div>
              <button
                onClick={() => setShowPaddyRecords(!showPaddyRecords)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {showPaddyRecords ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Records
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    View Records
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Data Table - Only show when toggled */}
        {showPaddyRecords && <DataTable data={displayData} />}
      </div>
    </div>
  );
};

export default Dashboard;