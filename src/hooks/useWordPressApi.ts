import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { createProtectedApi, wordpressApi, verifyFirebaseToken } from '../utils/wordpressApi';

export function useWordPressApi() {
  const { getIdToken } = useAuth();

  // Create authenticated API instance
  const protectedApi = useMemo(() => {
    return createProtectedApi(getIdToken);
  }, [getIdToken]);

  // Return both authenticated and public APIs
  return {
    // Public API (no authentication required)
    public: wordpressApi,
    
    // Protected API (requires Firebase authentication)
    protected: protectedApi,
    
    // Utility functions
    verifyToken: verifyFirebaseToken,
  };
}

// Hook for user management
export function useWordPressUser() {
  const { currentUser } = useAuth();
  const { protected: protectedApi } = useWordPressApi();

  const createUser = async () => {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const userData = {
        firebase_uid: currentUser.uid,
        email: currentUser.email || '',
        name: currentUser.displayName || currentUser.email || '',
      };

      const result = await protectedApi.createWordPressUser(userData);
      return result;
    } catch (error) {
      console.error('Failed to create WordPress user:', error);
      throw error;
    }
  };

  const getUserProfile = async () => {
    try {
      return await protectedApi.getUserProfile();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  };

  return {
    createUser,
    getUserProfile,
    currentUser,
  };
}

// Hook for order management
export function useWordPressOrders() {
  const { protected: protectedApi } = useWordPressApi();

  const submitOrder = async (orderData: any) => {
    try {
      return await protectedApi.submitOrder(orderData);
    } catch (error) {
      console.error('Failed to submit order:', error);
      throw error;
    }
  };

  const getUserOrders = async () => {
    try {
      return await protectedApi.getUserOrders();
    } catch (error) {
      console.error('Failed to get user orders:', error);
      throw error;
    }
  };

  return {
    submitOrder,
    getUserOrders,
  };
} 