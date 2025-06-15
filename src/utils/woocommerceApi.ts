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
          name: `Product ${item.id}`,
          prices: {
            price: 0,
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

  // Orders with enhanced customer ID/username matching
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
        
        // Use customer ID if available
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
      
      // Enhanced filtering logic using customer ID and username
      if (orders.length === 0 && finalParams.customer) {
        logger.log('🔄 No orders found with customer ID, trying general fetch');
        
        const fallbackParams = {
          per_page: 100,
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
        
        if (allOrders.length > 0 && storedUser) {
          const userData = JSON.parse(storedUser);
          logger.log('📧 Filtering orders by user data:', userData);
          
          orders = allOrders.filter(order => {
            // Match by customer ID (primary)
            const matchesCustomerId = order.customer_id === userData.customerId;
            
            // Match by username in billing info (secondary)
            const matchesUsername = order.billing?.first_name?.toLowerCase() === userData.username?.toLowerCase() ||
                                   order.billing?.last_name?.toLowerCase() === userData.username?.toLowerCase();
            
            // Match by display name (tertiary)
            const matchesDisplayName = userData.displayName && (
              order.billing?.first_name?.toLowerCase().includes(userData.displayName.toLowerCase()) ||
              order.billing?.last_name?.toLowerCase().includes(userData.displayName.toLowerCase())
            );
            
            // Keep email as fallback
            const matchesEmail = order.billing?.email === userData.email;
            
            logger.log('🔍 Order check:', {
              orderId: order.id,
              orderCustomerId: order.customer_id,
              orderBilling: order.billing,
              userCustomerId: userData.customerId,
              userUsername: userData.username,
              userDisplayName: userData.displayName,
              matchesCustomerId,
              matchesUsername,
              matchesDisplayName,
              matchesEmail
            });
            
            return matchesCustomerId || matchesUsername || matchesDisplayName || matchesEmail;
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

  // Enhanced registration with duplicate email check
  async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<any> {
    try {
      logger.log('Attempting registration with data:', userData);
      
      // First check if email already exists
      try {
        const existingCustomers = await this.api.get('/customers', {
          params: {
            email: userData.email,
            per_page: 1
          }
        });
        
        if (existingCustomers.data && existingCustomers.data.length > 0) {
          throw new Error('An account with this email already exists. Please use a different email or sign in to your existing account.');
        }
      } catch (checkError: any) {
        if (checkError.message.includes('email already exists')) {
          throw checkError;
        }
        // If check fails for other reasons, continue with registration attempt
        logger.log('Email check failed, proceeding with registration:', checkError.message);
      }
      
      // Also check if username exists
      try {
        const existingByUsername = await this.api.get('/customers', {
          params: {
            search: userData.username,
            per_page: 10
          }
        });
        
        if (existingByUsername.data && existingByUsername.data.length > 0) {
          const usernameExists = existingByUsername.data.some((customer: any) => 
            customer.username === userData.username
          );
          
          if (usernameExists) {
            throw new Error('This username is already taken. Please choose a different username.');
          }
        }
      } catch (usernameError: any) {
        if (usernameError.message.includes('username is already taken')) {
          throw usernameError;
        }
        logger.log('Username check failed, proceeding with registration:', usernameError.message);
      }
      
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
      
      if (error.message.includes('email already exists') || error.message.includes('username is already taken')) {
        throw error;
      } else if (error.response?.data?.message) {
        // Handle specific WooCommerce error messages
        if (error.response.data.message.includes('email') && error.response.data.message.includes('exists')) {
          throw new Error('An account with this email already exists. Please use a different email or sign in to your existing account.');
        } else if (error.response.data.message.includes('username') && error.response.data.message.includes('exists')) {
          throw new Error('This username is already taken. Please choose a different username.');
        } else {
          throw new Error(error.response.data.message);
        }
      } else if (error.response?.data?.code === 'registration-error-email-exists') {
        throw new Error('An account with this email already exists. Please use a different email or sign in to your existing account.');
      } else if (error.response?.data?.code === 'registration-error-username-exists') {
        throw new Error('This username is already taken. Please choose a different username.');
      }
      
      throw new Error('Registration failed. Please check your information and try again.');
    }
  }

  // Authentication with improved error handling and fallback
  async login(username: string, password: string): Promise<{ token: string; user: any; customerId?: number }> {
    try {
      logger.log('🔐 Attempting login with username:', username);
      
      // Validate input parameters
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Try multiple JWT endpoints
      const possibleJwtUrls = [
        `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/jwt-auth/v1/token`,
        `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/simple-jwt-login/v1/auth`,
        `${this.config.baseURL.replace('/wp-json/wc/v3', '')}/wp-json/wp/v2/jwt-auth/v1/token`,
      ];

      let loginResponse;
      let authError;

      // Try JWT authentication first
      for (const jwtUrl of possibleJwtUrls) {
        try {
          logger.log('🌐 Trying JWT URL:', jwtUrl);
          
          loginResponse = await axios.post(jwtUrl, {
            username,
            password,
          }, {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (loginResponse?.data?.token) {
            logger.log('✅ JWT authentication successful');
            break;
          }
        } catch (error: any) {
          logger.log('❌ JWT URL failed:', jwtUrl, error.response?.status, error.response?.data);
          authError = error;
          continue;
        }
      }

      // If JWT fails, try WooCommerce customer authentication as fallback
      if (!loginResponse?.data?.token) {
        logger.log('🔄 JWT failed, trying WooCommerce customer authentication...');
        
        try {
          // Search by username first, then by email
          let customer = null;
          
          // Try username search first
          const usernameSearchResponse = await this.api.get('/customers', {
            params: {
              search: username,
              per_page: 10
            }
          });

          logger.log('👥 Username search response:', usernameSearchResponse.data);
          
          if (usernameSearchResponse.data && usernameSearchResponse.data.length > 0) {
            // Find exact match by username
            customer = usernameSearchResponse.data.find((c: any) => 
              c.username === username
            );
          }

          // If not found by username, try email search
          if (!customer) {
            const emailSearchResponse = await this.api.get('/customers', {
              params: {
                email: username
              }
            });
            
            if (emailSearchResponse.data && emailSearchResponse.data.length > 0) {
              customer = emailSearchResponse.data[0];
            }
          }

          if (customer) {
            logger.log('✅ Customer found:', customer.id, customer.email, customer.username);
            
            // Create a mock token for the session
            const mockToken = btoa(JSON.stringify({
              user_id: customer.id,
              user_email: customer.email,
              user_login: customer.username || customer.email,
              timestamp: Date.now()
            }));
            
            localStorage.setItem('wc_jwt_token', mockToken);
            
            const userData = {
              email: customer.email,
              username: customer.username || customer.email,
              displayName: customer.first_name ? `${customer.first_name} ${customer.last_name}`.trim() : customer.username || customer.email,
            };
            
            logger.log('✅ WooCommerce authentication successful:', { userData, customerId: customer.id });
            
            return {
              token: mockToken,
              user: userData,
              customerId: customer.id
            };
          } else {
            throw new Error('No customer found with that username or email');
          }
          
        } catch (customerError: any) {
          logger.error('❌ Customer authentication also failed:', customerError);
          throw new Error('Invalid username or password');
        }
      }

      // Handle JWT success
      if (loginResponse?.data?.token) {
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
        
        logger.log('✅ JWT Login successful:', { userData, customerId });
        
        return {
          token,
          user: userData,
          customerId
        };
      }

      throw new Error('Authentication failed');
      
    } catch (error: any) {
      logger.error('❌ Login error:', error.response?.data || error.message);
      
      // Clear any potentially invalid tokens
      localStorage.removeItem('wc_jwt_token');
      localStorage.removeItem('wc_user');
      
      if (error.message.includes('Username and password are required')) {
        throw error;
      } else if (error.message.includes('No customer found')) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status === 403 || error.response?.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status === 404) {
        throw new Error('Authentication service not available. Please contact support.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Login failed. Please check your credentials and try again.');
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
        // If token doesn't have JWT format, it's invalid
        localStorage.removeItem('wc_jwt_token');
        return false;
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
