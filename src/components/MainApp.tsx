import React, { useState } from 'react';
import { Package, Factory, Truck, Sticker, TrendingUp, Users, Zap, Home, HardDrive } from 'lucide-react';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import RiceProduction from './RiceProduction';
import FCIConsignments from './FCIConsignments';
import StockManagement from './StockManagement';
import ByProductsRevenue from './ByProductsRevenue';
import SalariesWages from './SalariesWages';
import ElectricityBillCalculator from './ElectricityBillCalculator';
import DataBackupManager from './DataBackupManager';

type TabType = 'home' | 'paddy' | 'production' | 'fci' | 'stock' | 'revenue' | 'salaries' | 'electricity' | 'backup';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: Home, component: null },
    { id: 'paddy', label: 'Paddy Dashboard', icon: Package, component: Dashboard },
    { id: 'production', label: 'Rice Production', icon: Factory, component: RiceProduction },
    { id: 'fci', label: 'FCI Consignments', icon: Truck, component: FCIConsignments },
    { id: 'stock', label: 'Stock Management', icon: Sticker, component: StockManagement },
    { id: 'salaries', label: 'Salaries & Wages', icon: Users, component: SalariesWages },
    { id: 'revenue', label: 'By-Products & Revenue', icon: TrendingUp, component: ByProductsRevenue },
    { id: 'electricity', label: 'Electricity Bills', icon: Zap, component: ElectricityBillCalculator },
    { id: 'backup', label: 'Backup & Restore', icon: HardDrive, component: DataBackupManager },
  ];

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId as TabType);
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  if (activeTab === 'home') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
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
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default MainApp;