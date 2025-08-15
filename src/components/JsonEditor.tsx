import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { brightLightTheme, brightDarkTheme } from '../utils/syntaxThemes';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function JsonEditor({ value, onChange, placeholder = '{\n  "key": "value"\n}', className = '' }: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState('');
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

  // Validate JSON on value change
  useEffect(() => {
    if (!value.trim()) {
      setIsValid(true);
      setError('');
      return;
    }

    try {
      JSON.parse(value);
      setIsValid(true);
      setError('');
    } catch (e) {
      setIsValid(false);
      setError((e as Error).message);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const formatJson = () => {
    if (!value.trim()) return;
    
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch (e) {
      // If invalid JSON, don't format
    }
  };

  const minifyJson = () => {
    if (!value.trim()) return;
    
    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChange(minified);
    } catch (e) {
      // If invalid JSON, don't minify
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">JSON</span>
          {!isValid && (
            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Invalid JSON
            </span>
          )}
          {isValid && value.trim() && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Valid JSON
            </span>
          )}
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={formatJson}
            disabled={!isValid || !value.trim()}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
            title="Format JSON"
          >
            Format
          </button>
          <button
            onClick={minifyJson}
            disabled={!isValid || !value.trim()}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded transition-colors"
            title="Minify JSON"
          >
            Minify
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {/* Textarea for input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`absolute inset-0 w-full h-full p-3 font-mono text-sm resize-none border-none outline-none bg-transparent text-transparent caret-slate-900 dark:caret-white focus:ring-2 focus:ring-cyan-500 focus:ring-inset z-10 ${
            !isValid ? 'bg-red-50/50 dark:bg-red-900/10' : ''
          }`}
          style={{
            lineHeight: '1.5',
            tabSize: 2,
            color: 'transparent',
          }}
          spellCheck={false}
        />
        
        {/* Syntax highlighted display */}
        <div className="absolute inset-0 overflow-auto pointer-events-none">
          <SyntaxHighlighter
            language="json"
            style={isDark ? brightDarkTheme : brightLightTheme}
            customStyle={{
              margin: 0,
              padding: '12px',
              background: 'transparent',
              fontSize: '14px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              lineHeight: '1.5',
              minHeight: '100%',
            }}
            showLineNumbers={false}
            wrapLines={true}
            wrapLongLines={true}
          >
            {value || placeholder}
          </SyntaxHighlighter>
        </div>
        
        {/* Background */}
        <div className={`absolute inset-0 ${!isValid ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800'} -z-10`} />
        
        {/* Error tooltip */}
        {!isValid && error && (
          <div className="absolute bottom-2 left-2 right-2 p-2 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300 z-20">
            <strong>JSON Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}