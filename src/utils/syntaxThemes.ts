// Custom bright color schemes for syntax highlighting

// Enhanced themes with fallback colors for unrecognized text
export const brightLightTheme = {
  'code[class*="language-"]': {
    color: '#2d3748 !important', // Force default text color for unrecognized content
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#2d3748 !important', // Force default text color for unrecognized content
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
    hyphens: 'none',
    padding: '12px',
    margin: 0,
    overflow: 'auto',
  },
  'string': { color: '#059669' }, // Bright green
  'property': { color: '#0369a1' }, // Bright blue
  'number': { color: '#dc2626' }, // Bright red
  'boolean': { color: '#7c3aed' }, // Bright purple
  'null': { color: '#6b7280' }, // Gray
  'punctuation': { color: '#374151' }, // Dark gray
  'operator': { color: '#374151' }, // Dark gray
  'plain': { color: '#2d3748 !important' }, // Fallback for plain text
  'token': { color: '#2d3748 !important' }, // Generic token fallback
  'text': { color: '#2d3748 !important' }, // Text fallback
  'keyword': { color: '#7c3aed' }, // Bright purple
  'function': { color: '#0369a1' }, // Bright blue
  'comment': { color: '#6b7280', fontStyle: 'italic' }, // Gray italic
  'tag': { color: '#dc2626' }, // Bright red
  'attr-name': { color: '#0369a1' }, // Bright blue
  'attr-value': { color: '#059669' }, // Bright green
  'namespace': { color: '#7c3aed' }, // Bright purple
  'prolog': { color: '#6b7280' }, // Gray
  'doctype': { color: '#6b7280' }, // Gray
  'cdata': { color: '#6b7280' }, // Gray
};

export const brightDarkTheme = {
  'code[class*="language-"]': {
    color: '#e2e8f0 !important', // Force default text color for unrecognized content
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#e2e8f0 !important', // Force default text color for unrecognized content
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
    hyphens: 'none',
    padding: '12px',
    margin: 0,
    overflow: 'auto',
  },
  'string': { color: '#34d399' }, // Bright emerald
  'property': { color: '#60a5fa' }, // Bright blue
  'number': { color: '#f87171' }, // Bright red
  'boolean': { color: '#a78bfa' }, // Bright purple
  'null': { color: '#9ca3af' }, // Light gray
  'punctuation': { color: '#d1d5db' }, // Light gray
  'operator': { color: '#d1d5db' }, // Light gray
  'plain': { color: '#e2e8f0 !important' }, // Fallback for plain text
  'token': { color: '#e2e8f0 !important' }, // Generic token fallback
  'text': { color: '#e2e8f0 !important' }, // Text fallback
  'keyword': { color: '#a78bfa' }, // Bright purple
  'function': { color: '#60a5fa' }, // Bright blue
  'comment': { color: '#9ca3af', fontStyle: 'italic' }, // Light gray italic
  'tag': { color: '#f87171' }, // Bright red
  'attr-name': { color: '#60a5fa' }, // Bright blue
  'attr-value': { color: '#34d399' }, // Bright emerald
  'namespace': { color: '#a78bfa' }, // Bright purple
  'prolog': { color: '#9ca3af' }, // Light gray
  'doctype': { color: '#9ca3af' }, // Light gray
  'cdata': { color: '#9ca3af' }, // Light gray
};