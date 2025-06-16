
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import { WordPressAuthService } from '../services/wordpressAuth';
import { SupabaseAuthService } from '../services/supabaseAuth';
import { toast } from 'sonner';

interface UnifiedAuthContextType extends AuthState {
  login: (credentials: LoginCredentials, provider?: 'wordpress' | 'supabase') => Promise<boolean>;
  register: (data: RegisterData, provider?: 'wordpress' | 'supabase') => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string, provider?: 'wordpress' | 'supabase') => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const wordpressService = new WordPressAuthService();
  const supabaseService = new SupabaseAuthService();

  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabaseService.onAuthStateChange((user) => {
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Check for existing WordPress token
    const wpToken = wordpressService.getStoredToken();
    if (wpToken && !state.user) {
      // In a real app, you'd validate the token with WordPress
      console.log('WordPress token found, but validation not implemented');
    }

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials, provider: 'wordpress' | 'supabase' = 'supabase'): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      let user: User | null = null;

      if (provider === 'wordpress') {
        const result = await wordpressService.login(credentials);
        user = result?.user || null;
      } else {
        user = await supabaseService.login(credentials);
      }

      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        toast.success('Successfully logged in!');
        return true;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (data: RegisterData, provider: 'wordpress' | 'supabase' = 'supabase'): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      let user: User;

      if (provider === 'wordpress') {
        user = await wordpressService.register(data);
      } else {
        user = await supabaseService.register(data);
      }

      dispatch({ type: 'SET_USER', payload: user });
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Logout from both services
      await supabaseService.logout();
      wordpressService.logout();
      
      dispatch({ type: 'SET_USER', payload: null });
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetPassword = async (email: string, provider: 'wordpress' | 'supabase' = 'supabase'): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      if (provider === 'wordpress') {
        await wordpressService.resetPassword(email);
      } else {
        await supabaseService.resetPassword(email);
      }

      toast.success('Password reset email sent!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: UnifiedAuthContextType = {
    ...state,
    login,
    register,
    logout,
    resetPassword,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};
