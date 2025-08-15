import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { brightLightTheme, brightDarkTheme } from '../utils/syntaxThemes';

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  bodyType: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
  className?: string;
}

export default function BodyEditor({ value, onChange, bodyType, className = '' }: BodyEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Validate content based on body type
  useEffect(() => {
    if (!value.trim()) {
      setIsValid(true);
      return;
    }

    if (bodyType === 'json') {
      try {
        JSON.parse(value);
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    } else {
      setIsValid(true);
    }
  }, [value, bodyType]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const formatContent = () => {
    if (!value.trim()) return;
    
    if (bodyType === 'json') {
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        onChange(formatted);
      } catch {
        // If invalid JSON, don't format
      }
    } else if (bodyType === 'x-www-form-urlencoded' || bodyType === 'form-data') {
      // Format URL encoded data
      try {
        const params = new URLSearchParams(value);
        const formatted = Array.from(params.entries())
          .map(([key, val]) => `${key}=${val}`)
          .join('\n');
        onChange(formatted);
      } catch {
        // If invalid, don't format
      }
    }
  };

  const minifyContent = () => {
    if (!value.trim()) return;
    
    if (bodyType === 'json') {
      try {
        const parsed = JSON.parse(value);
        const minified = JSON.stringify(parsed);
        onChange(minified);
      } catch {
        // If invalid JSON, don't minify
      }
    } else if (bodyType === 'x-www-form-urlencoded' || bodyType === 'form-data') {
      // Minify URL encoded data
      const minified = value.replace(/\n/g, '&').replace(/\s+/g, '');
      onChange(minified);
    }
  };

  const getLanguage = () => {
    switch (bodyType) {
      case 'json':
        return 'json';
      case 'form-data':
      case 'x-www-form-urlencoded':
        return 'properties'; // For key=value pairs
      case 'raw':
        // Try to detect language from content
        if (value.trim().startsWith('<?xml') || value.trim().startsWith('<')) {
          return 'xml';
        }
        if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
          return 'json';
        }
        return 'text';
      default:
        return 'text';
    }
  };

  const getPlaceholder = () => {
    switch (bodyType) {
      case 'json':
        return '{\n  "key": "value"\n}';
      case 'form-data':
        return 'key1=value1\nkey2=value2';
      case 'x-www-form-urlencoded':
        return 'key1=value1&key2=value2';
      case 'raw':
        return 'Raw text content...';
      case 'binary':
        return 'Binary data...';
      default:
        return 'Request body...';
    }
  };

  const shouldShowSyntaxHighlighting = () => {
    return bodyType !== 'binary' && value.trim();
  };

  const canFormat = () => {
    return (bodyType === 'json' || bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && isValid && value.trim();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
            {bodyType === 'x-www-form-urlencoded' ? 'URL Encoded' : bodyType}
          </span>
          {bodyType === 'json' && !isValid && (
            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Invalid JSON
            </span>
          )}
          {bodyType === 'json' && isValid && value.trim() && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Valid JSON
            </span>
          )}
        </div>
        
        <div className="flex gap-1">
          {canFormat() && (
            <>
              <button
                onClick={formatContent}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                title="Format content"
              >
                Format
              </button>
              <button
                onClick={minifyContent}
                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                title="Minify content"
              >
                Minify
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {shouldShowSyntaxHighlighting() ? (
          <>
            {/* Textarea for input */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              placeholder={getPlaceholder()}
              className="absolute inset-0 w-full h-full p-3 font-mono text-sm resize-none border-none outline-none bg-transparent text-transparent caret-slate-900 dark:caret-white focus:ring-2 focus:ring-cyan-500 focus:ring-inset z-10"
              style={{
                lineHeight: '1.5',
                tabSize: 2,
                color: 'transparent',
              }}
              spellCheck={false}
            />
            
            {/* Syntax highlighted display - always show */}
            <div className="absolute inset-0 overflow-auto pointer-events-none">
              <style jsx>{`
                .syntax-highlighter * {
                  color: ${isDark ? '#e2e8f0' : '#2d3748'} !important;
                }
                .syntax-highlighter .token.string {
                  color: ${isDark ? '#34d399' : '#059669'} !important;
                }
                .syntax-highlighter .token.property {
                  color: ${isDark ? '#60a5fa' : '#0369a1'} !important;
                }
                .syntax-highlighter .token.number {
                  color: ${isDark ? '#f87171' : '#dc2626'} !important;
                }
                .syntax-highlighter .token.boolean {
                  color: ${isDark ? '#a78bfa' : '#7c3aed'} !important;
                }
                .syntax-highlighter .token.null {
                  color: ${isDark ? '#9ca3af' : '#6b7280'} !important;
                }
                .syntax-highlighter .token.punctuation {
                  color: ${isDark ? '#d1d5db' : '#374151'} !important;
                }
              `}</style>
              <SyntaxHighlighter
                className="syntax-highlighter"
                language={getLanguage()}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={isDark ? brightDarkTheme : brightLightTheme as any}
                customStyle={{
                  margin: 0,
                  padding: '12px',
                  background: 'transparent',
                  fontSize: '14px',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  lineHeight: '1.5',
                  minHeight: '100%',
                  color: isDark ? '#e2e8f0 !important' : '#2d3748 !important',
                }}
                showLineNumbers={false}
                wrapLines={true}
                wrapLongLines={true}
                PreTag={({ children, ...props }) => (
                  <pre {...props} style={{ 
                    ...props.style, 
                    color: `${isDark ? '#e2e8f0' : '#2d3748'} !important`
                  }}>
                    {children}
                  </pre>
                )}
                CodeTag={({ children, ...props }) => (
                  <code {...props} style={{ 
                    ...props.style, 
                    color: `${isDark ? '#e2e8f0' : '#2d3748'} !important`
                  }}>
                    {children}
                  </code>
                )}
              >
                {value || getPlaceholder()}
              </SyntaxHighlighter>
            </div>
            
            {/* Background */}
            <div className="absolute inset-0 bg-white dark:bg-slate-800 -z-10" />

          </>
        ) : (
          /* Simple textarea for binary or when no syntax highlighting needed */
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            placeholder={getPlaceholder()}
            className={`w-full h-full p-3 font-mono text-sm resize-none border-none outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset ${
              !isValid ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800'
            } text-slate-900 dark:text-white`}
            style={{
              lineHeight: '1.5',
              tabSize: 2,
            }}
            spellCheck={false}
          />
        )}
        

      </div>
    </div>
  );
}