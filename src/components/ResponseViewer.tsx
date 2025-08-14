import React, { useState } from 'react';

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
}

interface ResponseViewerProps {
  response: ResponseData;
  activeTab: 'body' | 'headers' | 'cookies';
  onTabChange: (tab: 'body' | 'headers' | 'cookies') => void;
}

export default function ResponseViewer({ response, activeTab, onTabChange }: ResponseViewerProps) {
  const [bodyFormat, setBodyFormat] = useState<'pretty' | 'raw'>('pretty');
  const [searchTerm, setSearchTerm] = useState('');

  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const isJsonResponse = () => {
    try {
      JSON.parse(response.data);
      return true;
    } catch {
      return false;
    }
  };

  const highlightSearchTerm = (text: string, term: string): string => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  const filteredHeaders = Object.entries(response.headers).filter(([key, value]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (status >= 400) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Response Status Bar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded font-medium ${getStatusColor(response.status)}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {response.time}ms
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {(response.size / 1024).toFixed(2)}KB
          </span>
        </div>
        
        <button
          onClick={() => copyToClipboard(response.data)}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Copy Response
        </button>
      </div>

      {/* Response Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        {(['body', 'headers', 'cookies'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab}
            {tab === 'headers' && (
              <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
                {Object.keys(response.headers).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Response Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'body' && (
          <div className="h-full flex flex-col">
            {/* Body Controls */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {isJsonResponse() && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBodyFormat('pretty')}
                      className={`px-3 py-1 text-sm rounded ${
                        bodyFormat === 'pretty'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Pretty
                    </button>
                    <button
                      onClick={() => setBodyFormat('raw')}
                      className={`px-3 py-1 text-sm rounded ${
                        bodyFormat === 'raw'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Raw
                    </button>
                  </div>
                )}
              </div>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search in response..."
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Response Body */}
            <div className="flex-1 overflow-auto">
              <pre className="h-full p-4 bg-gray-100 dark:bg-gray-900 rounded border text-sm font-mono whitespace-pre-wrap">
                <code 
                  className="text-gray-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(
                      bodyFormat === 'pretty' && isJsonResponse() 
                        ? formatJson(response.data) 
                        : response.data,
                      searchTerm
                    )
                  }}
                />
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="h-full flex flex-col">
            {/* Headers Search */}
            <div className="mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search headers..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Headers List */}
            <div className="flex-1 overflow-auto space-y-2">
              {filteredHeaders.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No headers match your search
                </div>
              ) : (
                filteredHeaders.map(([key, value]) => (
                  <div key={key} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-medium text-gray-700 dark:text-gray-300 min-w-0 flex-shrink-0">
                      <span 
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(key, searchTerm)
                        }}
                      />
                      :
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 min-w-0 flex-1 break-all">
                      <span 
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(value, searchTerm)
                        }}
                      />
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${key}: ${value}`)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
                      title="Copy header"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <p>Cookie management coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}