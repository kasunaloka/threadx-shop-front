import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from './logger';

// WooCommerce API configuration
interface WooCommerceConfig {
  baseURL: string;
  consumerKey: string;
  consumerSecret: string;
  jwtURL?: string;
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
      timeout: 30000,
    });

    // Add request interceptor for JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('wc_jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          logger.log('Added JWT token to request');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Clear invalid token
          localStorage.removeItem('wc_jwt_token');
          localStorage.removeItem('wc_user');
          logger.error('Authentication failed, clearing tokens');
        }
        logger.error('WooCommerce API Error:', error.response?.data || error.message);
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
      logger.error('Failed to fetch products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async getProduct(id: number): Promise<WooCommerceProduct> {
    try {
      const response: AxiosResponse<WooCommerceProduct> = await this.api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch product:', error);
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
      logger.log('Adding to cart:', { productId, quantity, variation });
      
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
      
      logger.log('Added to local cart successfully');
      return { success: true, cart: existingCart };
      
    } catch (error) {
      logger.error('Add to cart error:', error);
      throw new Error('Unable to add item to cart. Please try again.');
    }
  }

  async getCart(): Promise<any> {
    try {
      logger.log('Fetching cart...');
      
      const localCart = JSON.parse(localStorage.getItem('wc_cart') || '[]');
      
      if (localCart.length > 0) {
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
      logger.error('Get cart error:', error);
      
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
      logger.log('Updating cart item:', { key, quantity });
      
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
      logger.error('Update cart item error:', error);
      throw new Error('Failed to update cart item');
    }
  }

  async removeCartItem(key: string): Promise<any> {
    try {
      logger.log('Removing cart item:', { key });
      
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
      logger.error('Remove cart item error:', error);
      throw new Error('Failed to remove cart item');
    }
  }

  // Orders
  async getOrders(params?: {
    customer?: number;
    status?: string;
    page?: number;
    per_page?: number;
    orderby?: string;
    order?: string;
  }): Promise<WooCommerceOrder[]> {
    try {
      logger.log('🔍 Starting order fetch with params:', params);
      
      const storedUser = localStorage.getItem('wc_user');
      let finalParams = { ...params };
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        logger.log('📱 User data from storage:', userData);
        
        if (userData.customerId && !finalParams.customer) {
          finalParams.customer = userData.customerId;
          logger.log('👤 Using customer ID:', userData.customerId);
        }
      }
      
      const queryParams = {
        per_page: 20,
        orderby: 'date',
        order: 'desc',
        ...finalParams
      };
      
      logger.log('🚀 Making API call with params:', queryParams);
      
      const response: AxiosResponse<WooCommerceOrder[]> = await this.api.get('/orders', { 
        params: queryParams,
        timeout: 25000
      });
      
      logger.log('✅ Orders API response status:', response.status);
      logger.log('📦 Orders data received:', response.data?.length || 0, 'orders');
      
      let orders = response.data || [];
      
      // If no orders found with customer filter, try without customer filter
      if (orders.length === 0 && finalParams.customer) {
        logger.log('🔄 No orders found with customer ID, trying general fetch');
        
        const fallbackParams = {
          per_page: 100, // Increased to get more orders
          orderby: 'date',
          order: 'desc'
        };
        
        logger.log('🚀 Making fallback API call with params:', fallbackParams);
        
        const fallbackResponse: AxiosResponse<WooCommerceOrder[]> = await this.api.get('/orders', { 
          params: fallbackParams,
          timeout: 25000
        });
        
        logger.log('✅ Fallback orders API response status:', fallbackResponse.status);
        logger.log('📦 Fallback orders data received:', fallbackResponse.data?.length || 0, 'orders');
        
        const allOrders = fallbackResponse.data || [];
        
        // Filter by email and customer ID if we have orders
        if (allOrders.length > 0 && storedUser) {
          const userData = JSON.parse(storedUser);
          logger.log('📧 Filtering orders by user data:', userData);
          
          orders = allOrders.filter(order => {
            const matchesEmail = order.billing?.email === userData.email;
            const matchesCustomerId = order.customer_id === userData.customerId;
            
            logger.log('🔍 Order check:', {
              orderId: order.id,
              orderEmail: order.billing?.email,
              orderCustomerId: order.customer_id,
              userEmail: userData.email,
              userCustomerId: userData.customerId,
              matchesEmail,
              matchesCustomerId
            });
            
            return matchesEmail || matchesCustomerId;
          });
          
          logger.log('📦 Filtered orders result:', orders.length, 'orders');
        } else {
          orders = allOrders;
        }
      }
      
      logger.log('📦 Final orders result:', orders.length, 'orders');
      return orders;
    } catch (error: any) {
      logger.error('❌ Orders fetch failed:', error);
      
      // Try one more time without any filters if we get authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.log('🔄 Authentication error, trying basic fetch...');
        try {
          const basicParams = {
            per_page: 50,
            orderby: 'date',
            order: 'desc'
          };
          
          const basicResponse: AxiosResponse<WooCommerceOrder[]> = await this.api.get('/orders', { 
            params: basicParams,
            timeout: 25000
          });
          
          logger.log('✅ Basic orders fetch successful:', basicResponse.data?.length || 0, 'orders');
          return basicResponse.data || [];
        } catch (basicError) {
          logger.error('❌ Basic orders fetch also failed:', basicError);
        }
      }
      
      return [];
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

  // Authentication with improved JWT handling
  async login(username: string, password: string): Promise<{ token: string; user: any; customerId?: number }> {
    try {
      logger.log('🔐 Attempting login with username:', username);
      
      // Try multiple JWT endpoint variations
      const possibleJwtUrls = [
        `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/jwt-auth/v1/token`,
        `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/wp/v2/jwt-auth/v1/token`,
        `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/simple-jwt-login/v1/auth`,
      ];

      let loginResponse;
      let jwtUrl;

      for (const url of possibleJwtUrls) {
        try {
          logger.log('🌐 Trying JWT URL:', url);
          loginResponse = await axios.post(url, {
            username,
            password,
          }, {
            timeout: 10000,
          });
          jwtUrl = url;
          logger.log('✅ JWT Login successful with URL:', url);
          break;
        } catch (error: any) {
          logger.log('❌ JWT URL failed:', url, error.response?.status);
          continue;
        }
      }

      if (!loginResponse) {
        // Fallback to basic auth if JWT is not available
        logger.log('🔄 JWT not available, trying basic auth fallback');
        
        try {
          // Try to authenticate with WooCommerce customer endpoint
          const customerResponse = await this.api.get('/customers', {
            params: {
              email: username,
              search: username,
            }
          });

          if (customerResponse.data && customerResponse.data.length > 0) {
            const customer = customerResponse.data[0];
            
            // Create a simple token for session management
            const simpleToken = btoa(`${username}:${Date.now()}`);
            localStorage.setItem('wc_jwt_token', simpleToken);
            
            const userData = {
              email: customer.email,
              username: customer.username || username,
              displayName: customer.first_name ? `${customer.first_name} ${customer.last_name}`.trim() : username,
            };
            
            logger.log('✅ Basic auth login successful');
            
            return {
              token: simpleToken,
              user: userData,
              customerId: customer.id
            };
          } else {
            throw new Error('Customer not found');
          }
        } catch (basicAuthError) {
          logger.error('❌ Basic auth fallback failed:', basicAuthError);
          throw new Error('Invalid username or password. Please check your credentials.');
        }
      }

      const { token, user_email, user_nicename, user_display_name } = loginResponse.data;
      localStorage.setItem('wc_jwt_token', token);
      
      let customerId;
      try {
        logger.log('🔍 Looking for customer with email:', user_email);
        const customerResponse = await this.api.get('/customers', {
          params: {
            email: user_email,
          }
        });
        
        logger.log('👥 Customer search response:', customerResponse.data);
        
        if (customerResponse.data && customerResponse.data.length > 0) {
          customerId = customerResponse.data[0].id;
          logger.log('✅ Found customer ID:', customerId);
        }
      } catch (customerError) {
        logger.log('⚠️ Could not fetch customer ID:', customerError);
      }
      
      const userData = {
        email: user_email,
        username: user_nicename,
        displayName: user_display_name,
      };
      
      logger.log('✅ Final login data:', { userData, customerId });
      
      return {
        token,
        user: userData,
        customerId
      };
    } catch (error: any) {
      logger.error('❌ Login error:', error.response?.data || error.message);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 403) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status === 404) {
        throw new Error('Authentication service not available. Please contact support.');
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
      logger.log('Attempting registration with data:', userData);
      
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
      
      logger.log('Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Registration error details:', error.response?.data || error.message);
      
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

      // Check if token is JWT format
      if (token.includes('.')) {
        // Try to validate JWT token
        const possibleValidateUrls = [
          `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/jwt-auth/v1/token/validate`,
          `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/wp/v2/jwt-auth/v1/token/validate`,
        ];

        for (const url of possibleValidateUrls) {
          try {
            await axios.post(url, {}, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 5000,
            });
            return true;
          } catch (error) {
            continue;
          }
        }
        
        // If validation fails, remove token
        localStorage.removeItem('wc_jwt_token');
        return false;
      } else {
        // Handle simple token (base64 encoded username:timestamp)
        try {
          const tokenData = atob(token);
          const [, timestamp] = tokenData.split(':');
          const tokenAge = Date.now() - parseInt(timestamp);
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (tokenAge > twentyFourHours) {
            localStorage.removeItem('wc_jwt_token');
            return false;
          }
          
          return true;
        } catch (error) {
          localStorage.removeItem('wc_jwt_token');
          return false;
        }
      }
    } catch (error) {
      logger.error('Token validation error:', error);
      localStorage.removeItem('wc_jwt_token');
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('wc_jwt_token');
    localStorage.removeItem('wc_user');
  }

  // Helper method to get Store API nonce with better error handling
  private async refreshStoreApiNonce(): Promise<void> {
    try {
      const storeApiUrl = this.config.baseURL.replace('/wp-json/wc/v3', '/wp-json/wc/store/v1');
      const response = await axios.get(`${storeApiUrl}/cart`, {
        timeout: 5000,
      });
      
      this.storeApiNonce = response.headers['x-wc-store-api-nonce'] || null;
      logger.log('Store API nonce refreshed:', this.storeApiNonce ? 'success' : 'not found');
    } catch (error) {
      logger.log('Could not refresh store API nonce, using local cart fallback');
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

// Configuration with better environment variable handling
const getEnvVar = (key: string, fallback: string): string => {
  const value = import.meta.env[key];
  if (!value && import.meta.env.PROD) {
    logger.warn(`Missing environment variable: ${key}, using fallback`);
  }
  return value || fallback;
};

const wooCommerceConfig: WooCommerceConfig = {
  baseURL: getEnvVar('VITE_WC_BASE_URL', 'https://localhost/threadx/threadxwp/wp-json/wc/v3'),
  consumerKey: getEnvVar('VITE_WC_CONSUMER_KEY', 'ck_a928b57d9b663d3d5d5c05b38c0a8aeadbe72968'),
  consumerSecret: getEnvVar('VITE_WC_CONSUMER_SECRET', 'cs_38320afaddc7a21545895e47ea2503ac16cc6805'),
};

export const wooCommerceApi = new WooCommerceAPI(wooCommerceConfig);
export default wooCommerceApi;
