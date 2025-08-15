import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface Environment {
  id: string;
  name: string;
  variables: { key: string; value: string; enabled: boolean }[];
}

export function useEnvironments() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<string>('');
  const { apiCall, loading, error } = useApi();

  const fetchEnvironments = useCallback(async () => {
    try {
      const data = await apiCall<Environment[]>('/api/environments');
      setEnvironments(data);
      
      // Restore active environment from localStorage
      const savedActiveEnv = localStorage.getItem('rest-client-active-environment');
      if (savedActiveEnv && data.find(env => env.id === savedActiveEnv)) {
        setActiveEnvironment(savedActiveEnv);
      }
    } catch (err) {
      console.error('Failed to fetch environments:', err);
    }
  }, [apiCall]);

  const createEnvironment = useCallback(async (name: string, variables: { key: string; value: string; enabled: boolean }[] = []) => {
    try {
      const newEnvironment = await apiCall<Environment>('/api/environments', {
        method: 'POST',
        body: { name, variables }
      });
      setEnvironments(prev => [...prev, newEnvironment]);
      return newEnvironment;
    } catch (err) {
      console.error('Failed to create environment:', err);
      throw err;
    }
  }, [apiCall]);

  const updateEnvironment = useCallback(async (id: string, name: string, variables: { key: string; value: string; enabled: boolean }[]) => {
    try {
      const updatedEnvironment = await apiCall<Environment>(`/api/environments/${id}`, {
        method: 'PUT',
        body: { name, variables }
      });
      setEnvironments(prev => prev.map(e => e.id === id ? updatedEnvironment : e));
      return updatedEnvironment;
    } catch (err) {
      console.error('Failed to update environment:', err);
      throw err;
    }
  }, [apiCall]);

  const deleteEnvironment = useCallback(async (id: string) => {
    try {
      await apiCall(`/api/environments/${id}`, { method: 'DELETE' });
      setEnvironments(prev => prev.filter(e => e.id !== id));
      if (activeEnvironment === id) {
        setActiveEnvironment('');
      }
    } catch (err) {
      console.error('Failed to delete environment:', err);
      throw err;
    }
  }, [apiCall, activeEnvironment]);

  const setActiveEnv = useCallback((envId: string) => {
    setActiveEnvironment(envId);
    localStorage.setItem('rest-client-active-environment', envId);
  }, []);

  // Create a memoized setter function that can be exposed
  const setEnvironmentsState = useCallback((newEnvironments: Environment[]) => {
    setEnvironments(newEnvironments);
  }, []);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  return {
    environments,
    activeEnvironment,
    loading,
    error,
    fetchEnvironments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment: setActiveEnv,
    setEnvironments: setEnvironmentsState
  };
}