
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { toast } from 'sonner';

interface User {
  id?: number;
  email: string;
  username: string;
  displayName: string;
  customerId?: number;
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
          // Try to get stored user data
          const storedUser = localStorage.getItem('wc_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            console.log('AuthContext: Restored user from storage:', userData);
            dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
          } else {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
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
      console.log('AuthContext: Starting login process for:', username);
      const { user, customerId } = await wooCommerceApi.login(username, password);
      console.log('AuthContext: Login successful, user:', user, 'customerId:', customerId);
      
      // Ensure we have proper user data
      const userData = {
        id: user.id,
        email: user.email || username, // Fallback to username if email is missing
        username: user.username || username,
        displayName: user.displayName || user.username || username,
        customerId: customerId
      };
      
      console.log('AuthContext: Final user data:', userData);
      
      // Store user data in localStorage
      localStorage.setItem('wc_user', JSON.stringify(userData));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      
      // Show specific error message
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
    localStorage.removeItem('wc_user');
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
