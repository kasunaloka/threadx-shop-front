import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { toast } from 'sonner';

interface User {
  email: string;
  username: string;
  displayName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
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
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await wooCommerceApi.validateToken();
        if (isValid) {
          // If token is valid, we should fetch user data
          // For now, we'll just set as authenticated
          dispatch({ type: 'LOGIN_SUCCESS', payload: { email: '', username: '', displayName: '' } });
        } else {
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } catch (error) {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const { user } = await wooCommerceApi.login(username, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      toast.success('Login successful!');
      return true;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error('Login failed. Please check your credentials.');
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
      console.log('Starting registration process...');
      
      await wooCommerceApi.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
      });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Registration successful! You can now log in.');
      return true;
    } catch (error: any) {
      console.error('Registration failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Show the specific error message
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    wooCommerceApi.logout();
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
