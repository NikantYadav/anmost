// MIME type detection and handling utilities

export interface MimeTypeInfo {
  type: string;
  category: 'text' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'binary';
  isDownloadable: boolean;
  extension?: string;
  description: string;
}

// Common MIME types and their categories
const MIME_TYPE_MAP: Record<string, MimeTypeInfo> = {
  // Text types
  'text/plain': { type: 'text/plain', category: 'text', isDownloadable: true, extension: 'txt', description: 'Plain Text' },
  'text/html': { type: 'text/html', category: 'text', isDownloadable: true, extension: 'html', description: 'HTML Document' },
  'text/css': { type: 'text/css', category: 'text', isDownloadable: true, extension: 'css', description: 'CSS Stylesheet' },
  'text/javascript': { type: 'text/javascript', category: 'text', isDownloadable: true, extension: 'js', description: 'JavaScript' },
  'text/xml': { type: 'text/xml', category: 'text', isDownloadable: true, extension: 'xml', description: 'XML Document' },
  'text/csv': { type: 'text/csv', category: 'text', isDownloadable: true, extension: 'csv', description: 'CSV File' },
  
  // JSON
  'application/json': { type: 'application/json', category: 'text', isDownloadable: true, extension: 'json', description: 'JSON Data' },
  'application/ld+json': { type: 'application/ld+json', category: 'text', isDownloadable: true, extension: 'json', description: 'JSON-LD' },
  
  // XML variants
  'application/xml': { type: 'application/xml', category: 'text', isDownloadable: true, extension: 'xml', description: 'XML Document' },
  'application/xhtml+xml': { type: 'application/xhtml+xml', category: 'text', isDownloadable: true, extension: 'xhtml', description: 'XHTML Document' },
  
  // Documents
  'application/pdf': { type: 'application/pdf', category: 'document', isDownloadable: true, extension: 'pdf', description: 'PDF Document' },
  'application/msword': { type: 'application/msword', category: 'document', isDownloadable: true, extension: 'doc', description: 'Microsoft Word Document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', isDownloadable: true, extension: 'docx', description: 'Microsoft Word Document (DOCX)' },
  'application/vnd.ms-excel': { type: 'application/vnd.ms-excel', category: 'document', isDownloadable: true, extension: 'xls', description: 'Microsoft Excel Spreadsheet' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'document', isDownloadable: true, extension: 'xlsx', description: 'Microsoft Excel Spreadsheet (XLSX)' },
  'application/vnd.ms-powerpoint': { type: 'application/vnd.ms-powerpoint', category: 'document', isDownloadable: true, extension: 'ppt', description: 'Microsoft PowerPoint Presentation' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'document', isDownloadable: true, extension: 'pptx', description: 'Microsoft PowerPoint Presentation (PPTX)' },
  'application/rtf': { type: 'application/rtf', category: 'document', isDownloadable: true, extension: 'rtf', description: 'Rich Text Format' },
  
  // Images
  'image/jpeg': { type: 'image/jpeg', category: 'image', isDownloadable: true, extension: 'jpg', description: 'JPEG Image' },
  'image/jpg': { type: 'image/jpg', category: 'image', isDownloadable: true, extension: 'jpg', description: 'JPEG Image' },
  'image/png': { type: 'image/png', category: 'image', isDownloadable: true, extension: 'png', description: 'PNG Image' },
  'image/gif': { type: 'image/gif', category: 'image', isDownloadable: true, extension: 'gif', description: 'GIF Image' },
  'image/webp': { type: 'image/webp', category: 'image', isDownloadable: true, extension: 'webp', description: 'WebP Image' },
  'image/svg+xml': { type: 'image/svg+xml', category: 'image', isDownloadable: true, extension: 'svg', description: 'SVG Vector Image' },
  'image/bmp': { type: 'image/bmp', category: 'image', isDownloadable: true, extension: 'bmp', description: 'Bitmap Image' },
  'image/tiff': { type: 'image/tiff', category: 'image', isDownloadable: true, extension: 'tiff', description: 'TIFF Image' },
  
  // Audio
  'audio/mpeg': { type: 'audio/mpeg', category: 'audio', isDownloadable: true, extension: 'mp3', description: 'MP3 Audio' },
  'audio/wav': { type: 'audio/wav', category: 'audio', isDownloadable: true, extension: 'wav', description: 'WAV Audio' },
  'audio/ogg': { type: 'audio/ogg', category: 'audio', isDownloadable: true, extension: 'ogg', description: 'OGG Audio' },
  'audio/mp4': { type: 'audio/mp4', category: 'audio', isDownloadable: true, extension: 'm4a', description: 'MP4 Audio' },
  
  // Video
  'video/mp4': { type: 'video/mp4', category: 'video', isDownloadable: true, extension: 'mp4', description: 'MP4 Video' },
  'video/mpeg': { type: 'video/mpeg', category: 'video', isDownloadable: true, extension: 'mpeg', description: 'MPEG Video' },
  'video/quicktime': { type: 'video/quicktime', category: 'video', isDownloadable: true, extension: 'mov', description: 'QuickTime Video' },
  'video/x-msvideo': { type: 'video/x-msvideo', category: 'video', isDownloadable: true, extension: 'avi', description: 'AVI Video' },
  'video/webm': { type: 'video/webm', category: 'video', isDownloadable: true, extension: 'webm', description: 'WebM Video' },
  
  // Archives
  'application/zip': { type: 'application/zip', category: 'archive', isDownloadable: true, extension: 'zip', description: 'ZIP Archive' },
  'application/x-rar-compressed': { type: 'application/x-rar-compressed', category: 'archive', isDownloadable: true, extension: 'rar', description: 'RAR Archive' },
  'application/x-tar': { type: 'application/x-tar', category: 'archive', isDownloadable: true, extension: 'tar', description: 'TAR Archive' },
  'application/gzip': { type: 'application/gzip', category: 'archive', isDownloadable: true, extension: 'gz', description: 'GZIP Archive' },
  'application/x-7z-compressed': { type: 'application/x-7z-compressed', category: 'archive', isDownloadable: true, extension: '7z', description: '7-Zip Archive' },
  
  // Binary/Other
  'application/octet-stream': { type: 'application/octet-stream', category: 'binary', isDownloadable: true, extension: 'bin', description: 'Binary File' },
  'application/x-executable': { type: 'application/x-executable', category: 'binary', isDownloadable: true, extension: 'exe', description: 'Executable File' },
};

