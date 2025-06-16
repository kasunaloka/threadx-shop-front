
import axios from 'axios';
import { User, LoginCredentials, RegisterData } from '../types/auth';

const WORDPRESS_API_URL = 'https://your-wordpress-site.com/wp-json';

export class WordPressAuthService {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string } | null> {
    try {
      const response = await axios.post(`${WORDPRESS_API_URL}/jwt-auth/v1/token`, {
        username: credentials.username,
        password: credentials.password,
      });

      if (response.data.token) {
        const user: User = {
          id: response.data.user_id?.toString() || '',
          email: response.data.user_email || '',
          username: response.data.user_nicename || credentials.username,
          displayName: response.data.user_display_name || credentials.username,
          source: 'wordpress',
        };

        localStorage.setItem('wp_token', response.data.token);
        return { user, token: response.data.token };
      }
      return null;
    } catch (error) {
      console.error('WordPress login error:', error);
      throw new Error('Invalid username or password');
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      const response = await axios.post(`${WORDPRESS_API_URL}/wp/v2/users`, {
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      return {
        id: response.data.id?.toString() || '',
        email: response.data.email || data.email,
        username: response.data.username || data.username,
        displayName: response.data.name || data.username,
        firstName: response.data.first_name || data.firstName,
        lastName: response.data.last_name || data.lastName,
        source: 'wordpress',
      };
    } catch (error) {
      console.error('WordPress registration error:', error);
      throw new Error('Registration failed');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await axios.post(`${WORDPRESS_API_URL}/wp/v2/users/reset-password`, {
        user_login: email,
      });
    } catch (error) {
      console.error('WordPress password reset error:', error);
      throw new Error('Password reset failed');
    }
  }

  logout(): void {
    localStorage.removeItem('wp_token');
  }

  getStoredToken(): string | null {
    return localStorage.getItem('wp_token');
  }
}
