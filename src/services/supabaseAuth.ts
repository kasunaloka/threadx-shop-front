
import { supabase } from '../lib/supabase';
import { User, LoginCredentials, RegisterData } from '../types/auth';

export class SupabaseAuthService {
  async login(credentials: LoginCredentials): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username.includes('@') ? credentials.username : `${credentials.username}@placeholder.com`,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        return {
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.user_metadata?.username || credentials.username,
          displayName: data.user.user_metadata?.display_name || credentials.username,
          source: 'supabase',
        };
      }
      return null;
    } catch (error) {
      console.error('Supabase login error:', error);
      throw new Error('Invalid credentials');
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      const email = data.email;
      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: data.username,
            display_name: data.firstName && data.lastName 
              ? `${data.firstName} ${data.lastName}` 
              : data.username,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) throw error;

      if (authData.user) {
        return {
          id: authData.user.id,
          email: authData.user.email || data.email,
          username: data.username,
          displayName: data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}` 
            : data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          source: 'supabase',
        };
      }
      throw new Error('Registration failed');
    } catch (error) {
      console.error('Supabase registration error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Supabase password reset error:', error);
      throw new Error('Password reset failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Supabase logout error:', error);
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '',
          displayName: session.user.user_metadata?.display_name || session.user.user_metadata?.username || '',
          firstName: session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.last_name,
          source: 'supabase',
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}
