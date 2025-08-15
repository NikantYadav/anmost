import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: string;
  bodyType: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
}

interface Collection {
  id: string;
  name: string;
  requests: Request[];
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const { apiCall, loading, error } = useApi();

  const fetchCollections = useCallback(async () => {
    try {
      const data = await apiCall<Collection[]>('/api/collections');
      setCollections(data);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  }, [apiCall]);

  const createCollection = useCallback(async (name: string, requests: Omit<Request, 'id'>[] = []) => {
    try {
      const newCollection = await apiCall<Collection>('/api/collections', {
        method: 'POST',
        body: { name, requests }
      });
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (err) {
      console.error('Failed to create collection:', err);
      throw err;
    }
  }, [apiCall]);

  const updateCollection = useCallback(async (id: string, name: string, requests: Omit<Request, 'id'>[]) => {
    try {
      const updatedCollection = await apiCall<Collection>(`/api/collections/${id}`, {
        method: 'PUT',
        body: { name, requests }
      });
      setCollections(prev => prev.map(c => c.id === id ? updatedCollection : c));
      return updatedCollection;
    } catch (err) {
      console.error('Failed to update collection:', err);
      throw err;
    }
  }, [apiCall]);

  const deleteCollection = useCallback(async (id: string) => {
    try {
      await apiCall(`/api/collections/${id}`, { method: 'DELETE' });
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete collection:', err);
      throw err;
    }
  }, [apiCall]);

  const saveRequest = useCallback(async (requestName: string, collectionName: string, request: Omit<Request, 'id' | 'name'>) => {
    try {
      let collection = collections.find(c => c.name === collectionName);
      
      if (!collection) {
        // Create new collection with the request
        collection = await createCollection(collectionName, [{ ...request, name: requestName }]);
      } else {
        // Check if request name already exists in this collection
        const existingRequest = collection.requests.find(r => r.name === requestName);
        if (existingRequest) {
          throw new Error(`Request "${requestName}" already exists in collection "${collectionName}"`);
        }
        
        // Add request to existing collection
        const updatedRequests = [...collection.requests.map(r => ({ ...r, id: undefined })), { ...request, name: requestName }];
        await updateCollection(collection.id, collection.name, updatedRequests);
      }
    } catch (err) {
      console.error('Failed to save request:', err);
      throw err;
    }
  }, [collections, createCollection, updateCollection]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    setCollections, // Export this function so ClientInterface can use it
    loading,
    error,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    saveRequest
  };
}