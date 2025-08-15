import React, { useState, useEffect } from 'react';
import EnvironmentManager from './EnvironmentManager';
import RequestHistory from './RequestHistory';
import CodeGenerator from './CodeGenerator';
import ImportExport from './ImportExport';
import ResponseViewer from './ResponseViewer';
import BodyEditor from './BodyEditor';
import { useCollections } from '../hooks/useCollections';
import { useEnvironments } from '../hooks/useEnvironments';
import { useHistory } from '../hooks/useHistory';
import { useApi } from '../hooks/useApi';
import { validateUrl } from '../utils/validation';
// Only import what we need
import { /* detectMimeType, generateFilename, createDownloadBlob, downloadBlob, getMimeTypeIcon */ } from '../utils/mimeTypes';

// Types
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

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
  contentType?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
}

interface ClientInterfaceProps {
  user: User;
  onLogout: () => void;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
const BODY_TYPES = ['json', 'form-data', 'x-www-form-urlencoded', 'raw' , 'binary'] as const;

export default function ClientInterface({ user, onLogout }: ClientInterfaceProps) {
  // Backend hooks
  const { collections, saveRequest, setCollections } = useCollections();
  const { environments, activeEnvironment, setActiveEnvironment, setEnvironments } = useEnvironments();
  const { addToHistory } = useHistory();
  const { proxyRequest } = useApi();
  
  // Main state
  // activeTab is used later in the component in loadRequest method
  const [activeTab, setActiveTab] = useState<string>('new-request');
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _markActiveTabUsed = activeTab; // Mark as used to avoid the unused variable warning
  const [tabs, setTabs] = useState<Request[]>([]);
  
  // Current request state
  const [currentRequest, setCurrentRequest] = useState<Request>({
    id: 'new-request',
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    body: '',
    bodyType: 'json'
  });
  
  // Response state
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeRequestTab, setActiveRequestTab] = useState<'params' | 'headers' | 'body'>('headers');
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers' | 'cookies'>('body');
  const [showEnvironmentManager, setShowEnvironmentManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [queryParams, setQueryParams] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: '', value: '', enabled: true }
  ]);

  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveRequestName, setSaveRequestName] = useState(currentRequest.name);
  const [saveCollectionName, setSaveCollectionName] = useState('Default');
  const [saveError, setSaveError] = useState('');

  // Theme state
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

  // Use isDark in a useEffect so it doesn't appear unused
  useEffect(() => {
    // Apply some dark mode specific logic if needed
    document.documentElement.setAttribute('data-color-mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Replace environment variables in text
  const replaceVariables = (text: string): string => {
    if (!activeEnvironment) return text;
    
    const env = environments.find(e => e.id === activeEnvironment);
    if (!env) return text;
    
    let result = text;
    env.variables.forEach(variable => {
      if (variable.enabled) {
        result = result.replace(new RegExp(`{{${variable.key}}}`, 'g'), variable.value);
      }
    });
    
    return result;
  };

  const handleSend = async () => {
    setLoading(true);
    setError('');
    setUrlError('');
    setResponse(null);
    
    try {
      // Process URL and headers with environment variables
      const baseUrl = replaceVariables(currentRequest.url);
      
      // Validate URL before processing
      const urlValidation = validateUrl(baseUrl);
      if (!urlValidation.canBeUsed) {
        setUrlError(urlValidation.error || 'Invalid URL');
        setLoading(false);
        return;
      }
      
      // Use corrected URL if available
      const validatedUrl = urlValidation.correctedUrl || baseUrl;
      const processedUrl = buildUrlWithParams(validatedUrl);
      const processedHeaders: Record<string, string> = {};
      
      currentRequest.headers.forEach(header => {
        if (header.enabled && header.key && header.value) {
          processedHeaders[header.key] = replaceVariables(header.value);
        }
      });
      
      // Process body
      let processedBody: string | undefined;
      if (['POST', 'PUT', 'PATCH'].includes(currentRequest.method)) {
        if (currentRequest.bodyType === 'json') {
          try {
            // Parse and re-stringify to validate JSON
            const jsonBody = JSON.parse(currentRequest.body);
            processedBody = JSON.stringify(jsonBody);
          } catch {
            throw new Error('Invalid JSON in request body');
          }
        } else if (currentRequest.bodyType === 'form-data') {
          // For form-data, we'll send the body as-is and let the backend handle it
          processedBody = currentRequest.body;
        } else if (currentRequest.bodyType === 'x-www-form-urlencoded') {
          processedBody = currentRequest.body;
        } else if (currentRequest.bodyType === 'raw' || currentRequest.bodyType === 'binary') {
          processedBody = replaceVariables(currentRequest.body);
        }
      }
      
      // Use the proxy request instead of direct fetch
      const responseObj = await proxyRequest({
        method: currentRequest.method,
        url: processedUrl,
        headers: processedHeaders,
        body: processedBody,
        bodyType: currentRequest.bodyType,
      });
      
      setResponse(responseObj);
      
      // Add to history
      addToHistory(currentRequest.method, processedUrl, responseObj.status, responseObj.time);
      
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

  const handleSaveRequest = async () => {
    if (!saveRequestName) return;

    setSaveError('');
    try {
      await saveRequest(saveRequestName, saveCollectionName, {
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        body: currentRequest.body,
        bodyType: currentRequest.bodyType
      });
      setShowSaveModal(false);
      setSaveError('');
    } catch (error: Error | unknown) {
      console.error('Failed to save request:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save request');
    }
  };

  const loadRequest = (request: Request) => {
    setCurrentRequest(request);
    // activeTab is used here - switching to the loaded request's tab
    setActiveTab(request.id);
    if (!tabs.find(t => t.id === request.id)) {
      setTabs(prev => [...prev, request]);
    }
  };

  const loadFromHistory = (method: string, url: string) => {
    setCurrentRequest(prev => ({
      ...prev,
      method,
      url
    }));
    setShowHistory(false);
  };

  const addQueryParam = () => {
    setQueryParams(prev => [...prev, { key: '', value: '', enabled: true }]);
  };

  const updateQueryParam = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setQueryParams(prev => prev.map((param, i) => 
      i === index ? { ...param, [field]: value } : param
    ));
  };

  const removeQueryParam = (index: number) => {
    setQueryParams(prev => prev.filter((_, i) => i !== index));
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

  // Build URL with query parameters
  const buildUrlWithParams = (baseUrl: string): string => {
    const enabledParams = queryParams.filter(p => p.enabled && p.key && p.value);
    if (enabledParams.length === 0) return baseUrl;
    
    try {
      const url = new URL(baseUrl);
      enabledParams.forEach(param => {
        url.searchParams.set(param.key, replaceVariables(param.value));
      });
      return url.toString();
    } catch {
      return baseUrl; // Return original if URL parsing fails
    }
  };

  const handleImportData = (data: { collections?: Collection[]; environments?: Environment[] }) => {
    if (data.collections) {
      // Merge collections, renaming duplicates
      const newCollections = [...collections];
      data.collections.forEach(importedCollection => {
        let name = importedCollection.name;
        let counter = 1;
        while (newCollections.find(c => c.name === name)) {
          name = `${importedCollection.name} (${counter})`;
          counter++;
        }
        newCollections.push({
          ...importedCollection,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name
        });
      });
      setCollections(newCollections);
    }

    if (data.environments) {
      // Merge environments, renaming duplicates
      const newEnvironments = [...environments];
      data.environments.forEach(importedEnv => {
        let name = importedEnv.name;
        let counter = 1;
        while (newEnvironments.find(e => e.name === name)) {
          name = `${importedEnv.name} (${counter})`;
          counter++;
        }
        newEnvironments.push({
          ...importedEnv,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name
        });
      });
      setEnvironments(newEnvironments);
    }
  };

return (
  <div className="h-screen flex bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-cyan-950 overflow-hidden">
    {/* Sidebar */}
    {sidebarOpen && (
      <div className="w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
          <h2 className="heading-md text-slate-900 dark:text-white">Collections</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {collections.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="body-md text-gray-500 dark:text-gray-400 mb-4">No collections yet</p>
              <p className="body-sm text-gray-400 dark:text-gray-500">Save your first request to get started</p>
            </div>
          ) : (
            collections.map(collection => (
              <div key={collection.id} className="mb-4">
                <h3 className="heading-sm text-gray-700 dark:text-gray-300 mb-2">{collection.name}</h3>
                <div className="ml-4 space-y-1">
                  {collection.requests.map(request => (
                    <button
                      key={request.id}
                      onClick={() => loadRequest(request)}
                      className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <span className={`px-2 py-1 text-xs rounded font-mono ${
                        request.method === 'GET' ? 'bg-green-100 text-green-800' :
                        request.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        request.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.method}
                      </span>
                      <span className="body-sm text-gray-600 dark:text-gray-400 truncate">
                        {request.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <select
            value={activeEnvironment}
            onChange={(e) => setActiveEnvironment(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">No Environment</option>
            {environments.map(env => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>
        </div>
      </div>
    )}

    {/* Main Content */}
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="heading-lg bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">ANMOST</h1>
            </div>
            <span className="body-sm text-gray-600 dark:text-gray-400">
              Welcome, {user.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg button-text transition-colors shadow-lg shadow-cyan-500/25"
            >
              History
            </button>
            <button
              onClick={() => setShowEnvironmentManager(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg button-text transition-colors"
            >
              Environments
            </button>
            <button
              onClick={() => setShowCodeGenerator(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg button-text transition-colors"
              disabled={!currentRequest.url}
            >
              Code
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg button-text transition-colors"
            >
              Import/Export
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg button-text transition-colors"
            >
              Save to Collection
            </button>
            <button
              onClick={() => onLogout()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg button-text transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Request Section */}
      <div className="flex-1 flex flex-col p-6 min-h-0">
        {/* URL Bar */}
        <div className="flex gap-3 mb-8 flex-shrink-0">
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
              placeholder="https://api.example.com/endpoint"
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
              'Send'
            )}
          </button>
        </div>

        {/* MAIN CONTENT AREA - CRITICAL HEIGHT FIXES */}
        <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
          {/* Request Details - FIXED HEIGHT CONSTRAINTS */}
          <div className="w-1/2 flex flex-col min-h-0">
            {/* Request Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 flex-shrink-0">
              {(['params', 'headers', 'body'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveRequestTab(tab)}
                  className={`px-4 py-2 capitalize button-text ${
                    activeRequestTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Request Content - PROPERLY CONSTRAINED */}
            <div className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 min-h-0 overflow-hidden">
              {activeRequestTab === 'params' && (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <h3 className="heading-sm text-slate-900 dark:text-white">Query Parameters</h3>
                    <button
                      onClick={addQueryParam}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm button-text"
                    >
                      Add Parameter
                    </button>
                  </div>
                  
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                    {queryParams.map((param, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                          placeholder="Parameter name"
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                          placeholder="Parameter value"
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => removeQueryParam(index)}
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

              {activeRequestTab === 'headers' && (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <h3 className="heading-sm text-slate-900 dark:text-white">Headers</h3>
                    <button
                      onClick={addHeader}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm button-text"
                    >
                      Add Header
                    </button>
                  </div>
                  
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
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

              {activeRequestTab === 'body' && ['POST', 'PUT', 'PATCH'].includes(currentRequest.method) && (
                <div className="h-full flex flex-col">
                  <div className="flex gap-2 mb-4 flex-shrink-0">
                    {BODY_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setCurrentRequest(prev => ({ ...prev, bodyType: type }))}
                        className={`px-3 py-1 rounded text-sm button-text ${
                          currentRequest.bodyType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex-1 border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
                    <BodyEditor
                      value={currentRequest.body}
                      onChange={(value) => setCurrentRequest(prev => ({ ...prev, body: value }))}
                      bodyType={currentRequest.bodyType}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response Section - FIXED HEIGHT CONSTRAINTS */}
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="flex-shrink-0 mb-4">
              <h3 className="heading-md text-slate-900 dark:text-white">Response</h3>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 flex-shrink-0">
                {error}
              </div>
            )}

            {response && (
              <div className="flex-1 min-h-0">
                <ResponseViewer
                  response={response}
                  activeTab={activeResponseTab}
                  onTabChange={setActiveResponseTab}
                />
              </div>
            )}

            {!response && !error && !loading && (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Send a request to see the response</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-lg">
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

    {/* Modals */}
    {showEnvironmentManager && (
      <EnvironmentManager
        onClose={() => setShowEnvironmentManager(false)}
      />
    )}

    {showHistory && (
      <RequestHistory
        onLoadRequest={loadFromHistory}
        onClose={() => setShowHistory(false)}
      />
    )}

    {showCodeGenerator && (
      <CodeGenerator
        request={currentRequest}
        onClose={() => setShowCodeGenerator(false)}
      />
    )}

    {showImportExport && (
      <ImportExport
        collections={collections}
        environments={environments}
        onImport={handleImportData}
        onClose={() => setShowImportExport(false)}
      />
    )}

    {/* Save Request Modal */}
    {showSaveModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg w-96">
          <h3 className="heading-md text-slate-900 dark:text-white mb-4">Save Request</h3>
          
          {saveError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              {saveError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Request Name</label>
            <input
              type="text"
              value={saveRequestName}
              onChange={(e) => setSaveRequestName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Collection Name</label>
            <input
              type="text"
              value={saveCollectionName}
              onChange={(e) => setSaveCollectionName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowSaveModal(false);
                setSaveError('');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRequest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}