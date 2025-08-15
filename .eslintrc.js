module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable the no-explicit-any rule for specific files
    '@typescript-eslint/no-explicit-any': ['error', {
      // Allow 'any' in the SyntaxHighlighter component style props
      ignoreRestArgs: true
    }]
  },
  overrides: [
    {
      // Apply only to syntax theme files
      files: ['**/syntaxThemeTypes.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
