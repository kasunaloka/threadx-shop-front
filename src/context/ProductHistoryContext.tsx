import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../utils/dataMappers';
import { useAuth } from './AuthContext';

interface ProductHistoryItem extends Product {
  viewedAt: number; // timestamp
}

interface ProductHistoryContextType {
  viewedProducts: ProductHistoryItem[];
  addToHistory: (product: Product) => void;
  clearHistory: () => void;
  loading: boolean;
}

const ProductHistoryContext = createContext<ProductHistoryContextType | undefined>(undefined);

export function useProductHistory() {
  const context = useContext(ProductHistoryContext);
  if (context === undefined) {
    throw new Error('useProductHistory must be used within a ProductHistoryProvider');
  }
  return context;
}

const MAX_HISTORY_ITEMS = 20;

export function ProductHistoryProvider({ children }: { children: ReactNode }) {
  const [viewedProducts, setViewedProducts] = useState<ProductHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load history from localStorage when component mounts or user changes
  useEffect(() => {
    const loadHistory = () => {
      setLoading(true);
      try {
        const storageKey = currentUser ? `product_history_${currentUser.uid}` : 'product_history_guest';
        const storedHistory = localStorage.getItem(storageKey);
        
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory) as ProductHistoryItem[];
          setViewedProducts(parsedHistory);
        }
      } catch (error) {
        console.error('Failed to load product history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [currentUser]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        const storageKey = currentUser ? `product_history_${currentUser.uid}` : 'product_history_guest';
        localStorage.setItem(storageKey, JSON.stringify(viewedProducts));
      } catch (error) {
        console.error('Failed to save product history:', error);
      }
    }
  }, [viewedProducts, currentUser, loading]);

  const addToHistory = (product: Product) => {
    setViewedProducts(prevHistory => {
      // Remove the product if it already exists in history
      const filteredHistory = prevHistory.filter(item => item.id !== product.id);
      
      // Add the product to the beginning of the array with current timestamp
      const newHistory = [
        { ...product, viewedAt: Date.now() },
        ...filteredHistory
      ];
      
      // Limit the history to MAX_HISTORY_ITEMS
      return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => {
    setViewedProducts([]);
  };

  const value = {
    viewedProducts,
    addToHistory,
    clearHistory,
    loading
  };

  return (
    <ProductHistoryContext.Provider value={value}>
      {children}
    </ProductHistoryContext.Provider>
  );
}