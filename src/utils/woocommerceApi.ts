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

export const wooCommerceApi = {
  login: async (username: string, password: string): Promise<{ user: WooCommerceUser; customerId?: number }> => {
    try {
      logger.log('Attempting to login to WordPress with username:', username);

      const auth = 'Basic ' + Buffer.from(WC_CONSUMER_KEY + ':' + WC_CONSUMER_SECRET).toString('base64');

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

      const auth = 'Basic ' + Buffer.from(WC_CONSUMER_KEY + ':' + WC_CONSUMER_SECRET).toString('base64');

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
    // No direct logout endpoint in WooCommerce REST API, typically handled client-side by removing tokens/cookies
    logger.log('Logging out from WordPress (client-side)');
    // Remove any stored tokens or user data from local storage/cookies
  },

  validateToken: async (): Promise<boolean> => {
    try {
      // Check if the WooCommerce API is accessible and the credentials are valid
      const auth = 'Basic ' + Buffer.from(WC_CONSUMER_KEY + ':' + WC_CONSUMER_SECRET).toString('base64');
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

      // WordPress doesn't return JSON for this endpoint, but if we get here without error, it likely worked
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
};