/**
 * Detect MIME type information from Content-Type header
 */
export function detectMimeType(contentType: string): MimeTypeInfo {
  if (!contentType) {
    return {
      type: 'unknown',
      category: 'binary',
      isDownloadable: false,
      description: 'Unknown Content Type'
    };
  }

  // Clean up content type (remove charset, boundary, etc.)
  const cleanContentType = contentType.split(';')[0].trim().toLowerCase();
  
  // Check exact match first
  if (MIME_TYPE_MAP[cleanContentType]) {
    return MIME_TYPE_MAP[cleanContentType];
  }
  
  // Check for partial matches
  for (const [mimeType, info] of Object.entries(MIME_TYPE_MAP)) {
    if (cleanContentType.includes(mimeType) || mimeType.includes(cleanContentType)) {
      return info;
    }
  }
  
  // Fallback based on main type
  const mainType = cleanContentType.split('/')[0];
  switch (mainType) {
    case 'text':
      return {
        type: cleanContentType,
        category: 'text',
        isDownloadable: true,
        extension: 'txt',
        description: 'Text File'
      };
    case 'image':
      return {
        type: cleanContentType,
        category: 'image',
        isDownloadable: true,
        description: 'Image File'
      };
    case 'audio':
      return {
        type: cleanContentType,
        category: 'audio',
        isDownloadable: true,
        description: 'Audio File'
      };
    case 'video':
      return {
        type: cleanContentType,
        category: 'video',
        isDownloadable: true,
        description: 'Video File'
      };
    case 'application':
      return {
        type: cleanContentType,
        category: 'document',
        isDownloadable: true,
        description: 'Application File'
      };
    default:
      return {
        type: cleanContentType,
        category: 'binary',
        isDownloadable: true,
        description: 'Binary File'
      };
  }
}

/**
 * Generate a filename for download based on URL and MIME type
 */
export function generateFilename(url: string, mimeInfo: MimeTypeInfo): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract filename from URL
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment && lastSegment.includes('.')) {
      return lastSegment;
    }
    
    // Generate filename based on URL and MIME type
    const baseName = lastSegment || 'download';
    const extension = mimeInfo.extension || 'bin';
    
    return `${baseName}.${extension}`;
  } catch {
    // Fallback filename
    const extension = mimeInfo.extension || 'bin';
    return `download.${extension}`;
  }
}

/**
 * Create a download blob from response data
 */
export function createDownloadBlob(data: string, mimeInfo: MimeTypeInfo): Blob {
  // Check if data is base64 encoded binary
  if (data.includes('Base64: ')) {
    const base64Data = data.split('Base64: ')[1];
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: mimeInfo.type });
    } catch {
      // Fallback to text blob
      return new Blob([data], { type: 'text/plain' });
    }
  }
  
  // For text content, create text blob
  return new Blob([data], { type: mimeInfo.type || 'text/plain' });
}

/**
 * Trigger download of a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get icon for MIME type category
 */
export function getMimeTypeIcon(category: string): string {
  switch (category) {
    case 'text':
      return '📄';
    case 'image':
      return '🖼️';
    case 'video':
      return '🎥';
    case 'audio':
      return '🎵';
    case 'document':
      return '📋';
    case 'archive':
      return '📦';
    case 'binary':
    default:
      return '📁';
  }
}