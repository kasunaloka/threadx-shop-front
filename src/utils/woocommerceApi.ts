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

  constructor(config: WooCommerceConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: `${config.baseURL}/wp-json/wc/v3`,
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
      throw new Error('Failed to fetch products');
    }
  }

  async getProduct(id: number): Promise<WooCommerceProduct> {
    try {
      const response: AxiosResponse<WooCommerceProduct> = await this.api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
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

  // Cart (using WooCommerce Store API)
  async addToCart(productId: number, quantity: number = 1, variation?: Record<string, string>): Promise<any> {
    try {
      const response = await axios.post(
        `${this.config.baseURL}/wp-json/wc/store/v1/cart/add-item`,
        {
          id: productId,
          quantity,
          variation,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-WC-Store-API-Nonce': await this.getStoreApiNonce(),
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to add item to cart');
    }
  }

  async getCart(): Promise<any> {
    try {
      const response = await axios.get(`${this.config.baseURL}/wp-json/wc/store/v1/cart`, {
        headers: {
          'X-WC-Store-API-Nonce': await this.getStoreApiNonce(),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch cart');
    }
  }

  async updateCartItem(key: string, quantity: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.config.baseURL}/wp-json/wc/store/v1/cart/update-item`,
        {
          key,
          quantity,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-WC-Store-API-Nonce': await this.getStoreApiNonce(),
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to update cart item');
    }
  }

  async removeCartItem(key: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.config.baseURL}/wp-json/wc/store/v1/cart/remove-item`,
        { key },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-WC-Store-API-Nonce': await this.getStoreApiNonce(),
          },
        }
      );
      return response.data;
    } catch (error) {
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
      const response = await axios.post(`${this.config.baseURL}/wp-json/jwt-auth/v1/token`, {
        username,
        password,
      });
      
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
    } catch (error) {
      throw new Error('Login failed');
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
      const response = await axios.post(`${this.config.baseURL}/wp-json/wp/v2/users`, userData);
      return response.data;
    } catch (error) {
      throw new Error('Registration failed');
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('wc_jwt_token');
      if (!token) return false;

      await axios.post(
        `${this.config.baseURL}/wp-json/jwt-auth/v1/token/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return true;
    } catch (error) {
      localStorage.removeItem('wc_jwt_token');
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('wc_jwt_token');
  }

  // Helper method to get Store API nonce
  private async getStoreApiNonce(): Promise<string> {
    try {
      const response = await axios.get(`${this.config.baseURL}/wp-json/wc/store/v1/cart`);
      return response.headers['x-wc-store-api-nonce'] || '';
    } catch (error) {
      return '';
    }
  }
}

// Configuration - Using import.meta.env for Vite instead of process.env
const wooCommerceConfig: WooCommerceConfig = {
  baseURL: import.meta.env.VITE_WC_BASE_URL || 'https://localhost/threadx/threadxwp/wp-json/wc/v3',
  consumerKey: import.meta.env.VITE_WC_CONSUMER_KEY || 'ck_a928b57d9b663d3d5d5c05b38c0a8aeadbe72968',
  consumerSecret: import.meta.env.VITE_WC_CONSUMER_SECRET || 'cs_38320afaddc7a21545895e47ea2503ac16cc6805',
};

// Export singleton instance
export const wooCommerceApi = new WooCommerceAPI(wooCommerceConfig);
export default wooCommerceApi;
