import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api.js';
import {
  abortPendingRequests,
  registerLogoutHandler,
  registerSessionExpiredToastHandler,
} from '../utils/authSession.js';
import { clearStoredToken, getStoredToken, isTokenExpired, setStoredToken, generateCsrfToken } from '../utils/jwt.js';
import { getStoredAvatar, storeAvatar, clearStoredAvatar } from '../utils/avatar.js';

const AuthContext = createContext();

const enrichUser = (user) => {
  if (!user) return null;
  const storedAvatar = getStoredAvatar(user.id);
  return {
    ...user,
    avatar_url: user.avatar_url || storedAvatar || null,
  };
};

export const AuthProvider = ({ children, onSessionExpiredToast }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearSession = useCallback(({ reason = null, redirectTo = null } = {}) => {
    abortPendingRequests();
    clearStoredToken();
    localStorage.removeItem('lastLoginEmail');
    setToken(null);
    setUser(null);
    setError(null);

    if (typeof window !== 'undefined' && redirectTo) {
      const params = new URLSearchParams();
      if (reason === 'expired') params.set('reason', 'expired');
      const query = params.toString();
      window.location.href = query ? `${redirectTo}?${query}` : redirectTo;
    }
  }, []);

  const logout = useCallback(
    ({ reason = null, redirectTo = '/auth/login' } = {}) => {
      clearSession({ reason, redirectTo });
    },
    [clearSession],
  );

  const refreshSession = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken || isTokenExpired(storedToken)) {
      clearSession({ reason: 'expired' });
      return null;
    }

    try {
      const res = await authService.getCurrentUser();
      const enriched = enrichUser(res.data.user);
      if (enriched?.avatar_url) {
        storeAvatar(enriched.id, enriched.avatar_url);
      }
      setToken(storedToken);
      setUser(enriched);
      setError(null);
      return enriched;
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return null;
      if (err.response?.status !== 401) {
        clearSession({ reason: 'expired' });
      }
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    registerLogoutHandler(clearSession);
    registerSessionExpiredToastHandler(() => {
      if (onSessionExpiredToast) onSessionExpiredToast();
    });
  }, [clearSession, onSessionExpiredToast]);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      if (isTokenExpired(storedToken)) {
        clearSession({ reason: 'expired' });
        setLoading(false);
        return;
      }

      try {
        const res = await authService.getCurrentUser();
        const enriched = enrichUser(res.data.user);
        if (enriched?.avatar_url) {
          storeAvatar(enriched.id, enriched.avatar_url);
        }
        setToken(storedToken);
        setUser(enriched);
        setError(null);
      } catch (err) {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        if (err.response?.status !== 401) {
          clearSession({ reason: 'expired' });
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [clearSession]);

  const login = async (email, password) => {
    try {
      setError(null);
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authService.login(normalizedEmail, password);
      setStoredToken(res.data.token);
      generateCsrfToken();
      localStorage.setItem('lastLoginEmail', normalizedEmail);
      const enriched = enrichUser(res.data.user);
      if (enriched?.avatar_url) {
        storeAvatar(enriched.id, enriched.avatar_url);
      }
      setToken(res.data.token);
      setUser(enriched);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const signup = async (email, password, name) => {
    try {
      setError(null);
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authService.signup(normalizedEmail, password, name);
      setStoredToken(res.data.token);
      generateCsrfToken();
      localStorage.setItem('lastLoginEmail', normalizedEmail);
      const enriched = enrichUser(res.data.user);
      setToken(res.data.token);
      setUser(enriched);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Signup failed';
      setError(message);
      throw err;
    }
  };

  const updateProfile = async (name, avatarOrOptions, options = {}) => {
    try {
      setError(null);
      const isOptionsObject = avatarOrOptions && typeof avatarOrOptions === 'object' && !(avatarOrOptions instanceof FormData);
      const avatarPayload = isOptionsObject ? undefined : avatarOrOptions;
      const profileOptions = isOptionsObject ? avatarOrOptions : options;
      const res = await authService.updateProfile(name, avatarPayload, profileOptions);
      const enriched = enrichUser(res.data.user);
      if (enriched?.avatar_url) {
        storeAvatar(enriched.id, enriched.avatar_url);
      } else if (enriched?.id) {
        clearStoredAvatar(enriched.id);
      }
      setUser(enriched);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Profile update failed';
      setError(message);
      throw err;
    }
  };

  const isAuthenticated = !!user && !loading;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoading: loading,
        isAuthenticated,
        error,
        login,
        signup,
        updateProfile,
        logout,
        clearSession,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
