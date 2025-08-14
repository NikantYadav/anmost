import React, { useState } from 'react';
import CodeGenerator from './CodeGenerator';

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
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
const BODY_TYPES = ['json', 'form-data', 'x-www-form-urlencoded', 'raw', 'binary'] as const;

export default function LandingPage({ onSignIn }: LandingPageProps) {
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
  const [activeRequestTab, setActiveRequestTab] = useState<'headers' | 'body'>('headers');
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    const startTime = Date.now();

    try {
      const processedHeaders: Record<string, string> = {};
      currentRequest.headers.forEach(header => {
        if (header.enabled && header.key && header.value) {
          processedHeaders[header.key] = header.value;
        }
      });

      let processedBody: string | FormData | undefined;
      if (['POST', 'PUT', 'PATCH'].includes(currentRequest.method)) {
        processedBody = currentRequest.body;
      }

      const res = await fetch(currentRequest.url, {
        method: currentRequest.method,
        headers: processedHeaders,
        body: processedBody,
      });

      const endTime = Date.now();
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = res.headers.get('content-type') || '';
      let responseData: string;

      if (contentType.includes('application/json')) {
        const jsonData = await res.json();
        responseData = JSON.stringify(jsonData, null, 2);
      } else {
        responseData = await res.text();
      }

      const responseSize = new Blob([responseData]).size;

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data: responseData,
        time: endTime - startTime,
        size: responseSize
      });

    } catch (err: any) {
      setError(err.message || 'Request failed');
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

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (status >= 400) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-cyan-950">
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
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* URL Bar */}
            <div className="flex gap-3 mb-6">
              <select
                value={currentRequest.method}
                onChange={(e) => setCurrentRequest(prev => ({ ...prev, method: e.target.value }))}
                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white code focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {HTTP_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>

              <input
                type="text"
                value={currentRequest.url}
                onChange={(e) => setCurrentRequest(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://jsonplaceholder.typicode.com/posts/1"
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />

              <button
                onClick={handleSend}
                disabled={loading || !currentRequest.url}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    <textarea
                      value={currentRequest.body}
                      onChange={(e) => setCurrentRequest(prev => ({ ...prev, body: e.target.value }))}
                      placeholder={currentRequest.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
                      className="w-full h-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white code text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Response Section */}
              <div className="space-y-4">
                <h3 className="heading-md text-slate-900 dark:text-white">Response</h3>

                {error && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                {response && (
                  <div className="space-y-3">
                    {/* Response Status */}
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
                      </div>
                    </div>

                    {/* Response Body */}
                    <div className="relative">
                      <pre className="h-64 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border overflow-auto text-sm code whitespace-pre-wrap">
                        <code className="text-slate-800 dark:text-slate-200">
                          {response.data}
                        </code>
                      </pre>
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