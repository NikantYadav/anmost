import React, { useState, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { brightLightTheme, brightDarkTheme } from '../utils/syntaxThemes';
import { detectMimeType, generateFilename, createDownloadBlob, downloadBlob, getMimeTypeIcon } from '../utils/mimeTypes';

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
  contentType?: string;
}

interface ResponseViewerProps {
  response: ResponseData;
  activeTab: 'body' | 'headers' | 'cookies';
  onTabChange: (tab: 'body' | 'headers' | 'cookies') => void;
}

export default function ResponseViewer({ response, activeTab, onTabChange }: ResponseViewerProps) {
  const [bodyFormat, setBodyFormat] = useState<'pretty' | 'raw' | 'rendered'>('pretty');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  const isJsonResponse = useCallback(() => {
    if (!response) return false;
    
    // First, check if it looks like JSON based on content
    if (response.data.trim().startsWith('{') || response.data.trim().startsWith('[')) {
      try {
        JSON.parse(response.data);
        return true;
      } catch {
        return false;
      }
    }
    
    // Then check content type header
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    return contentType.toLowerCase().includes('application/json');
  }, [response]);
  
  // Format response body appropriately
  useEffect(() => {
    if (!response) return;
    
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    if (contentType.toLowerCase().includes('text/html')) {
      setBodyFormat('rendered');
    } else if (contentType.toLowerCase().includes('application/json') || isJsonResponse()) {
      setBodyFormat('pretty');
    } else {
      setBodyFormat('raw');
    }
  }, [response, isJsonResponse]);

  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const isHtmlResponse = () => {
    // Use contentType from response if available, otherwise check headers
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    return contentType.toLowerCase().includes('text/html') || 
           response.data.trim().toLowerCase().startsWith('<!doctype html') ||
           response.data.trim().toLowerCase().startsWith('<html');
  };

  const isXmlResponse = () => {
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    return contentType.toLowerCase().includes('xml') || 
           response.data.trim().startsWith('<?xml');
  };

  const detectLanguage = () => {
    if (!response) return 'text';
    
    // First check for specific content types
    if (isJsonResponse()) {
      return 'json';
    }
    
    if (isXmlResponse()) {
      return 'xml';
    }
    
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    const trimmedData = response.data.trim();
    
    // Check content type first
    if (contentType.toLowerCase().includes('json')) return 'json';
    if (contentType.toLowerCase().includes('xml')) return 'xml';
    if (contentType.toLowerCase().includes('html')) return 'html';
    if (contentType.toLowerCase().includes('css')) return 'css';
    if (contentType.toLowerCase().includes('javascript')) return 'javascript';
    if (contentType.toLowerCase().includes('yaml')) return 'yaml';
    
    // Check content patterns
    if (isJsonResponse()) return 'json';
    if (trimmedData.startsWith('<?xml') || trimmedData.startsWith('<xml')) return 'xml';
    if (trimmedData.toLowerCase().startsWith('<!doctype html') || trimmedData.toLowerCase().startsWith('<html')) return 'html';
    if (trimmedData.startsWith('---') && trimmedData.includes('\n')) return 'yaml';
    
    // Default to text
    return 'text';
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

  // MIME type detection and download functionality
  const getMimeTypeInfo = () => {
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    return detectMimeType(contentType);
  };

  const handleDownload = () => {
    const mimeInfo = getMimeTypeInfo();
    const filename = generateFilename(response.headers['x-original-url'] || 'download', mimeInfo);
    const blob = createDownloadBlob(response.data, mimeInfo);
    downloadBlob(blob, filename);
  };

  const isDownloadable = () => {
    const mimeInfo = getMimeTypeInfo();
    return mimeInfo.isDownloadable && (
      mimeInfo.category === 'document' || 
      mimeInfo.category === 'image' || 
      mimeInfo.category === 'video' || 
      mimeInfo.category === 'audio' || 
      mimeInfo.category === 'archive' ||
      (mimeInfo.category === 'binary' && response.data.includes('Base64: '))
    );
  };

  return (
    <div className="h-full flex flex-col">
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
          {/* MIME Type Info */}
          {(() => {
            const mimeInfo = getMimeTypeInfo();
            return (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{getMimeTypeIcon(mimeInfo.category)}</span>
                <span title={mimeInfo.type}>{mimeInfo.description}</span>
              </div>
            );
          })()}
        </div>
        
        <div className="flex items-center gap-2">
          {isDownloadable() && (
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
              title="Download file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          )}
          <button
            onClick={() => copyToClipboard(response.data)}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Copy Response
          </button>
        </div>
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

      {/* Response Content - Flexible height container */}
      <div className="flex-1 min-h-0 overflow-hidden response-container">
        {activeTab === 'body' && (
          <div className="flex flex-col h-full">
            {/* Body Controls */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                {(detectLanguage() !== 'text' || isHtmlResponse()) && (
                  <div className="flex items-center gap-2">
                    {detectLanguage() !== 'text' && (
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
                    )}
                    {isHtmlResponse() && (
                      <button
                        onClick={() => setBodyFormat('rendered')}
                        className={`px-3 py-1 text-sm rounded ${
                          bodyFormat === 'rendered'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Rendered
                      </button>
                    )}
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

            {/* Response Body - Scrollable container */}
            <div className="flex-1 min-h-0 border rounded bg-gray-100 dark:bg-gray-900 overflow-hidden"
                 style={{ minHeight: '300px' }}>
              {bodyFormat === 'rendered' && isHtmlResponse() ? (
                <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Rendered HTML Preview - External resources may not load due to security restrictions</span>
                      </div>
                      <button
                        onClick={() => setBodyFormat('raw')}
                        className="px-2 py-1 text-xs bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700 rounded text-yellow-900 dark:text-yellow-100"
                      >
                        View Source
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 bg-white relative overflow-hidden">
                    <iframe
                      srcDoc={response.data}
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-same-origin allow-scripts"
                      title="Rendered HTML Response"
                      onError={() => {
                        console.warn('Failed to render HTML content');
                      }}
                    />
                  </div>
                </div>
              ) : bodyFormat === 'pretty' && detectLanguage() !== 'text' ? (
                <div className="h-full bg-gray-100 dark:bg-gray-900">
                  <SyntaxHighlighter
                    language={detectLanguage()}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    style={isDark ? brightDarkTheme : brightLightTheme as any}
                    customStyle={{
                      margin: 0,
                      padding: '16px',
                      background: 'transparent',
                      fontSize: '14px',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      lineHeight: '1.5',
                      height: '100%',
                      overflow: 'auto'
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                    wrapLongLines={true}
                  >
                    {detectLanguage() === 'json' ? formatJson(response.data) : response.data}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="h-full bg-gray-100 dark:bg-gray-900">
                  <pre className="h-full p-4 overflow-auto text-sm font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere bg-transparent">
                    <code 
                      className="text-gray-800 dark:text-gray-200 block bg-transparent"
                      style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerm(response.data, searchTerm)
                      }}
                    />
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="flex flex-col h-full">
            {/* Headers Search */}
            <div className="mb-3 flex-shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search headers..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Headers List */}
            <div className="flex-1 min-h-0 overflow-auto border rounded bg-gray-100 dark:bg-gray-900 p-2">
              {filteredHeaders.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No headers match your search
                </div>
              ) : (
                filteredHeaders.map(([key, value]) => (
                  <div key={key} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded mb-2">
                    <div className="font-medium text-gray-700 dark:text-gray-300 min-w-0 flex-shrink-0">
                      <span 
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(key, searchTerm)
                        }}
                      />
                      :
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 min-w-0 flex-1 break-all overflow-wrap-anywhere">
                      <span 
                        style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
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
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-auto border rounded bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <p>Cookie management coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}