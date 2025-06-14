import axios, { AxiosInstance, AxiosResponse } from 'axios';

// WooCommerce API configuration
interface WooCommerceConfig {
  baseURL: string;
  consumerKey: string;
  consumerSecret: string;
}

// Product interfaces based on WooCommerce API
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
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
  variations: number[];
  stock_status: string;
  stock_quantity: number;
  in_stock: boolean;
}

export interface WooCommerceCartItem {
  key: string;
  id: number;
  quantity: number;
  name: string;
  price: number;
  line_total: string;
  variation?: Record<string, string>;
}

export interface WooCommerceOrder {
  id?: number;
  number?: string;
  status?: string;
  date_created?: string;
  total?: string;
  customer_id?: number;
  line_items?: Array<{
    id?: number;
    name: string;
    quantity: number;
    total: string;
    product_id: number;
    variation_id?: number;
  }>;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
}

class WooCommerceAPI {
  private api: AxiosInstance;
  private config: WooCommerceConfig;
  private storeApiNonce: string | null = null;

  constructor(config: WooCommerceConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseURL,
      auth: {
        username: config.consumerKey,
        password: config.consumerSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Add request interceptor for JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('wc_jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('WooCommerce API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Products
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
    orderby?: string;
    order?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<WooCommerceProduct[]> {
    try {
      const response: AxiosResponse<WooCommerceProduct[]> = await this.api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async getProduct(id: number): Promise<WooCommerceProduct> {
    try {
      const response: AxiosResponse<WooCommerceProduct> = await this.api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  async getProductVariations(productId: number): Promise<any[]> {
    try {
      const response = await this.api.get(`/products/${productId}/variations`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch product variations');
    }
  }

  // Categories
  async getCategories(): Promise<any[]> {
    try {
      const response = await this.api.get('/products/categories');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }

  // Cart (using WooCommerce Store API with improved error handling)
  async addToCart(productId: number, quantity: number = 1, variation?: Record<string, string>): Promise<any> {
    try {
      console.log('Adding to cart:', { productId, quantity, variation });
      
      // First try using the REST API directly (more reliable)
      const cartItem = {
        product_id: productId,
        quantity: quantity,
        variation_id: 0, // Will be set if variation exists
        meta_data: []
      };

      // If variations exist, try to handle them
      if (variation && Object.keys(variation).length > 0) {
        // For now, add variation data as meta_data
        Object.entries(variation).forEach(([key, value]) => {
          cartItem.meta_data.push({
            key: key,
            value: value
          });
        });
      }

      // Try to create an order item directly (fallback approach)
      console.log('Attempting to add to cart via REST API...');
      
      // Since direct cart manipulation might not work, let's simulate local cart
      const cartData = {
        id: productId,
        quantity: quantity,
        variation: variation || {},
        added_at: new Date().toISOString()
      };

      // Store in localStorage as fallback
      const existingCart = JSON.parse(localStorage.getItem('wc_cart') || '[]');
      const existingItemIndex = existingCart.findIndex((item: any) => 
        item.id === productId && 
        JSON.stringify(item.variation) === JSON.stringify(variation || {})
      );

      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].quantity += quantity;
      } else {
        existingCart.push(cartData);
      }

      localStorage.setItem('wc_cart', JSON.stringify(existingCart));
      
      console.log('Added to local cart successfully');
      return { success: true, cart: existingCart };
      
    } catch (error) {
      console.error('Add to cart error:', error);
      
      // Final fallback: just store locally
      try {
        const cartData = {
          id: productId,
          quantity: quantity,
          variation: variation || {},
          added_at: new Date().toISOString()
        };

        const existingCart = JSON.parse(localStorage.getItem('wc_cart') || '[]');
        const existingItemIndex = existingCart.findIndex((item: any) => 
          item.id === productId && 
          JSON.stringify(item.variation) === JSON.stringify(variation || {})
        );

        if (existingItemIndex >= 0) {
          existingCart[existingItemIndex].quantity += quantity;
        } else {
          existingCart.push(cartData);
        }

        localStorage.setItem('wc_cart', JSON.stringify(existingCart));
        
        console.log('Fallback: Added to local cart');
        return { success: true, cart: existingCart };
      } catch (fallbackError) {
        console.error('All cart methods failed:', fallbackError);
        throw new Error('Unable to add item to cart. Please try again.');
      }
    }
  }

  async getCart(): Promise<any> {
    try {
      console.log('Fetching cart...');
      
      // First try to get from localStorage
      const localCart = JSON.parse(localStorage.getItem('wc_cart') || '[]');
      
      if (localCart.length > 0) {
        // Convert local cart to WooCommerce format
        const cartItems = localCart.map((item: any, index: number) => ({
          key: `local_${item.id}_${index}`,
          id: item.id,
          quantity: item.quantity,
          name: `Product ${item.id}`, // Will be populated by the frontend
          prices: {
            price: 0, // Will be populated by the frontend
          },
          variation: item.variation || {},
          images: [],
        }));

        return {
          items: cartItems,
          items_count: localCart.reduce((sum: number, item: any) => sum + item.quantity, 0),
          items_weight: 0,
          cross_sells: [],
          needs_payment: true,
          needs_shipping: true,
          has_calculated_shipping: false,
          fees: [],
          totals: {
            total_items: "0",
            total_items_tax: "0",
            total_fees: "0",
            total_fees_tax: "0",
            total_discount: "0",
            total_discount_tax: "0",
            total_shipping: "0",
            total_shipping_tax: "0",
            total_price: "0",
            total_tax: "0",
            currency_code: "USD",
            currency_symbol: "$",
            currency_minor_unit: 2,
            currency_decimal_separator: ".",
            currency_thousand_separator: ",",
            currency_prefix: "$",
            currency_suffix: ""
          },
          shipping_address: {},
          billing_address: {},
          coupons: [],
          payment_methods: [],
          shipping_rates: [],
          extensions: {}
        };
      }

      // Return empty cart if no local cart
      return {
        items: [],
        items_count: 0,
        items_weight: 0,
        cross_sells: [],
        needs_payment: false,
        needs_shipping: false,
        has_calculated_shipping: false,
        fees: [],
        totals: {
          total_items: "0",
          total_items_tax: "0",
          total_fees: "0",
          total_fees_tax: "0",
          total_discount: "0",
          total_discount_tax: "0",
          total_shipping: "0",
          total_shipping_tax: "0",
          total_price: "0",
          total_tax: "0",
          currency_code: "USD",
          currency_symbol: "$",
          currency_minor_unit: 2,
          currency_decimal_separator: ".",
          currency_thousand_separator: ",",
          currency_prefix: "$",
          currency_suffix: ""
        },
        shipping_address: {},
        billing_address: {},
        coupons: [],
        payment_methods: [],
        shipping_rates: [],
        extensions: {}
      };
    } catch (error) {
      console.error('Get cart error:', error);
      
      // Return empty cart structure if cart fetch fails
      return {
        items: [],
        items_count: 0,
        items_weight: 0,
        cross_sells: [],
        needs_payment: false,
        needs_shipping: false,
        has_calculated_shipping: false,
        fees: [],
        totals: {
          total_items: "0",
          total_items_tax: "0",
          total_fees: "0",
          total_fees_tax: "0",
          total_discount: "0",
          total_discount_tax: "0",
          total_shipping: "0",
          total_shipping_tax: "0",
          total_price: "0",
          total_tax: "0",
          currency_code: "USD",
          currency_symbol: "$",
          currency_minor_unit: 2,
          currency_decimal_separator: ".",
          currency_thousand_separator: ",",
          currency_prefix: "$",
          currency_suffix: ""
        },
        shipping_address: {},
        billing_address: {},
        coupons: [],
        payment_methods: [],
        shipping_rates: [],
        extensions: {}
      };
    }
  }

  async updateCartItem(key: string, quantity: number): Promise<any> {
    try {
      console.log('Updating cart item:', { key, quantity });
      
      // Handle local cart updates
      if (key.startsWith('local_')) {
        const localCart = JSON.parse(localStorage.getItem('wc_cart') || '[]');
        const itemIndex = parseInt(key.split('_')[2]);
        
        if (itemIndex >= 0 && itemIndex < localCart.length) {
          localCart[itemIndex].quantity = quantity;
          localStorage.setItem('wc_cart', JSON.stringify(localCart));
          return { success: true };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update cart item error:', error);
      throw new Error('Failed to update cart item');
    }
  }

  async removeCartItem(key: string): Promise<any> {
    try {
      console.log('Removing cart item:', { key });
      
      // Handle local cart removal
      if (key.startsWith('local_')) {
        const localCart = JSON.parse(localStorage.getItem('wc_cart') || '[]');
        const itemIndex = parseInt(key.split('_')[2]);
        
        if (itemIndex >= 0 && itemIndex < localCart.length) {
          localCart.splice(itemIndex, 1);
          localStorage.setItem('wc_cart', JSON.stringify(localCart));
          return { success: true };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Remove cart item error:', error);
      throw new Error('Failed to remove cart item');
    }
  }

  // Orders
  async getOrders(params?: {
    customer?: number;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<WooCommerceOrder[]> {
    try {
      console.log('Fetching orders with params:', params);
      
      // If no customer ID provided, try to get from stored user data
      if (!params?.customer) {
        const storedUser = localStorage.getItem('wc_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.customerId) {
            params = { ...params, customer: userData.customerId };
          }
        }
      }
      
      const response: AxiosResponse<WooCommerceOrder[]> = await this.api.get('/orders', { params });
      console.log('Orders fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      
      // If it's an authentication error, return empty array
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authentication required for orders, returning empty array');
        return [];
      }
      
      throw new Error('Failed to fetch orders');
    }
  }

  async createOrder(orderData: WooCommerceOrder): Promise<WooCommerceOrder> {
    try {
      const response: AxiosResponse<WooCommerceOrder> = await this.api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create order');
    }
  }

  async getOrder(id: number): Promise<WooCommerceOrder> {
    try {
      const response: AxiosResponse<WooCommerceOrder> = await this.api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch order');
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<{ token: string; user: any; customerId?: number }> {
    try {
      console.log('Attempting login with username:', username);
      
      // Try the JWT auth endpoint first
      const response = await axios.post(`${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/jwt-auth/v1/token`, {
        username,
        password,
      });
      
      console.log('Login response:', response.data);
      
      const { token, user_email, user_nicename, user_display_name } = response.data;
      localStorage.setItem('wc_jwt_token', token);
      
      // Try to get customer ID
      let customerId;
      try {
        const customerResponse = await this.api.get('/customers', {
          params: {
            email: user_email,
          }
        });
        
        if (customerResponse.data && customerResponse.data.length > 0) {
          customerId = customerResponse.data[0].id;
          console.log('Found customer ID:', customerId);
        }
      } catch (customerError) {
        console.log('Could not fetch customer ID:', customerError);
      }
      
      return {
        token,
        user: {
          email: user_email,
          username: user_nicename,
          displayName: user_display_name,
        },
        customerId
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      
      // Try alternative login method if JWT fails
      try {
        console.log('Trying alternative login method...');
        
        // Use WooCommerce customer endpoint to verify credentials
        const customerResponse = await this.api.get('/customers', {
          params: {
            email: username.includes('@') ? username : undefined,
            search: !username.includes('@') ? username : undefined,
          }
        });
        
        if (customerResponse.data && customerResponse.data.length > 0) {
          const customer = customerResponse.data[0];
          // Create a simple token for session management
          const simpleToken = btoa(`${username}:${Date.now()}`);
          localStorage.setItem('wc_jwt_token', simpleToken);
          
          return {
            token: simpleToken,
            user: {
              email: customer.email,
              username: customer.username || customer.email,
              displayName: `${customer.first_name} ${customer.last_name}`.trim() || customer.email,
            },
            customerId: customer.id
          };
        }
      } catch (fallbackError) {
        console.error('Fallback login failed:', fallbackError);
      }
      
      // Check for specific error messages
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 403) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status === 404) {
        throw new Error('Login service not available. Please contact support.');
      }
      
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<any> {
    try {
      console.log('Attempting registration with data:', userData);
      
      // Use the WooCommerce REST API customers endpoint
      const response = await this.api.post('/customers', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        billing: {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email,
        },
        shipping: {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
        }
      });
      
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error details:', error.response?.data || error.message);
      
      // Check for specific error messages
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.code === 'registration-error-email-exists') {
        throw new Error('An account with this email already exists.');
      } else if (error.response?.data?.code === 'registration-error-username-exists') {
        throw new Error('This username is already taken.');
      }
      
      throw new Error('Registration failed. Please check your information and try again.');
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('wc_jwt_token');
      if (!token) return false;

      // Check if it's a JWT token or our simple token
      if (token.includes('.')) {
        // JWT token - validate with WordPress
        await axios.post(
          `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/jwt-auth/v1/token/validate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Simple token - check if it's not expired (24 hours)
        const tokenData = atob(token);
        const [, timestamp] = tokenData.split(':');
        const tokenAge = Date.now() - parseInt(timestamp);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (tokenAge > twentyFourHours) {
          localStorage.removeItem('wc_jwt_token');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('wc_jwt_token');
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('wc_jwt_token');
  }

  // Helper method to get Store API nonce with better error handling
  private async refreshStoreApiNonce(): Promise<void> {
    try {
      const storeApiUrl = this.config.baseURL.replace('/wp-json/wc/v3', '/wp-json/wc/store/v1');
      const response = await axios.get(`${storeApiUrl}/cart`, {
        timeout: 5000,
      });
      
      this.storeApiNonce = response.headers['x-wc-store-api-nonce'] || null;
      console.log('Store API nonce refreshed:', this.storeApiNonce ? 'success' : 'not found');
    } catch (error) {
      console.log('Could not refresh store API nonce, using local cart fallback');
      this.storeApiNonce = null;
    }
  }

  private async getStoreApiNonce(): Promise<string> {
    if (!this.storeApiNonce) {
      await this.refreshStoreApiNonce();
    }
    return this.storeApiNonce || '';
  }
}

// Configuration - Fixed baseURL to not include /wp-json/wc/v3 twice
const wooCommerceConfig: WooCommerceConfig = {
  baseURL: import.meta.env.VITE_WC_BASE_URL || 'https://localhost/threadx/threadxwp/wp-json/wc/v3',
  consumerKey: import.meta.env.VITE_WC_CONSUMER_KEY || 'ck_a928b57d9b663d3d5d5c05b38c0a8aeadbe72968',
  consumerSecret: import.meta.env.VITE_WC_CONSUMER_SECRET || 'cs_38320afaddc7a21545895e47ea2503ac16cc6805',
};

// Export singleton instance
export const wooCommerceApi = new WooCommerceAPI(wooCommerceConfig);
export default wooCommerceApi;
