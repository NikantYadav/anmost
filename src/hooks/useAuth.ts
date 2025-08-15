import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('rest-client-user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Verify token is still valid by making a request to a protected endpoint
        verifyToken(token).then((isValid) => {
          if (isValid) {
            setAuthState({
              user,
              isAuthenticated: true,
              loading: false
            });
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('rest-client-user');
            setAuthState({
              user: null,
              isAuthenticated: false,
              loading: false
            });
          }
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('rest-client-user');
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false
      });
    }
  }, []);

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleAuthSuccess = (user: User, token: string): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('rest-client-user', JSON.stringify(user));
    setAuthState({
      user,
      isAuthenticated: true,
      loading: false
    });
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('rest-client-user');
    // Also clear user-specific data
    localStorage.removeItem('rest-client-collections');
    localStorage.removeItem('rest-client-environments');
    localStorage.removeItem('rest-client-history');
    localStorage.removeItem('rest-client-active-environment');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
  };

  return {
    ...authState,
    handleAuthSuccess,
    logout
  };
}