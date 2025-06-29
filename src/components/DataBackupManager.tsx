import React, { useState, useRef } from 'react';
import { Download, Upload, Database, HardDrive, RefreshCw, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { exportAllData, importAllData, clearAllLocalData, getStorageInfo } from '../utils/dataStorage';

interface DataBackupManagerProps {
  onDataImported?: () => void;
}

const DataBackupManager: React.FC<DataBackupManagerProps> = ({ onDataImported }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());

  const handleExport = () => {
    try {
      exportAllData();
      setImportStatus('success');
      setImportMessage('Data exported successfully!');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Failed to export data');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('idle');

    try {
      await importAllData(file);
      setImportStatus('success');
      setImportMessage('Data imported successfully!');
      setStorageInfo(getStorageInfo());
      onDataImported?.();
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Failed to import data. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setImportStatus('idle'), 5000);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      clearAllLocalData();
      setStorageInfo(getStorageInfo());
      setImportStatus('success');
      setImportMessage('All local data cleared successfully!');
      onDataImported?.();
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const refreshStorageInfo = () => {
    setStorageInfo(getStorageInfo());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Data Backup & Storage</h3>
          <p className="text-sm text-gray-600 mt-1">Manage your local data backup and cloud synchronization</p>
        </div>
        <button
          onClick={refreshStorageInfo}
          className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      {/* Status Message */}
      {importStatus !== 'idle' && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          importStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importStatus === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          {importMessage}
        </div>
      )}

      {/* Storage Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <HardDrive className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-900">Local Storage</p>
              <p className="text-lg font-bold text-blue-700">{storageInfo.totalItems} items</p>
              <p className="text-xs text-blue-600">{formatBytes(storageInfo.storageUsed)} used</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-900">Last Sync</p>
              <p className="text-sm font-bold text-green-700">
                {storageInfo.lastSync ? storageInfo.lastSync.toLocaleDateString() : 'Never'}
              </p>
              <p className="text-xs text-green-600">
                {storageInfo.lastSync ? storageInfo.lastSync.toLocaleTimeString() : 'No data saved'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <RefreshCw className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-900">Auto Backup</p>
              <p className="text-sm font-bold text-purple-700">Enabled</p>
              <p className="text-xs text-purple-600">Saves on every change</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Backup
        </button>

        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Backup'}
          </button>
        </div>

        <button
          onClick={handleClearData}
          className="inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Data
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Backup Instructions:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Export Backup:</strong> Downloads all your data as a JSON file for safekeeping</li>
          <li>• <strong>Import Backup:</strong> Restores data from a previously exported backup file</li>
          <li>• <strong>Auto-Save:</strong> Your data is automatically saved to browser storage on every change</li>
          <li>• <strong>Cloud Sync:</strong> When Supabase is connected, data syncs automatically to the cloud</li>
        </ul>
      </div>
    </div>
  );
};

export default DataBackupManager;