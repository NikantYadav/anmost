// No need for CSSProperties import as we're using any for now

// We need to use any here because react-syntax-highlighter's style prop requires a complex type
// that is not easily representable in TypeScript without using any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SyntaxThemeType = any;

// Helper function to ensure type safety as much as possible
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertThemeStyles = (theme: Record<string, any>): SyntaxThemeType => {
  // For now we just pass through the theme object
  // In the future, we can add validation if needed
  return theme;
};
