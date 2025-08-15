export interface UrlValidationResult {
  isValid: boolean;
  canBeUsed: boolean; // Can be used after correction
  error?: string;
  correctedUrl?: string;
}

export function validateUrl(url: string): UrlValidationResult {
  if (!url.trim()) {
    return {
      isValid: false,
      canBeUsed: false,
      error: 'URL is required'
    };
  }

  const trimmedUrl = url.trim();

  // Check if URL starts with http:// or https://
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    // Try to auto-correct by adding https://
    const correctedUrl = `https://${trimmedUrl}`;
    try {
      const parsedUrl = new URL(correctedUrl);
      
      // Additional validation for the corrected URL
      if (!parsedUrl.hostname || parsedUrl.hostname.length < 2) {
        return {
          isValid: false,
          canBeUsed: false,
          error: 'Invalid hostname'
        };
      }

      // Check if hostname has at least one dot (basic domain validation)
      if (!parsedUrl.hostname.includes('.') && parsedUrl.hostname !== 'localhost') {
        return {
          isValid: false,
          canBeUsed: false,
          error: 'Invalid domain format'
        };
      }

      return {
        isValid: false, // Not valid as-is because it needs correction
        canBeUsed: true, // But can be used after correction
        correctedUrl: correctedUrl
      };
    } catch {
      return {
        isValid: false,
        canBeUsed: false,
        error: 'Invalid URL format'
      };
    }
  }

  // Validate the URL format for URLs that already have protocol
  try {
    const parsedUrl = new URL(trimmedUrl);
    
    // Ensure it's HTTP or HTTPS
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        isValid: false,
        canBeUsed: false,
        error: 'Only HTTP and HTTPS protocols are supported'
      };
    }

    // Ensure hostname is present and valid
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 2) {
      return {
        isValid: false,
        canBeUsed: false,
        error: 'Invalid hostname'
      };
    }

    // Check if hostname has at least one dot (basic domain validation)
    if (!parsedUrl.hostname.includes('.') && parsedUrl.hostname !== 'localhost') {
      return {
        isValid: false,
        canBeUsed: false,
        error: 'Invalid domain format'
      };
    }

    return {
      isValid: true,
      canBeUsed: true
    };
  } catch {
    return {
      isValid: false,
      canBeUsed: false,
      error: 'Invalid URL format'
    };
  }
}

export function formatUrl(url: string): string {
  const validation = validateUrl(url);
  if (validation.correctedUrl) {
    return validation.correctedUrl;
  }
  return url;
}