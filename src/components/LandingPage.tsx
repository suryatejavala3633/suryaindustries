import React from 'react';
import { Factory, Package, Truck, Sticker, TrendingUp, Users, Zap, FileCheck, ArrowRight, Phone, Mail, MapPin, Award, Shield, Clock, CreditCard } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const modules = [
    {
      id: 'cmr-activity',
      title: 'CMR Activity',
      description: 'Complete rice mill operations management',
      icon: Factory,
      color: 'from-emerald-500 to-green-600',
      features: ['Paddy tracking', 'Rice production', 'FCI consignments', 'Stock management'],
      subModules: [
        { name: 'Paddy Dashboard', desc: 'Track paddy receipts and reconciliation' },
        { name: 'Rice Production', desc: 'Monitor production and outturn rates' },
        { name: 'FCI Consignments', desc: 'Manage FCI deliveries and documentation' },
        { name: 'Stock Management', desc: 'Inventory control for materials' }
      ]
    },
    {
      id: 'payables',
      title: 'Payables & Receivables',
      description: 'Complete financial management for purchases and sales',
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      features: ['Purchase management', 'Sales tracking', 'Outstanding amounts', 'Vendor management']
    },
    {
      id: 'salaries',
      title: 'Salaries & Wages',
      description: 'Payroll management for staff and daily wage workers',
      icon: Users,
      color: 'from-teal-500 to-cyan-600',
      features: ['Payroll processing', 'Attendance tracking', 'Wage calculation', 'Hamali management']
    },
    {
      id: 'revenue',
      title: 'By-Products & Revenue',
      description: 'Track by-product sales, customer management and invoicing',
      icon: TrendingUp,
      color: 'from-pink-500 to-rose-600',
      features: ['Sales tracking', 'Customer management', 'Revenue analysis', 'Invoice generation']
    },
    {
      id: 'electricity',
      title: 'Electricity Bills',
      description: 'Monitor power consumption, bills and cost optimization',
      icon: Zap,
      color: 'from-yellow-500 to-amber-600',
      features: ['Consumption tracking', 'Bill management', 'Cost analysis', 'Power factor monitoring']
    }
  ];

  const stats = [
    { label: 'Years of Experience', value: '15+', icon: Award },
    { label: 'Processing Capacity', value: '50 Ton/Day', icon: Factory },
    { label: 'Quality Assurance', value: '100%', icon: Shield },
    { label: 'Uptime', value: '99.9%', icon: Clock }
  ];

  const openGoogleMaps = () => {
    window.open('https://maps.app.goo.gl/DL1BMMsVDUmqkLQQ6', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Factory className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              M/s <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Surya Industries</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Premium Rice Mill & Processing Unit
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Advanced rice processing with state-of-the-art technology, ensuring quality and efficiency in every grain
            </p>
            
            {/* Contact Info */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center space-x-2 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" onClick={openGoogleMaps}>
                <MapPin className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">229/34, 229/41, 229/60</div>
                  <div className="text-sm">Mangapur (V), Hathnoora (M), Sangareddy (D)</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>098495 23633</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>info@suryaindustries.com</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="flex items-center justify-center mb-3">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Management Modules</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive digital solutions for modern rice mill operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden cursor-pointer"
                onClick={() => onNavigate(module.id)}
              >
                <div className={`h-2 bg-gradient-to-r ${module.color}`}></div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`bg-gradient-to-r ${module.color} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {module.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {module.description}
                  </p>
                  
                  <div className="space-y-2">
                    {module.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${module.color}`}></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sub-modules for CMR Activity */}
                  {module.subModules && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Includes:</h4>
                      <div className="space-y-2">
                        {module.subModules.map((subModule, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            <span className="font-medium">{subModule.name}:</span> {subModule.desc}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Why Choose Surya Industries?</h2>
            <p className="text-xl opacity-90 mb-12 max-w-3xl mx-auto">
              Leading the industry with innovation, quality, and reliability
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <Shield className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Quality Assurance</h3>
                <p className="opacity-90">Stringent quality control at every stage of processing</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <Factory className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Modern Technology</h3>
                <p className="opacity-90">State-of-the-art machinery and digital management systems</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <Award className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Trusted Partner</h3>
                <p className="opacity-90">15+ years of experience serving farmers and distributors</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Factory className="h-8 w-8 text-blue-400 mr-3" />
              <span className="text-2xl font-bold">M/s Surya Industries</span>
            </div>
            <p className="text-gray-400 mb-6">
              Committed to excellence in rice processing and agricultural innovation
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              <span>© 2025 Surya Industries</span>
              <span>•</span>
              <span>All Rights Reserved</span>
              <span>•</span>
              <span>RABI 2024-25</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;