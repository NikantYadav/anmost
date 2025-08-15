import React, { useState } from 'react';

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: string;
  bodyType: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
}

interface Collection {
  id: string;
  name: string;
  requests: Request[];
}

interface Environment {
  id: string;
  name: string;
  variables: { key: string; value: string; enabled: boolean }[];
}

interface ImportExportProps {
  collections: Collection[];
  environments: Environment[];
  onImport: (data: { collections?: Collection[]; environments?: Environment[] }) => void;
  onClose: () => void;
}

export default function ImportExport({ collections, environments, onImport, onClose }: ImportExportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importData, setImportData] = useState('');
  const [exportType, setExportType] = useState<'collections' | 'environments' | 'all'>('all');

  const handleExport = () => {
    const dataToExport: {
      collections?: Collection[];
      environments?: Environment[];
    } = {};
    
    if (exportType === 'collections' || exportType === 'all') {
      dataToExport.collections = collections;
    }
    
    if (exportType === 'environments' || exportType === 'all') {
      dataToExport.environments = environments;
    }
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rest-client-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      
      // Validate the data structure
      if (data.collections && !Array.isArray(data.collections)) {
        throw new Error('Invalid collections format');
      }
      
      if (data.environments && !Array.isArray(data.environments)) {
        throw new Error('Invalid environments format');
      }
      
      onImport(data);
      setImportData('');
      onClose();
    } catch {
      alert('Invalid JSON format. Please check your data and try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import / Export</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'export'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'import'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Import
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Export Data</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="all"
                      checked={exportType === 'all'}
                      onChange={(e) => setExportType(e.target.value as 'collections' | 'environments' | 'all')}
                      className="mr-3"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Export All (Collections + Environments)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="collections"
                      checked={exportType === 'collections'}
                      onChange={(e) => setExportType(e.target.value as 'collections' | 'environments' | 'all')}
                      className="mr-3"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Collections Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="environments"
                      checked={exportType === 'environments'}
                      onChange={(e) => setExportType(e.target.value as 'collections' | 'environments' | 'all')}
                      className="mr-3"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Environments Only</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Download JSON
                </button>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Export Summary</h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  {(exportType === 'collections' || exportType === 'all') && (
                    <div>Collections: {collections.length}</div>
                  )}
                  {(exportType === 'environments' || exportType === 'all') && (
                    <div>Environments: {environments.length}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Import Data</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload JSON File
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or Paste JSON Data
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste your JSON data here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setImportData('')}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded"
                >
                  Import
                </button>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Import Notes</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li>Importing will merge with existing data</li>
                  <li>Duplicate collections/environments will be renamed</li>
                  <li>Make sure to backup your current data before importing</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}