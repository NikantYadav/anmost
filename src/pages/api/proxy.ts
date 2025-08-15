import { NextApiRequest, NextApiResponse } from 'next';

interface ProxyRequestBody {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  bodyType?: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { method, url, headers = {}, body, bodyType }: ProxyRequestBody = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Security: Block requests to private/local networks
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname === '::1' ||
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fe80:')
    ) {
      return res.status(400).json({ error: 'Requests to private networks are not allowed' });
    }

    const startTime = Date.now();

    // Prepare request options
    // Create a clean headers object without 'host'
    const cleanHeaders: HeadersInit = { ...headers };
    if ('host' in cleanHeaders) {
      delete (cleanHeaders as Record<string, string>).host;
    }

    const requestOptions: RequestInit = {
      method,
      headers: cleanHeaders
    };

    // Handle request body based on type
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      if (bodyType === 'json') {
        try {
          // Validate JSON
          JSON.parse(body);
          requestOptions.body = body;
          requestOptions.headers = {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          };
        } catch {
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      } else if (bodyType === 'x-www-form-urlencoded') {
        requestOptions.body = body;
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      } else if (bodyType === 'form-data') {
        // For form-data, we'll need to parse the body and create FormData
        // This is a simplified implementation - in a real app you might want more sophisticated parsing
        try {
          const formData = new FormData();
          const entries = body.split('\n').filter(line => line.trim());
          entries.forEach(entry => {
            const [key, ...valueParts] = entry.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('='); // In case the value contains '='
              formData.append(decodeURIComponent(key.trim()), decodeURIComponent(value.trim()));
            }
          });
          requestOptions.body = formData;
          // Don't set Content-Type for FormData - let the browser set it with boundary
        } catch {
          return res.status(400).json({ error: 'Invalid form-data format' });
        }
      } else {
        // raw or binary
        requestOptions.body = body;
      }
    }

    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const endTime = Date.now();

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get response body
      const contentType = response.headers.get('content-type') || '';
      let responseData: string;

      try {
        if (contentType.includes('application/json')) {
          const jsonData = await response.json();
          responseData = JSON.stringify(jsonData, null, 2);
        } else if (contentType.includes('text/') || 
                   contentType.includes('application/xml') || 
                   contentType.includes('application/javascript') ||
                   contentType.includes('application/xhtml+xml')) {
          responseData = await response.text();
        } else {
          // For binary data, convert to base64 for download capability
          const buffer = await response.arrayBuffer();
          const sizeInMB = buffer.byteLength / (1024 * 1024);
          
          if (sizeInMB > 10) { // 10MB limit for base64 encoding
            responseData = `[Binary data - ${buffer.byteLength} bytes (${sizeInMB.toFixed(2)}MB)]\n\nFile too large for preview. Use download button to save the file.`;
          } else {
            const base64Data = Buffer.from(buffer).toString('base64');
            responseData = `[Binary data - ${buffer.byteLength} bytes (${sizeInMB.toFixed(2)}MB)]\n\nBase64: ${base64Data}`;
          }
        }
      } catch {
        responseData = 'Unable to parse response body';
      }

      // Calculate response size
      const responseSize = new Blob([responseData]).size;

      // Return the response data
      res.status(200).json({
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...responseHeaders,
          'x-original-url': url, // Add original URL for filename generation
        },
        data: responseData,
        time: endTime - startTime,
        size: responseSize,
        contentType: contentType,
      });
    } catch (fetchError: Error | unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout (30 seconds)');
      }
      throw fetchError;
    }

  } catch (error: Error | unknown) {
    console.error('Proxy request failed:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Request failed',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}