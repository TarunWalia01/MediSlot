import { createContext, useContext, useEffect, useState } from 'react';
import {
  AUTH_TOKEN_KEY,
  getCurrentUser,
  loginAccount,
  registerAccount
} from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getCurrentUser();

        if (isMounted) {
          setUser(result.user);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
        } else if (isMounted) {
          setAuthError(error.response?.data?.message || 'Unable to restore the signed-in user.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(credentials) {
    const result = await loginAccount(credentials);
    sessionStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setUser(result.user);
    setAuthError('');
    return result.user;
  }

  async function register(accountDetails) {
    return registerAccount(accountDetails);
  }

  function logout() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setAuthError('');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        authError,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}
