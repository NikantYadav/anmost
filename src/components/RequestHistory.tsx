import React, { useState } from 'react';
import { useHistory } from '../hooks/useHistory';

interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status?: number;
  timestamp: number;
  duration?: number;
}

interface RequestHistoryProps {
  onLoadRequest: (method: string, url: string) => void;
  onClose: () => void;
}

export default function RequestHistory({ onLoadRequest, onClose }: RequestHistoryProps) {
  const { history, deleteHistoryItem, clearHistory } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = !filterMethod || item.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all history?')) {
      try {
        await clearHistory();
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await deleteHistoryItem(id);
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 400) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Request History</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search URLs..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No requests in history</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => onLoadRequest(item.method, item.url)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`px-2 py-1 text-xs rounded font-mono ${getMethodColor(item.method)}`}>
                      {item.method}
                    </span>
                    
                    {item.status && (
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    )}
                    
                    <span className="text-gray-900 dark:text-white truncate flex-1 font-mono text-sm">
                      {item.url}
                    </span>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {item.duration && <span>{item.duration}ms</span>}
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistoryItem(item.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded ml-4"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

