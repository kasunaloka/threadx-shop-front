
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

interface User {
  id?: number;
  email: string;
  username: string;
  displayName: string;
  customerId?: number;
  supabaseId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authProvider: 'wordpress' | 'supabase' | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; provider: 'wordpress' | 'supabase' } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (username: string, password: string, provider?: 'wordpress' | 'supabase') => Promise<boolean>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }, provider?: 'wordpress' | 'supabase') => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
}

const UnifiedAuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        authProvider: action.payload.provider,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        authProvider: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        authProvider: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

export const UnifiedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    authProvider: null,
  });

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase first
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = {
            supabaseId: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '',
          };
          logger.log('UnifiedAuth: Restored Supabase user from session:', userData);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, provider: 'supabase' } });
          return;
        }

        // Check WordPress token
        const isValidWP = await wooCommerceApi.validateToken();
        if (isValidWP) {
          const storedUser = localStorage.getItem('wc_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            logger.log('UnifiedAuth: Restored WordPress user from storage:', userData);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, provider: 'wordpress' } });
            return;
          }
        }

        dispatch({ type: 'LOGIN_FAILURE' });
      } catch (error) {
        logger.error('Auth check failed:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkAuth();

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            supabaseId: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '',
          };
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, provider: 'supabase' } });
        } else if (event === 'SIGNED_OUT') {
          // Only logout if currently using Supabase auth
          if (state.authProvider === 'supabase') {
            dispatch({ type: 'LOGOUT' });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string, provider: 'wordpress' | 'supabase' = 'wordpress'): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      if (provider === 'supabase') {
        logger.log('UnifiedAuth: Starting Supabase login for:', username);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (error) throw error;

        const userData = {
          supabaseId: data.user.id,
          email: data.user.email || username,
          username: data.user.email?.split('@')[0] || username,
          displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || username,
        };

        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, provider: 'supabase' } });
        toast.success(`Welcome back, ${userData.displayName}!`);
        return true;
      } else {
        // WordPress login
        logger.log('UnifiedAuth: Starting WordPress login for:', username);
        const { user, customerId } = await wooCommerceApi.login(username, password);
        
        const userData = {
          id: user.id,
          email: user.email || username,
          username: user.username || username,
          displayName: user.displayName || user.username || username,
          customerId: customerId
        };
        
        localStorage.setItem('wc_user', JSON.stringify(userData));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, provider: 'wordpress' } });
        toast.success(`Welcome back, ${userData.displayName}!`);
        return true;
      }
    } catch (error: any) {
      logger.error('UnifiedAuth: Login failed:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }, provider: 'wordpress' | 'supabase' = 'wordpress'): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (provider === 'supabase') {
        logger.log('UnifiedAuth: Starting Supabase registration...');
        
        const { error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: userData.username,
              display_name: userData.firstName && userData.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData.username,
              first_name: userData.firstName,
              last_name: userData.lastName,
            }
          }
        });

        if (error) throw error;

        dispatch({ type: 'SET_LOADING', payload: false });
        toast.success('Registration successful! Please check your email to verify your account.');
        return true;
      } else {
        // WordPress registration
        logger.log('UnifiedAuth: Starting WordPress registration...');
        
        await wooCommerceApi.register({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
        });
        
        dispatch({ type: 'SET_LOADING', payload: false });
        toast.success('Registration successful! You can now log in with your username and password.');
        return true;
      }
    } catch (error: any) {
      logger.error('UnifiedAuth: Registration failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('email already exists') || error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or sign in to your existing account.';
      } else if (error.message.includes('username is already taken')) {
        errorMessage = 'This username is already taken. Please choose a different username.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      logger.log('UnifiedAuth: Starting password reset for:', email);
      
      // Try Supabase password reset first
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (!error) {
        toast.success('Password reset email sent! Please check your inbox.');
        return true;
      }

      // If Supabase fails, could implement WordPress password reset here
      // For now, we'll just show the Supabase error
      throw error;
    } catch (error: any) {
      logger.error('UnifiedAuth: Password reset failed:', error);
      toast.error('Failed to send password reset email. Please try again.');
      return false;
    }
  };

  const logout = () => {
    if (state.authProvider === 'supabase') {
      supabase.auth.signOut();
    } else if (state.authProvider === 'wordpress') {
      wooCommerceApi.logout();
      localStorage.removeItem('wc_user');
    }
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully!');
  };

  return (
    <UnifiedAuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        resetPassword,
      }}
    >
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = (): AuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};
