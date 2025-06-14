
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { wooCommerceApi } from '../utils/woocommerceApi';
import { toast } from 'sonner';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  key?: string; // WooCommerce cart item key
}

interface CartState {
  cartItems: CartItem[];
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_ITEM'; payload: { key: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' };

interface CartContextType extends CartState {
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  syncWithWooCommerce: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_CART_ITEMS':
      return {
        ...state,
        cartItems: action.payload,
        error: null,
      };
    case 'ADD_TO_CART':
      const existingItemIndex = state.cartItems.findIndex(
        item => item.id === action.payload.id && 
                item.size === action.payload.size && 
                item.color === action.payload.color
      );
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.cartItems];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return {
          ...state,
          cartItems: updatedItems,
        };
      }
      
      return {
        ...state,
        cartItems: [...state.cartItems, action.payload],
      };

    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item.key === action.payload.key
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item.key !== action.payload),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: [],
      };

    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    cartItems: [],
    isLoading: false,
    error: null,
  });

  // Sync with WooCommerce cart on mount
  useEffect(() => {
    syncWithWooCommerce();
  }, []);

  const syncWithWooCommerce = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const wcCart = await wooCommerceApi.getCart();
      const cartItems: CartItem[] = wcCart.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.prices.price) / 100, // WooCommerce prices are in cents
        image: item.images?.[0]?.src || '/placeholder.svg',
        size: item.variation?.attribute_pa_size || 'M',
        color: item.variation?.attribute_pa_color || 'Default',
        quantity: item.quantity,
        key: item.key,
      }));

      dispatch({ type: 'SET_CART_ITEMS', payload: cartItems });
    } catch (error) {
      console.error('Failed to sync with WooCommerce cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (item: CartItem) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Create variation object for WooCommerce
      const variation: Record<string, string> = {};
      if (item.size && item.size !== 'Default') {
        variation.attribute_pa_size = item.size;
      }
      if (item.color && item.color !== 'Default') {
        variation.attribute_pa_color = item.color;
      }

      await wooCommerceApi.addToCart(item.id, item.quantity, variation);
      
      // Sync with WooCommerce to get updated cart
      await syncWithWooCommerce();
      
      toast.success(`${item.name} added to cart!`);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      toast.error('Failed to add item to cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (key: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await wooCommerceApi.removeCartItem(key);
      dispatch({ type: 'REMOVE_FROM_CART', payload: key });
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      toast.error('Failed to remove item from cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (key: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(key);
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await wooCommerceApi.updateCartItem(key, quantity);
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { key, quantity } });
    } catch (error) {
      console.error('Failed to update cart item:', error);
      toast.error('Failed to update cart item');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart item' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Remove all items from WooCommerce cart
      const removePromises = state.cartItems.map(item => 
        item.key ? wooCommerceApi.removeCartItem(item.key) : Promise.resolve()
      );
      
      await Promise.all(removePromises);
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getCartTotal = () => {
    return state.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        syncWithWooCommerce,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
