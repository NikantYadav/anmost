import React, { useState, useEffect, useCallback } from 'react';
import CodeGenerator from './CodeGenerator';
import { useApi } from '../hooks/useApi';
import { validateUrl } from '../utils/validation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { brightLightTheme, brightDarkTheme } from '../utils/syntaxThemes';
import BodyEditor from './BodyEditor';
import { detectMimeType, generateFilename, createDownloadBlob, downloadBlob, getMimeTypeIcon } from '../utils/mimeTypes';

interface LandingPageProps {
  onSignIn: () => void;
}

interface BasicRequest {
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: string;
  bodyType: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
  contentType?: string;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
const BODY_TYPES = ['json', 'form-data', 'x-www-form-urlencoded' , 'raw', 'binary'] as const;

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const { proxyRequest } = useApi();
  
  const [currentRequest, setCurrentRequest] = useState<BasicRequest>({
    method: 'GET',
    url: '',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    body: '',
    bodyType: 'json'
  });

  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [activeRequestTab, setActiveRequestTab] = useState<'headers' | 'body'>('headers');
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
  const [bodyFormat, setBodyFormat] = useState<'pretty' | 'raw' | 'rendered'>('pretty');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
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

  const handleSend = async () => {
    setLoading(true);
    setError('');
    setUrlError('');
    setResponse(null);

    try {
      // Validate URL before processing
      const urlValidation = validateUrl(currentRequest.url);
      if (!urlValidation.canBeUsed) {
        setUrlError(urlValidation.error || 'Invalid URL');
        setLoading(false);
        return;
      }

      // Use corrected URL if available
      const validatedUrl = urlValidation.correctedUrl || currentRequest.url;

      const processedHeaders: Record<string, string> = {};
      currentRequest.headers.forEach(header => {
        if (header.enabled && header.key && header.value) {
          processedHeaders[header.key] = header.value;
        }
      });

      let processedBody: string | undefined;
      if (['POST', 'PUT', 'PATCH'].includes(currentRequest.method)) {
        processedBody = currentRequest.body;
      }

      // Use the proxy request instead of direct fetch
      const responseObj = await proxyRequest({
        method: currentRequest.method,
        url: validatedUrl,
        headers: processedHeaders,
        body: processedBody,
        bodyType: currentRequest.bodyType,
      });

      setResponse(responseObj);

    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const addHeader = () => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '', enabled: true }]
    }));
  };

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) =>
        i === index ? { ...header, [field]: value } : header
      )
    }));
  };

  const removeHeader = (index: number) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  // Handle URL input with validation
  const handleUrlChange = (value: string) => {
    setCurrentRequest(prev => ({ ...prev, url: value }));
    setUrlError('');
    
    // Real-time validation feedback (only show errors for non-empty URLs)
    if (value.trim()) {
      const validation = validateUrl(value);
      if (!validation.canBeUsed) {
        setUrlError(validation.error || 'Invalid URL');
      }
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (status >= 400) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
  };

  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  // Wrap in useCallback to avoid recreation on each render
  const isJsonResponse = useCallback(() => {
    if (!response) return false;
    try {
      JSON.parse(response.data);
      return true;
    } catch {
      return false;
    }
  }, [response]);

  const isHtmlResponse = () => {
    if (!response) return false;
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    return contentType.toLowerCase().includes('text/html') || 
           response.data.trim().toLowerCase().startsWith('<!doctype html') ||
           response.data.trim().toLowerCase().startsWith('<html');
  };

  const isXmlResponse = () => {
    if (!response) return false;
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    return contentType.toLowerCase().includes('xml') || 
           response.data.trim().startsWith('<?xml');
  };

  const detectLanguage = () => {
    if (!response) return 'text';
    
    // Check if it's XML
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // MIME type detection and download functionality
  const getMimeTypeInfo = () => {
    if (!response) return null;
    const contentType = response.contentType || 
      Object.entries(response.headers).find(
        ([key]) => key.toLowerCase() === 'content-type'
      )?.[1] || '';
    
    return detectMimeType(contentType);
  };

  const handleDownload = () => {
    if (!response) return;
    const mimeInfo = getMimeTypeInfo();
    if (!mimeInfo) return;
    
    const filename = generateFilename(response.headers['x-original-url'] || currentRequest.url || 'download', mimeInfo);
    const blob = createDownloadBlob(response.data, mimeInfo);
    downloadBlob(blob, filename);
  };

  const isDownloadable = () => {
    const mimeInfo = getMimeTypeInfo();
    if (!mimeInfo || !response) return false;
    
    return mimeInfo.isDownloadable && (
      mimeInfo.category === 'document' || 
      mimeInfo.category === 'image' || 
      mimeInfo.category === 'video' || 
      mimeInfo.category === 'audio' || 
      mimeInfo.category === 'archive' ||
      (mimeInfo.category === 'binary' && response.data.includes('Base64: '))
    );
  };

  // Auto-detect content type and set appropriate default format
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-cyan-950 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="heading-xl">
                ANMOST
              </h1>
            </div>
            <p className="body-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-balance">
              REST API client that works right in the browser.
            </p>
          </div>
        </div>
      </div>

      {/* API Testing Interface */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-4">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="heading-lg text-white">API Testing</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCodeGenerator(true)}
                  disabled={!currentRequest.url}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:text-white/50 text-white rounded-lg button-text transition-colors"
                >
                  Generate Code
                </button>
                <button
                  onClick={onSignIn}
                  className="px-6 py-2 bg-white text-cyan-600 hover:bg-cyan-50 rounded-lg button-text transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* URL Bar */}
            <div className="flex gap-3 mb-8">
              <select
                value={currentRequest.method}
                onChange={(e) => setCurrentRequest(prev => ({ ...prev, method: e.target.value }))}
                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white code focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {HTTP_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={currentRequest.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={(e) => {
                    // Auto-correct URL on blur if possible
                    const validation = validateUrl(e.target.value);
                    if (validation.correctedUrl) {
                      setCurrentRequest(prev => ({ ...prev, url: validation.correctedUrl! }));
                      setUrlError('');
                    }
                  }}
                  placeholder="https://jsonplaceholder.typicode.com/posts/1"
                  className={`w-full px-4 py-3 pr-10 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent ${
                    urlError 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-cyan-500'
                  }`}
                />
                {/* URL validation indicator */}
                {currentRequest.url && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {(() => {
                      const validation = validateUrl(currentRequest.url);
                      if (urlError || !validation.canBeUsed) {
                        return (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                      } else if (validation.isValid) {
                        return (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                      } else if (validation.correctedUrl) {
                        return (
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
                {urlError && (
                  <div className="absolute top-full left-0 mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {urlError}
                  </div>
                )}
                {!urlError && currentRequest.url && validateUrl(currentRequest.url).correctedUrl && (
                  <div className="absolute top-full left-0 mt-1 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Will be auto-corrected to: {validateUrl(currentRequest.url).correctedUrl}
                  </div>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={loading || !currentRequest.url || !!urlError}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg button-text transition-all shadow-lg shadow-cyan-500/25 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </span>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              {/* Request Configuration */}
              <div className="space-y-4">
                <h3 className="heading-md text-slate-900 dark:text-white">Request Configuration</h3>

                {/* Request Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                  {(['headers', 'body'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveRequestTab(tab)}
                      className={`px-4 py-2 capitalize button-text ${activeRequestTab === tab
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Headers Tab */}
                {activeRequestTab === 'headers' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="heading-sm text-slate-900 dark:text-white">Headers</h4>
                      <button
                        onClick={addHeader}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm button-text"
                      >
                        Add Header
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentRequest.headers.map((header, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={header.enabled}
                            onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <input
                            type="text"
                            value={header.key}
                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                            placeholder="Header name"
                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                            placeholder="Header value"
                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => removeHeader(index)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Tab */}
                {activeRequestTab === 'body' && ['POST', 'PUT', 'PATCH'].includes(currentRequest.method) && (
                  <div className="space-y-3">
                    <h4 className="heading-sm text-slate-900 dark:text-white">Request Body</h4>
                    <div className="flex gap-2 mb-3">
                      {BODY_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setCurrentRequest(prev => ({ ...prev, bodyType: type }))}
                          className={`px-3 py-1 rounded text-sm button-text ${currentRequest.bodyType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="border border-slate-300 dark:border-slate-600 rounded overflow-hidden h-32">
                      <BodyEditor
                        value={currentRequest.body}
                        onChange={(value) => setCurrentRequest(prev => ({ ...prev, body: value }))}
                        bodyType={currentRequest.bodyType}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Response Section */}
              <div className="space-y-4 flex flex-col h-full min-w-0">
                <h3 className="heading-md text-slate-900 dark:text-white">Response</h3>

                {error && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                {response && (
                  <div className="space-y-3 flex flex-col flex-grow">
                    {/* Response Status Bar */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded font-medium ${getStatusColor(response.status)}`}>
                          {response.status} {response.statusText}
                        </span>
                        <span className="body-sm text-slate-600 dark:text-slate-400 code">
                          {response.time}ms
                        </span>
                        <span className="body-sm text-slate-600 dark:text-slate-400 code">
                          {(response.size / 1024).toFixed(2)}KB
                        </span>
                        {/* MIME Type Info */}
                        {(() => {
                          const mimeInfo = getMimeTypeInfo();
                          return mimeInfo ? (
                            <div className="flex items-center gap-2 body-sm text-slate-600 dark:text-slate-400">
                              <span>{getMimeTypeIcon(mimeInfo.category)}</span>
                              <span title={mimeInfo.type}>{mimeInfo.description}</span>
                            </div>
                          ) : null;
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
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                      {(['body', 'headers'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveResponseTab(tab)}
                          className={`px-4 py-2 capitalize ${
                            activeResponseTab === tab
                              ? 'border-b-2 border-blue-500 text-blue-600'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {tab}
                          {tab === 'headers' && (
                            <span className="ml-2 px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 rounded">
                              {Object.keys(response.headers).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Response Content */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      {activeResponseTab === 'body' && (
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
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                              className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          {/* Response Body - Fixed height with internal scrolling */}
                          <div className="flex-1 min-h-0 border rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden"
                               style={{ minHeight: '300px' }}>
                            {bodyFormat === 'rendered' && isHtmlResponse() ? (
                              <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900">
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200 flex-shrink-0">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
                              <div className="h-full bg-slate-100 dark:bg-slate-900">
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
                              <div className="h-full bg-slate-100 dark:bg-slate-900">
                                <pre className="h-full p-4 overflow-auto text-sm code whitespace-pre-wrap break-words overflow-wrap-anywhere bg-transparent">
                                  <code 
                                    className="text-slate-800 dark:text-slate-200 block bg-transparent"
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

                      {activeResponseTab === 'headers' && (
                        <div className="flex flex-col h-full">
                          {/* Headers Search */}
                          <div className="mb-3 flex-shrink-0">
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search headers..."
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          {/* Headers List */}
                          <div className="flex-1 min-h-0 overflow-auto border rounded bg-slate-100 dark:bg-slate-900 p-2">
                            {Object.entries(response.headers).filter(([key, value]) =>
                              key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              value.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length === 0 ? (
                              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                                No headers match your search
                              </div>
                            ) : (
                              Object.entries(response.headers).filter(([key, value]) =>
                                key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                value.toLowerCase().includes(searchTerm.toLowerCase())
                              ).map(([key, value]) => (
                                <div key={key} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded mb-2">
                                  <div className="font-medium text-slate-700 dark:text-slate-300 min-w-0 flex-shrink-0">
                                    <span 
                                      dangerouslySetInnerHTML={{
                                        __html: highlightSearchTerm(key, searchTerm)
                                      }}
                                    />
                                    :
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-400 min-w-0 flex-1 break-all overflow-wrap-anywhere">
                                    <span 
                                      style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                                      dangerouslySetInnerHTML={{
                                        __html: highlightSearchTerm(value, searchTerm)
                                      }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(`${key}: ${value}`)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0"
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
                    </div>
                  </div> 
                )}

                {!response && !error && !loading && (
                  <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>Send a request to see the response</p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400">Sending request...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Code Generator Modal */}
      {showCodeGenerator && (
        <CodeGenerator
          request={currentRequest}
          onClose={() => setShowCodeGenerator(false)}
        />
      )}
    </div>
  );
}