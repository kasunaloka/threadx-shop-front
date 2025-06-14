import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { toast } from 'sonner';
import { logger } from '../utils/logger';
import { useSupabaseAuthContext } from './SupabaseAuthContext';
import { syncWordPressUserToSupabase, linkWordPressToSupabaseUser, createSupabaseUserFromWordPress } from '../utils/userSync';

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
  authMethod: 'wordpress' | 'supabase' | 'dual' | null;
  syncStatus: 'synced' | 'syncing' | 'failed' | 'none';
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; method: 'wordpress' | 'supabase' | 'dual' } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: 'synced' | 'syncing' | 'failed' | 'none' }
  | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  syncUserData: () => Promise<boolean>;
  switchToSupabase: () => Promise<boolean>;
  switchToWordPress: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        isAuthenticated: true,
        isLoading: false,
        authMethod: action.payload.method,
        syncStatus: action.payload.method === 'dual' ? 'synced' : 'none',
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authMethod: null,
        syncStatus: 'none',
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authMethod: null,
        syncStatus: 'none',
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    authMethod: null,
    syncStatus: 'none',
  });

  const supabaseAuth = useSupabaseAuthContext();

  // Enhanced authentication check with better synchronization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Check WordPress authentication first (primary system)
        const isWpValid = await wooCommerceApi.validateToken();
        const storedUser = localStorage.getItem('wc_user');
        
        if (isWpValid && storedUser) {
          const wpUserData = JSON.parse(storedUser);
          logger.log('AuthContext: WordPress user found:', wpUserData);
          
          // Check if Supabase user exists and sync
          if (supabaseAuth.user) {
            logger.log('AuthContext: Both WordPress and Supabase users found, syncing...');
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
            
            const syncSuccess = await syncWordPressUserToSupabase(wpUserData, supabaseAuth.user.id);
            
            const userData = {
              ...wpUserData,
              supabaseId: supabaseAuth.user.id,
            };
            
            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { 
                user: userData, 
                method: 'dual' 
              } 
            });
            dispatch({ type: 'SET_SYNC_STATUS', payload: syncSuccess ? 'synced' : 'failed' });
            
            // Update stored user data with Supabase ID
            localStorage.setItem('wc_user', JSON.stringify(userData));
            return;
          } else {
            // WordPress only
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: wpUserData, method: 'wordpress' } });
            return;
          }
        }

        // If no WordPress auth, check Supabase
        if (supabaseAuth.user && !supabaseAuth.isLoading) {
          logger.log('AuthContext: Supabase-only user found');
          const supabaseUser = {
            id: undefined,
            email: supabaseAuth.user.email || '',
            username: supabaseAuth.user.user_metadata?.username || supabaseAuth.user.email?.split('@')[0] || '',
            displayName: supabaseAuth.user.user_metadata?.display_name || supabaseAuth.user.user_metadata?.username || supabaseAuth.user.email?.split('@')[0] || '',
            supabaseId: supabaseAuth.user.id,
          };
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: supabaseUser, method: 'supabase' } });
          return;
        }

        dispatch({ type: 'LOGIN_FAILURE' });
      } catch (error) {
        logger.error('Auth check failed:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    if (!supabaseAuth.isLoading) {
      checkAuth();
    }
  }, [supabaseAuth.user, supabaseAuth.isLoading]);

  const login = async (username: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      logger.log('AuthContext: Starting dual authentication login for:', username);
      
      // Always try WordPress first (primary system for e-commerce)
      try {
        const { user, customerId } = await wooCommerceApi.login(username, password);
        logger.log('AuthContext: WordPress login successful');
        
        const wpUserData: User = {
          id: user.id,
          email: user.email || username,
          username: user.username || username,
          displayName: user.displayName || user.username || username,
          customerId: customerId,
          supabaseId: undefined
        };
        
        // Try to sync with or create Supabase user
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
        
        try {
          // First, try to sign in to existing Supabase account
          const { data: signInData } = await supabaseAuth.signIn(wpUserData.email, password);
          
          if (signInData.user) {
            // Existing Supabase user found, sync data
            await linkWordPressToSupabaseUser(wpUserData, signInData.user.id);
            wpUserData.supabaseId = signInData.user.id;
            
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' });
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: wpUserData, method: 'dual' } });
          } else {
            // No existing Supabase user, WordPress only
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'none' });
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: wpUserData, method: 'wordpress' } });
          }
        } catch (supabaseError) {
          logger.log('No existing Supabase user, trying to create one:', supabaseError);
          
          // Try to create new Supabase user
          try {
            const supabaseUserId = await createSupabaseUserFromWordPress(wpUserData);
            if (supabaseUserId) {
              wpUserData.supabaseId = supabaseUserId;
              dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' });
              dispatch({ type: 'LOGIN_SUCCESS', payload: { user: wpUserData, method: 'dual' } });
            } else {
              // WordPress only
              dispatch({ type: 'SET_SYNC_STATUS', payload: 'failed' });
              dispatch({ type: 'LOGIN_SUCCESS', payload: { user: wpUserData, method: 'wordpress' } });
            }
          } catch (createError) {
            logger.log('Could not create Supabase user, WordPress only:', createError);
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'failed' });
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: wpUserData, method: 'wordpress' } });
          }
        }
        
        localStorage.setItem('wc_user', JSON.stringify(wpUserData));
        toast.success('Login successful!');
        return true;
        
      } catch (wpError) {
        logger.log('WordPress login failed, trying Supabase only:', wpError);
        
        // Fallback to Supabase-only authentication
        const { data, error } = await supabaseAuth.signIn(username, password);
        
        if (error) {
          throw error;
        }

        if (data.user) {
          const userData: User = {
            id: undefined,
            email: data.user.email || username,
            username: data.user.user_metadata?.username || username,
            displayName: data.user.user_metadata?.display_name || data.user.user_metadata?.username || username,
            supabaseId: data.user.id,
          };
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, method: 'supabase' } });
          toast.success('Login successful!');
          return true;
        }
      }
      
      return false;
    } catch (error: any) {
      logger.error('AuthContext: Login failed:', error);
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
  }): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      logger.log('Starting dual registration process...');
      
      // Register in WordPress first (primary for e-commerce)
      try {
        await wooCommerceApi.register({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
        });
        
        logger.log('WordPress registration successful');
        
        // Also register in Supabase for enhanced features
        try {
          const { data: supabaseData } = await supabaseAuth.signUp(userData.email, userData.password, {
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
          });
          
          if (supabaseData.user) {
            logger.log('Dual registration successful');
            toast.success('Registration successful! You can now log in with both systems.');
          } else {
            logger.log('WordPress registration successful, Supabase registration failed');
            toast.success('Registration successful! You can now log in.');
          }
        } catch (supabaseError) {
          logger.log('Supabase registration failed, but WordPress succeeded:', supabaseError);
          toast.success('Registration successful! You can now log in.');
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
        
      } catch (wpError) {
        logger.log('WordPress registration failed, trying Supabase only:', wpError);
        
        // Fallback to Supabase-only registration
        const { error } = await supabaseAuth.signUp(userData.email, userData.password, {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
        
        if (error) {
          throw error;
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
        toast.success('Registration successful! Please check your email to verify your account.');
        return true;
      }
    } catch (error: any) {
      logger.error('Registration failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return false;
    }
  };

  const syncUserData = async (): Promise<boolean> => {
    if (!state.user || !state.user.supabaseId) {
      toast.error('No user data to sync');
      return false;
    }

    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    
    try {
      const success = await syncWordPressUserToSupabase(state.user, state.user.supabaseId);
      dispatch({ type: 'SET_SYNC_STATUS', payload: success ? 'synced' : 'failed' });
      
      if (success) {
        toast.success('User data synchronized successfully!');
      } else {
        toast.error('Failed to synchronize user data');
      }
      
      return success;
    } catch (error) {
      logger.error('Sync failed:', error);
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'failed' });
      toast.error('Failed to synchronize user data');
      return false;
    }
  };

  const switchToSupabase = async (): Promise<boolean> => {
    if (!state.user) return false;

    try {
      if (!state.user.supabaseId) {
        // Create Supabase user if doesn't exist
        const supabaseUserId = await createSupabaseUserFromWordPress(state.user);
        if (supabaseUserId) {
          const updatedUser = { ...state.user, supabaseId: supabaseUserId };
          dispatch({ type: 'UPDATE_USER', payload: updatedUser });
          localStorage.setItem('wc_user', JSON.stringify(updatedUser));
        }
      }
      
      toast.success('Switched to Supabase features');
      return true;
    } catch (error) {
      logger.error('Failed to switch to Supabase:', error);
      toast.error('Failed to enable Supabase features');
      return false;
    }
  };

  const switchToWordPress = async (): Promise<boolean> => {
    if (!state.user) return false;
    
    // WordPress is always primary, so this just confirms WordPress connection
    try {
      const isValid = await wooCommerceApi.validateToken();
      if (isValid) {
        toast.success('WordPress connection confirmed');
        return true;
      } else {
        toast.error('WordPress connection lost, please log in again');
        return false;
      }
    } catch (error) {
      logger.error('WordPress validation failed:', error);
      toast.error('WordPress connection failed');
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // Try WordPress first, then Supabase
      try {
        await wooCommerceApi.requestPasswordReset(email);
        toast.success('Password reset email sent via WordPress!');
        return true;
      } catch (wpError) {
        logger.log('WordPress reset failed, trying Supabase:', wpError);
        
        const { error } = await supabaseAuth.resetPassword(email);
        
        if (error) {
          throw error;
        }
        
        toast.success('Password reset email sent via Supabase!');
        return true;
      }
    } catch (error: any) {
      logger.error('Password reset failed:', error);
      toast.error(error.message || 'Failed to send password reset email.');
      return false;
    }
  };

  const logout = () => {
    // Logout from both systems
    wooCommerceApi.logout();
    localStorage.removeItem('wc_user');
    
    supabaseAuth.signOut();
    
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        resetPassword,
        syncUserData,
        switchToSupabase,
        switchToWordPress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
