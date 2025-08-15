import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status?: number;
  timestamp: number;
  duration?: number;
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { apiCall, loading, error } = useApi();

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiCall<HistoryItem[]>('/api/history');
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [apiCall]);

  const addToHistory = useCallback(async (method: string, url: string, status?: number, duration?: number) => {
    try {
      const newHistoryItem = await apiCall<HistoryItem>('/api/history', {
        method: 'POST',
        body: { method, url, status, duration }
      });
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 99)]); // Keep only last 100 items
    } catch (err) {
      console.error('Failed to add to history:', err);
    }
  }, [apiCall]);

  const deleteHistoryItem = useCallback(async (id: string) => {
    try {
      await apiCall(`/api/history/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete history item:', err);
      throw err;
    }
  }, [apiCall]);

  const clearHistory = useCallback(async () => {
    try {
      await apiCall('/api/history', { method: 'DELETE' });
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
      throw err;
    }
  }, [apiCall]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    fetchHistory,
    addToHistory,
    deleteHistoryItem,
    clearHistory
  };
}