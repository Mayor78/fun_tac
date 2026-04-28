// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChange, 
  getCurrentUser, 
  logoutUser,
  loginUser,
  registerUser,
  getPlayerStats
} from '../lib/authService';
import toast from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      setLoading(false);
      
      if (authUser) {
        // Load user stats when logged in
        const stats = await getPlayerStats(authUser.uid);
        setUserStats(stats?.stats || null);
      } else {
        setUserStats(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    const result = await loginUser(email, password);
    if (result.success) {
      toast.success('Welcome back!');
      return true;
    } else {
      toast.error(result.error);
      return false;
    }
  }, []);

  // Register function
  const register = useCallback(async (email, password, displayName) => {
    const result = await registerUser(email, password, displayName);
    if (result.success) {
      toast.success('Account created! Welcome!');
      return true;
    } else {
      toast.error(result.error);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out');
      return true;
    } else {
      toast.error(result.error);
      return false;
    }
  }, []);

  return {
    user,
    loading,
    userStats,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userId: user?.uid,
    userEmail: user?.email,
    userName: user?.displayName || user?.email?.split('@')[0]
  };
}