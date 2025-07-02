import React, { useState, useRef } from 'react';
import { Download, Upload, Database, HardDrive, RefreshCw, Trash2, AlertCircle, CheckCircle, Cloud, Link } from 'lucide-react';
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

  const openGoogleDrive = () => {
    window.open('https://drive.google.com', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Backup & Storage</h1>
            <p className="text-gray-600 mt-2">Manage your local data backup and cloud synchronization</p>
          </div>
          <button
            onClick={refreshStorageInfo}
            className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Local Storage</p>
                <p className="text-lg font-bold text-blue-700">{storageInfo.totalItems} items</p>
                <p className="text-xs text-blue-600">{formatBytes(storageInfo.storageUsed)} used</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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

        {/* Main Backup Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Local Backup Management</h3>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Backup Instructions:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Export Backup:</strong> Downloads all your data as a JSON file for safekeeping</li>
                <li>• <strong>Import Backup:</strong> Restores data from a previously exported backup file</li>
                <li>• <strong>Auto-Save:</strong> Your data is automatically saved to browser storage on every change</li>
                <li>• <strong>Cloud Sync:</strong> When Supabase is connected, data syncs automatically to the cloud</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Google Drive Integration */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Cloud className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Google Drive Integration</h3>
                  <p className="text-sm text-gray-600">Store your backups securely in the cloud</p>
                </div>
              </div>
              <button
                onClick={openGoogleDrive}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Link className="h-4 w-4 mr-2" />
                Open Google Drive
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload to Drive */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Upload Backup to Drive</h4>
                <ol className="text-xs text-blue-800 space-y-2">
                  <li>1. Click "Export Backup" above to download your data</li>
                  <li>2. Open Google Drive using the button above</li>
                  <li>3. Create a folder named "Surya Industries Backups"</li>
                  <li>4. Upload the downloaded JSON file to this folder</li>
                  <li>5. Rename the file with today's date for easy identification</li>
                </ol>
              </div>

              {/* Download from Drive */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-sm font-medium text-green-900 mb-3">Restore from Drive</h4>
                <ol className="text-xs text-green-800 space-y-2">
                  <li>1. Open Google Drive and navigate to your backup folder</li>
                  <li>2. Download the backup file you want to restore</li>
                  <li>3. Click "Import Backup" above and select the downloaded file</li>
                  <li>4. Wait for the import process to complete</li>
                  <li>5. Refresh the page to see your restored data</li>
                </ol>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Benefits of Cloud Backup:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-xs text-gray-700">Access from anywhere</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-xs text-gray-700">Automatic sync across devices</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-xs text-gray-700">Protection against data loss</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataBackupManager;