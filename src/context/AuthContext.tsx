
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { toast } from 'sonner';
import { logger } from '../utils/logger';
import { useSupabaseAuthContext } from './SupabaseAuthContext';
import { syncWordPressUserToSupabase, linkWordPressToSupabaseUser } from '../utils/userSync';

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
  authMethod: 'wordpress' | 'supabase' | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; method: 'wordpress' | 'supabase' } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

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
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authMethod: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authMethod: null,
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    authMethod: null,
  });

  const supabaseAuth = useSupabaseAuthContext();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check WordPress/WooCommerce auth
        const isWpValid = await wooCommerceApi.validateToken();
        if (isWpValid) {
          const storedUser = localStorage.getItem('wc_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            logger.log('AuthContext: Restored WordPress user from storage:', userData);
            
            // If we have a Supabase user, sync the data
            if (supabaseAuth.user) {
              await syncWordPressUserToSupabase(userData, supabaseAuth.user.id);
              userData.supabaseId = supabaseAuth.user.id;
            }
            
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, method: 'wordpress' } });
            return;
          }
        }

        // If WordPress auth fails and Supabase user exists, use Supabase
        if (supabaseAuth.user && !supabaseAuth.isLoading) {
          const supabaseUser = {
            id: undefined,
            email: supabaseAuth.user.email || '',
            username: supabaseAuth.user.user_metadata?.username || supabaseAuth.user.email?.split('@')[0] || '',
            displayName: supabaseAuth.user.user_metadata?.display_name || supabaseAuth.user.user_metadata?.username || supabaseAuth.user.email?.split('@')[0] || '',
            supabaseId: supabaseAuth.user.id,
          };
          logger.log('AuthContext: Using Supabase user:', supabaseUser);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: supabaseUser, method: 'supabase' } });
          return;
        }

        dispatch({ type: 'LOGIN_FAILURE' });
      } catch (error) {
        logger.error('Auth check failed:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    // Only check auth when Supabase auth has finished loading
    if (!supabaseAuth.isLoading) {
      checkAuth();
    }
  }, [supabaseAuth.user, supabaseAuth.isLoading]);

  const login = async (username: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      logger.log('AuthContext: Starting login process for:', username);
      
      // Try WordPress login first
      try {
        const { user, customerId } = await wooCommerceApi.login(username, password);
        logger.log('AuthContext: WordPress login successful');
        
        const userData = {
          id: user.id,
          email: user.email || username,
          username: user.username || username,
          displayName: user.displayName || user.username || username,
          customerId: customerId
        };
        
        // If we have a Supabase user, sync the WordPress data
        if (supabaseAuth.user) {
          await syncWordPressUserToSupabase(userData, supabaseAuth.user.id);
          userData.supabaseId = supabaseAuth.user.id;
        } else {
          // Try to link to existing Supabase user or create one
          try {
            const { data } = await supabaseAuth.signIn(userData.email, password);
            if (data.user) {
              await linkWordPressToSupabaseUser(userData, data.user.id);
              userData.supabaseId = data.user.id;
            }
          } catch (supabaseError) {
            logger.log('Could not link to Supabase user:', supabaseError);
            // This is optional, so we continue without Supabase sync
          }
        }
        
        localStorage.setItem('wc_user', JSON.stringify(userData));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, method: 'wordpress' } });
        toast.success('Login successful!');
        return true;
      } catch (wpError) {
        logger.log('WordPress login failed, trying Supabase:', wpError);
        
        // If WordPress fails, try Supabase
        const { data, error } = await supabaseAuth.signIn(username, password);
        
        if (error) {
          throw error;
        }

        if (data.user) {
          const userData = {
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
      logger.log('Starting registration process...');
      
      // Try WordPress registration first
      try {
        await wooCommerceApi.register({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
        });
        
        // Also register in Supabase for enhanced features
        try {
          await supabaseAuth.signUp(userData.email, userData.password, {
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
          });
        } catch (supabaseError) {
          logger.log('Supabase registration failed, but WordPress succeeded:', supabaseError);
          // This is optional, so we continue
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
        toast.success('Registration successful! You can now log in.');
        return true;
      } catch (wpError) {
        logger.log('WordPress registration failed, trying Supabase:', wpError);
        
        // If WordPress fails, register with Supabase
        const { data, error } = await supabaseAuth.signUp(userData.email, userData.password, {
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

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabaseAuth.resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      toast.success('Password reset email sent! Please check your inbox.');
      return true;
    } catch (error: any) {
      logger.error('Password reset failed:', error);
      toast.error(error.message || 'Failed to send password reset email.');
      return false;
    }
  };

  const logout = () => {
    // Logout from WordPress
    wooCommerceApi.logout();
    localStorage.removeItem('wc_user');
    
    // Logout from Supabase (don't await to avoid blocking)
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
