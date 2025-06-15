
import axios from 'axios';
import { logger } from './logger';

const WC_CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;
const WC_BASE_URL = process.env.NEXT_PUBLIC_WC_BASE_URL;

interface WooCommerceUser {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
  stock_status: string;
  stock_quantity: number;
  variations: number[];
  type: string;
}

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  total: string;
  customer_id: number;
  billing: any;
  shipping: any;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
  }>;
  payment_method: string;
  payment_method_title: string;
}

interface WooCommerceCartItem {
  key: string;
  id: number;
  quantity: number;
  name: string;
  prices: {
    price: string;
    regular_price: string;
  };
  variation: Record<string, string>;
}

interface WooCommerceCart {
  items: WooCommerceCartItem[];
  totals: {
    total_items: string;
    total_price: string;
  };
}

const createAuthHeader = () => {
  return 'Basic ' + Buffer.from(WC_CONSUMER_KEY + ':' + WC_CONSUMER_SECRET).toString('base64');
};

export const wooCommerceApi = {
  // Authentication methods
  login: async (username: string, password: string): Promise<{ user: WooCommerceUser; customerId?: number }> => {
    try {
      logger.log('Attempting to login to WordPress with username:', username);

      const auth = createAuthHeader();

      const response = await axios.get(`${WC_BASE_URL}/wp-json/wc/v3/customers?email=${username}`, {
        headers: {
          'Authorization': auth
        }
      });

      if (response.data && response.data.length > 0) {
        const customer = response.data[0];
        logger.log('WooCommerce customer found:', customer);

        // Use WordPress's built-in authentication endpoint to validate the username and password
        const authResponse = await axios.post(`${WC_BASE_URL}/wp-json/jwt-auth/v1/token`, {
          username: username,
          password: password,
        });

        if (authResponse.data && authResponse.data.token) {
          logger.log('WordPress authentication successful');

          const user: WooCommerceUser = {
            id: customer.id,
            email: customer.email,
            username: customer.username,
            firstName: customer.first_name,
            lastName: customer.last_name,
            displayName: customer.display_name,
          };

          return { user: user, customerId: customer.id };
        } else {
          logger.error('WordPress authentication failed');
          throw new Error('Invalid username or password');
        }
      } else {
        logger.error('No WooCommerce customer found with that email');
        throw new Error('No user found with that email');
      }
    } catch (error: any) {
      logger.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  },

  register: async (userData: { username: string; email: string; password: string; first_name?: string; last_name?: string }): Promise<void> => {
    try {
      logger.log('Attempting to register user in WordPress with username:', userData.username);

      const auth = createAuthHeader();

      const response = await axios.post(`${WC_BASE_URL}/wp-json/wc/v3/customers`, {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        billing: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
        },
        shipping: {
          first_name: userData.first_name,
          last_name: userData.last_name,
        }
      }, {
        headers: {
          'Authorization': auth
        }
      });

      if (response.status === 201) {
        logger.log('User registered successfully in WordPress');
      } else {
        logger.error('Failed to register user in WordPress:', response.data);
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      logger.error('Registration failed:', error);
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  },

  logout: (): void => {
    logger.log('Logging out from WordPress (client-side)');
  },

  validateToken: async (): Promise<boolean> => {
    try {
      const auth = createAuthHeader();
      const response = await axios.get(`${WC_BASE_URL}/wp-json/wc/v3/`, {
        headers: {
          'Authorization': auth
        }
      });

      if (response.status === 200) {
        logger.log('WooCommerce API is accessible and credentials are valid');
        return true;
      } else {
        logger.error('WooCommerce API validation failed:', response.status);
        return false;
      }
    } catch (error: any) {
      logger.error('WooCommerce API validation failed:', error);
      return false;
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      logger.log('Requesting password reset for email:', email);
      
      // Try WordPress REST API first (WordPress 5.7+)
      try {
        const response = await axios.post(`${WC_BASE_URL}/wp-json/wp/v2/users/reset-password`, {
          user_login: email
        });
        
        if (response.status === 200) {
          logger.log('Password reset email sent via REST API');
          return;
        }
      } catch (restError) {
        logger.log('REST API password reset failed, trying form submission:', restError);
      }

      // Fallback to form submission to wp-login.php
      const formData = new FormData();
      formData.append('user_login', email);
      formData.append('wp-submit', 'Get New Password');
      formData.append('redirect_to', '');
      
      const response = await axios.post(`${WC_BASE_URL}/wp-login.php?action=lostpassword`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        logger.log('Password reset request submitted successfully');
        return;
      }

      throw new Error('Password reset request failed');
    } catch (error: any) {
      logger.error('Password reset request failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to send password reset email. Please try again.');
    }
  },

  // Product methods
  getProducts: async (params: {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
    orderby?: string;
    order?: string;
    min_price?: number;
    max_price?: number;
  } = {}): Promise<WooCommerceProduct[]> => {
    try {
      const auth = createAuthHeader();
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await axios.get(`${WC_BASE_URL}/wp-json/wc/v3/products?${queryParams}`, {
        headers: {
          'Authorization': auth
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch products:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch products');
    }
  },

  getProduct: async (id: number): Promise<WooCommerceProduct> => {
    try {
      const auth = createAuthHeader();
      const response = await axios.get(`${WC_BASE_URL}/wp-json/wc/v3/products/${id}`, {
        headers: {
          'Authorization': auth
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch product:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  },

  // Cart methods
  getCart: async (): Promise<WooCommerceCart> => {
    try {
      // Note: WooCommerce doesn't have a built-in cart API endpoint
      // This would typically require a custom plugin or session management
      // For now, return empty cart structure
      return {
        items: [],
        totals: {
          total_items: '0',
          total_price: '0'
        }
      };
    } catch (error: any) {
      logger.error('Failed to fetch cart:', error);
      throw new Error('Failed to fetch cart');
    }
  },

  addToCart: async (productId: number, quantity: number, variation: Record<string, string> = {}): Promise<void> => {
    try {
      // Note: This would typically require a custom cart endpoint or plugin
      logger.log('Adding to cart:', { productId, quantity, variation });
      // Implementation would depend on your cart solution
    } catch (error: any) {
      logger.error('Failed to add to cart:', error);
      throw new Error('Failed to add to cart');
    }
  },

  updateCartItem: async (key: string, quantity: number): Promise<void> => {
    try {
      logger.log('Updating cart item:', { key, quantity });
      // Implementation would depend on your cart solution
    } catch (error: any) {
      logger.error('Failed to update cart item:', error);
      throw new Error('Failed to update cart item');
    }
  },

  removeCartItem: async (key: string): Promise<void> => {
    try {
      logger.log('Removing cart item:', key);
      // Implementation would depend on your cart solution
    } catch (error: any) {
      logger.error('Failed to remove cart item:', error);
      throw new Error('Failed to remove cart item');
    }
  },

  // Order methods
  createOrder: async (orderData: any): Promise<WooCommerceOrder> => {
    try {
      const auth = createAuthHeader();
      const response = await axios.post(`${WC_BASE_URL}/wp-json/wc/v3/orders`, orderData, {
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create order:', error);
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  },

  getOrders: async (params: {
    customer?: number;
    per_page?: number;
    orderby?: string;
    order?: string;
    status?: string;
  } = {}): Promise<WooCommerceOrder[]> => {
    try {
      const auth = createAuthHeader();
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await axios.get(`${WC_BASE_URL}/wp-json/wc/v3/orders?${queryParams}`, {
        headers: {
          'Authorization': auth
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch orders:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  },

  getOrder: async (id: number): Promise<WooCommerceOrder> => {
    try {
      const auth = createAuthHeader();
      const response = await axios.get(`${WC_BASE_URL}/wp-json/wc/v3/orders/${id}`, {
        headers: {
          'Authorization': auth
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch order:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  },
};
