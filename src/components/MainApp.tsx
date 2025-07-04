import React, { useState } from 'react';
import { Package, Factory, Truck, Sticker, TrendingUp, Users, Zap, Home, HardDrive, CreditCard } from 'lucide-react';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import RiceProduction from './RiceProduction';
import FCIConsignments from './FCIConsignments';
import StockManagement from './StockManagement';
import StreamlinedByProducts from './StreamlinedByProducts';
import SalariesWages from './SalariesWages';
import ElectricityBillCalculator from './ElectricityBillCalculator';
import DataBackupManager from './DataBackupManager';
import SalesPurchases from './SalesPurchases';

type TabType = 'home' | 'cmr-activity' | 'sales-purchases' | 'salaries' | 'byproducts' | 'electricity' | 'backup';
type CMRTabType = 'paddy' | 'production' | 'fci' | 'stock';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeCMRTab, setActiveCMRTab] = useState<CMRTabType>('paddy');

  const mainTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'cmr-activity', label: 'CMR Activity', icon: Factory },
    { id: 'sales-purchases', label: 'Sales & Purchases', icon: CreditCard },
    { id: 'salaries', label: 'Salaries & Wages', icon: Users },
    { id: 'byproducts', label: 'By-Products', icon: TrendingUp },
    { id: 'electricity', label: 'Electricity Bills', icon: Zap },
    { id: 'backup', label: 'Backup & Restore', icon: HardDrive },
  ];

  const cmrTabs = [
    { id: 'paddy', label: 'Paddy Dashboard', icon: Package, component: Dashboard },
    { id: 'production', label: 'Rice Production', icon: Factory, component: RiceProduction },
    { id: 'fci', label: 'FCI Consignments', icon: Truck, component: FCIConsignments },
    { id: 'stock', label: 'Stock Management', icon: Sticker, component: StockManagement },
  ];

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId as TabType);
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return <LandingPage onNavigate={handleNavigate} />;
    }

    if (activeTab === 'cmr-activity') {
      const ActiveCMRComponent = cmrTabs.find(tab => tab.id === activeCMRTab)?.component;
      return (
        <div className="min-h-screen bg-gray-50">
          {/* CMR Sub-navigation */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8 overflow-x-auto">
                {cmrTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCMRTab(tab.id as CMRTabType)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                        activeCMRTab === tab.id
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
          {ActiveCMRComponent && <ActiveCMRComponent />}
        </div>
      );
    }

    switch (activeTab) {
      case 'sales-purchases':
        return <SalesPurchases />;
      case 'salaries':
        return <SalariesWages />;
      case 'byproducts':
        return <StreamlinedByProducts />;
      case 'electricity':
        return <ElectricityBillCalculator />;
      case 'backup':
        return <DataBackupManager />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  if (activeTab === 'home') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Tab Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {mainTabs.map((tab) => {
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
        {renderContent()}
      </div>
    </div>
  );
};

export default MainApp;