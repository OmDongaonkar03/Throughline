import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const refreshTimeoutRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.verified === false) {
          logout();
          return { success: false, error: data.message, needsVerification: true };
        }
        throw new Error(data.message || 'Token refresh failed');
      }

      if (data.token) {
        setAccessToken(data.token);
        scheduleTokenRefresh(data.token);
      }

      if (data.user) {
        setUser(data.user);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return { success: false, error: error.message };
    }
  };

  const scheduleTokenRefresh = (token) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return;
    }

    const currentTime = Date.now() / 1000;
    const expiresIn = decoded.exp - currentTime;
    
    const refreshTime = expiresIn > 600 ? expiresIn - 300 : expiresIn / 2;
    
    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime * 1000);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.token) {
            setAccessToken(data.token);
            scheduleTokenRefresh(data.token);
          }
          
          if (data.user) {
            setUser(data.user);
          }
        } else {
          const data = await response.json();
          if (data.verified === false) {
            setUser(null);
            setAccessToken(null);
          } else {
            setUser(null);
            setAccessToken(null);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      if (data.token) {
        setAccessToken(data.token);
        scheduleTokenRefresh(data.token);
      }
      
      if (data.user) {
        setUser(data.user);
      }

      return { 
        success: true, 
        data,
        verificationSent: data.verificationSent 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.verified === false) {
          return { 
            success: false, 
            error: data.message,
            needsVerification: true,
            verificationSent: data.verificationSent
          };
        }
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        setAccessToken(data.token);
        scheduleTokenRefresh(data.token);
      }
      
      if (data.user) {
        setUser(data.user);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      setAccessToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      return { 
        success: true, 
        message: data.message || 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: error.message };
    }
  };

  // NEW: Validate reset token function
  const validateResetToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/validate-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          valid: false, 
          message: data.message || 'Invalid token'
        };
      }

      return { 
        valid: true, 
        message: data.message 
      };
    } catch (error) {
      console.error('Validate reset token error:', error);
      return { 
        valid: false, 
        message: 'Failed to validate token'
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return { 
        success: true, 
        message: data.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  const apiRequest = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    };

    const config = {
      ...options,
      headers,
      credentials: 'include',
    };

    let response = await fetch(url, config);

    if (response.status === 401 && !options._retry) {
      const refreshResult = await refreshToken();
      
      if (refreshResult.success) {
        options._retry = true;
        return apiRequest(url, options);
      } else {
        if (refreshResult.needsVerification) {
          return response;
        }
        return response;
      }
    }

    if (response.status === 403) {
      try {
        const data = await response.clone().json();
        if (data.verified === false) {
          logout();
          response.needsVerification = true;
        }
      } catch (e) {
        // ignore
      }
    }

    return response;
  };

  const isLoggedIn = () => {
    return !!user;
  };

  const getToken = () => {
    return accessToken;
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    forgotPassword,
    validateResetToken,
    resetPassword,
    isLoggedIn,
    getToken,
    refreshToken,
    apiRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};