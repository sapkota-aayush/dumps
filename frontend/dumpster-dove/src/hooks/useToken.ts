import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const TOKEN_KEY = 'dumps_user_token';

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        // Check if token exists in localStorage
        const existingToken = localStorage.getItem(TOKEN_KEY);
        
        if (existingToken) {
          setToken(existingToken);
        } else {
          // Generate new token
          const tokenResponse = await apiService.generateToken();
          localStorage.setItem(TOKEN_KEY, tokenResponse.token);
          setToken(tokenResponse.token);
        }
      } catch (error) {
        console.error('Failed to initialize token:', error);
        // Try to generate a fallback token
        const fallbackToken = `fallback-${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, fallbackToken);
        setToken(fallbackToken);
      } finally {
        setLoading(false);
      }
    };

    initializeToken();
  }, []);

  const refreshToken = async () => {
    try {
      const tokenResponse = await apiService.generateToken();
      localStorage.setItem(TOKEN_KEY, tokenResponse.token);
      setToken(tokenResponse.token);
      return tokenResponse.token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  };

  return { token, loading, refreshToken };
};
