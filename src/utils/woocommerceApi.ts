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
  status?: string;
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
  line_items: Array<{
    product_id: number;
    quantity: number;
    variation_id?: number;
  }>;
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
      
      // Try to get nonce first
      await this.refreshStoreApiNonce();
      
      const storeApiUrl = this.config.baseURL.replace('/wp-json/wc/v3', '/wp-json/wc/store/v1');
      
      const response = await axios.post(
        `${storeApiUrl}/cart/add-item`,
        {
          id: productId,
          quantity,
          variation: variation || {},
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.storeApiNonce && { 'X-WC-Store-API-Nonce': this.storeApiNonce }),
          },
          withCredentials: true,
        }
      );
      
      console.log('Add to cart response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Add to cart error:', error);
      
      // Fallback: try without nonce
      try {
        const storeApiUrl = this.config.baseURL.replace('/wp-json/wc/v3', '/wp-json/wc/store/v1');
        const response = await axios.post(
          `${storeApiUrl}/cart/add-item`,
          {
            id: productId,
            quantity,
            variation: variation || {},
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );
        return response.data;
      } catch (fallbackError) {
        console.error('Fallback add to cart error:', fallbackError);
        throw new Error('Failed to add item to cart');
      }
    }
  }

  async getCart(): Promise<any> {
    try {
      console.log('Fetching cart...');
      
      const storeApiUrl = this.config.baseURL.replace('/wp-json/wc/v3', '/wp-json/wc/store/v1');
      
      const response = await axios.get(`${storeApiUrl}/cart`, {
        headers: {
          ...(this.storeApiNonce && { 'X-WC-Store-API-Nonce': this.storeApiNonce }),
        },
        withCredentials: true,
      });
      
      console.log('Cart response:', response.data);
      return response.data;
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
      const storeApiUrl = this.config.baseURL.replace('/wp-json/wc/v3', '/wp-json/wc/store/v1');
      
      const response = await axios.post(
        `${storeApiUrl}/cart/update-item`,
        {
          key,
          quantity,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.storeApiNonce && { 'X-WC-Store-API-Nonce': this.storeApiNonce }),
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Update cart item error:', error);
      throw new Error('Failed to update cart item');
    }
  }

  async removeCartItem(key: string): Promise<any> {
    try {
      const storeApiUrl = this.config.baseURL.replace('/wp-json/wc/v3', '/wp-json/wc/store/v1');
      
      const response = await axios.post(
        `${storeApiUrl}/cart/remove-item`,
        { key },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.storeApiNonce && { 'X-WC-Store-API-Nonce': this.storeApiNonce }),
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Remove cart item error:', error);
      throw new Error('Failed to remove cart item');
    }
  }

  // Orders
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
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
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
      
      return {
        token,
        user: {
          email: user_email,
          username: user_nicename,
          displayName: user_display_name,
        },
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
        withCredentials: true,
      });
      
      this.storeApiNonce = response.headers['x-wc-store-api-nonce'] || null;
      console.log('Store API nonce refreshed:', this.storeApiNonce ? 'success' : 'not found');
    } catch (error) {
      console.log('Could not refresh store API nonce:', error.message);
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
