import React from 'react';

interface FilterPanelProps {
  selectedCenter: string;
  selectedDistrict: string;
  selectedUnloadingPoint: string;
  dateRange: { start: string; end: string };
  uniqueCenters: string[];
  uniqueDistricts: string[];
  uniqueUnloadingPoints: string[];
  onCenterChange: (center: string) => void;
  onDistrictChange: (district: string) => void;
  onUnloadingPointChange: (point: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedCenter,
  selectedDistrict,
  selectedUnloadingPoint,
  dateRange,
  uniqueCenters,
  uniqueDistricts,
  uniqueUnloadingPoints,
  onCenterChange,
  onDistrictChange,
  onUnloadingPointChange,
  onDateRangeChange
}) => {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Center
          </label>
          <select
            value={selectedCenter}
            onChange={(e) => onCenterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Centers</option>
            {uniqueCenters.map(center => (
              <option key={center} value={center}>{center}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Districts</option>
            {uniqueDistricts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Unloading Point
          </label>
          <select
            value={selectedUnloadingPoint}
            onChange={(e) => onUnloadingPointChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Unloading Points</option>
            {uniqueUnloadingPoints.map(point => (
              <option key={point} value={point}>{point}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;