import { useState, useCallback } from 'react';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...(options.body && { body: JSON.stringify(options.body) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return null as T;
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiCall, loading, error };
}