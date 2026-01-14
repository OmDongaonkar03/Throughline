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
  const [accessToken, setAccessToken] = useState(null); // kept in memory, dies on page refresh
  const refreshTimeoutRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // JWT decoder
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

  // Silent token refresh - happens automatically in the background
  const refreshToken = async () => {
    try {
      // refresh token sent via httpOnly cookie, so no need to include it here
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // this is the magic that sends the httpOnly cookie
      });

      const data = await response.json();

      if (!response.ok) {
        // If not verified, logout user
        if (data.verified === false) {
          logout();
          return { success: false, error: data.message, needsVerification: true };
        }
        throw new Error(data.message || 'Token refresh failed');
      }

      // got a new access token, store it and schedule next refresh
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
      logout(); // refresh failed, boot them out
      return { success: false, error: error.message };
    }
  };

  // Schedules the next token refresh before it expires
  // Refreshes 5min before expiry, or halfway through if token life < 10min
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
    
    // 5min before expiry, or halfway if short-lived token
    const refreshTime = expiresIn > 600 ? expiresIn - 300 : expiresIn / 2;
    
    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime * 1000);
    }
  };

  // On mount, check if user has an active session
  // Calls /auth/me which validates the httpOnly cookie and returns user + fresh access token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // send the httpOnly cookie
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
          // If not verified, clear state
          if (data.verified === false) {
            setUser(null);
            setAccessToken(null);
          } else {
            // no valid session, they're logged out
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

    // cleanup timeout when component unmounts
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
        credentials: 'include', // backend will set httpOnly cookie with refresh token
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // access token goes in memory, refresh token is already in httpOnly cookie
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
        credentials: 'include', // backend will set httpOnly cookie with refresh token
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Special handling for unverified users
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

      // access token goes in memory, refresh token is already in httpOnly cookie
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
      // tell backend to invalidate refresh token and clear the httpOnly cookie
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // meh, continue anyway
    } finally {
      // stop the refresh timer
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // clear everything from memory
      setAccessToken(null);
      setUser(null);
    }
  };

  // API wrapper with automatic 401 handling
  // Use this instead of fetch() for all authenticated requests
  const apiRequest = async (url, options = {}) => {
    // add access token to request if we have one
    const headers = {
      ...options.headers,
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    };

    const config = {
      ...options,
      headers,
      credentials: 'include', // always send httpOnly cookies
    };

    let response = await fetch(url, config);

    // if we get 401, token probably expired - try to refresh and retry once
    if (response.status === 401 && !options._retry) {
      const refreshResult = await refreshToken();
      
      if (refreshResult.success) {
        // retry the original request with new token
        options._retry = true; // prevent infinite loops
        return apiRequest(url, options);
      } else {
        // refresh failed, user needs to login again
        if (refreshResult.needsVerification) {
          // Component should handle this by checking response
          return response;
        }
        return response;
      }
    }

    // If we get 403 with verification error, logout
    if (response.status === 403) {
      try {
        const data = await response.clone().json();
        if (data.verified === false) {
          logout();
          // Return response with special flag for component to handle navigation
          response.needsVerification = true;
        }
      } catch (e) {
        // If can't parse JSON, just return response
      }
    }

    return response;
  };

  const isLoggedIn = () => {
    return !!user;
  };

  // returns current access token from memory
  // use this when making API calls that need auth
  const getToken = () => {
    return accessToken;
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    isLoggedIn,
    getToken,
    refreshToken, // exposed in case you need to manually trigger a refresh
    apiRequest, // use this for all API calls instead of fetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};